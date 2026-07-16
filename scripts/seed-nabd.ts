/**
 * Seed script for Nabd | Pulse
 *
 * Creates:
 *  1. Demo user Sara with full financial data
 *  2. Community profiles from the CSV (per-user 12-month averages)
 *
 * Run: npx tsx scripts/seed-nabd.ts
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../lib/db/src/schema/index.js";
import { eq } from "drizzle-orm";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

// ── Helper: compute pulse score from community averages ───────────────────────
function computeCommunityPulseScore(data: {
  avgMonthlyIncome: number;
  avgTotalSpending: number;
  avgSavings: number;
  avgObligations: number;
}): number {
  const { avgMonthlyIncome: inc, avgTotalSpending: spend, avgSavings: save, avgObligations: oblig } = data;
  if (inc === 0) return 50;

  const spendRatio = spend / inc;
  let spendScore = spendRatio <= 0.40 ? 100 : spendRatio <= 0.55 ? 80 : spendRatio <= 0.70 ? 60 : spendRatio <= 0.85 ? 35 : 10;

  const saveRate = save / inc;
  let saveScore = saveRate >= 0.20 ? 100 : saveRate >= 0.10 ? 75 : saveRate >= 0.05 ? 50 : 25;

  const obligRatio = oblig / inc;
  let obligScore = obligRatio <= 0.20 ? 100 : obligRatio <= 0.30 ? 75 : obligRatio <= 0.40 ? 50 : 25;

  return Math.round(spendScore * 0.35 + saveScore * 0.35 + obligScore * 0.30);
}

function getIncomeBracket(salary: number): string {
  if (salary < 5000) return "low";
  if (salary < 10000) return "medium";
  if (salary < 20000) return "high";
  return "very_high";
}

// ── Parse CSV ─────────────────────────────────────────────────────────────────
interface CsvRow {
  User_ID: number;
  Month: string;
  Monthly_Income: number;
  Housing: number;
  Food: number;
  Transport: number;
  Entertainment: number;
  Savings: number;
  Loans: number;
  Subscriptions: number;
  Remaining_Balance: number;
}

function parseCSV(filePath: string): CsvRow[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.trim().split("\n");
  const headers = lines[0]!.split(",");
  return lines.slice(1).map(line => {
    const vals = line.split(",");
    const row: Record<string, number | string> = {};
    headers.forEach((h, i) => {
      const v = vals[i]?.trim() ?? "";
      row[h.trim()] = isNaN(Number(v)) || h.trim() === "Month" ? v : Number(v);
    });
    return row as unknown as CsvRow;
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🌱 Seeding Nabd database...");

  // ── 1. Demo user Sara ──────────────────────────────────────────────────────
  const saraEmail = "sara@nabd.demo";
  const [existingSara] = await db.select().from(schema.usersTable).where(eq(schema.usersTable.email, saraEmail));

  let saraId: string;
  if (existingSara) {
    saraId = existingSara.id;
    console.log("ℹ️  Sara already exists, skipping user creation");
  } else {
    const passwordHash = await bcrypt.hash("Demo1234!", 12);
    const [sara] = await db
      .insert(schema.usersTable)
      .values({
        name: "سارة",
        email: saraEmail,
        passwordHash,
        phone: "0501234567",
        city: "الرياض",
        age: 28,
        maritalStatus: "single",
        housingType: "rent",
        dependentsCount: 0,
      })
      .returning();
    saraId = sara!.id;
    console.log(`✅ Created demo user Sara (id: ${saraId})`);
  }

  // Income
  await db
    .insert(schema.incomeTable)
    .values({
      userId: saraId,
      monthlySalary: 7500,
      salaryDay: 1,
      hasExtraIncome: false,
      extraIncomeAmount: 0,
    })
    .onConflictDoUpdate({
      target: schema.incomeTable.userId,
      set: { monthlySalary: 7500, updatedAt: new Date() },
    });
  console.log("✅ Sara income set");

  // Obligations
  const existingObligations = await db.select().from(schema.obligationsTable).where(eq(schema.obligationsTable.userId, saraId));
  if (existingObligations.length === 0) {
    await db.insert(schema.obligationsTable).values([
      { userId: saraId, type: "قرض شخصي", amount: 800, dueDate: 5, isRecurring: true },
      { userId: saraId, type: "تأمين سيارة", amount: 400, dueDate: 10, isRecurring: true },
    ]);
    console.log("✅ Sara obligations created");
  }

  // Budget
  const existingBudget = await db.select().from(schema.budgetTable).where(eq(schema.budgetTable.userId, saraId));
  if (existingBudget.length === 0) {
    await db.insert(schema.budgetTable).values([
      { userId: saraId, category: "طعام ومطاعم", monthlyLimit: 800, currentSpending: 620 },
      { userId: saraId, category: "مواصلات", monthlyLimit: 400, currentSpending: 310 },
      { userId: saraId, category: "تسوق", monthlyLimit: 500, currentSpending: 480 },
      { userId: saraId, category: "ترفيه", monthlyLimit: 300, currentSpending: 190 },
      { userId: saraId, category: "فواتير", monthlyLimit: 500, currentSpending: 420 },
      { userId: saraId, category: "اشتراكات", monthlyLimit: 200, currentSpending: 180 },
    ]);
    console.log("✅ Sara budget created");
  }

  // Goals
  const existingGoals = await db.select().from(schema.goalsTable).where(eq(schema.goalsTable.userId, saraId));
  if (existingGoals.length === 0) {
    const deadline = new Date();
    deadline.setMonth(deadline.getMonth() + 12);
    await db.insert(schema.goalsTable).values([
      { userId: saraId, goalType: "صندوق الطوارئ", targetAmount: 15000, currentAmount: 4200, deadline, monthlyRequiredAmount: 900 },
      { userId: saraId, goalType: "رحلة سياحية", targetAmount: 8000, currentAmount: 1800, deadline, monthlyRequiredAmount: 520 },
    ]);
    console.log("✅ Sara goals created");
  }

  // Savings wallet
  const existingSavings = await db.select().from(schema.savingsTransactionsTable).where(eq(schema.savingsTransactionsTable.userId, saraId));
  if (existingSavings.length === 0) {
    const now = new Date();
    await db.insert(schema.savingsTransactionsTable).values([
      { userId: saraId, amount: 1500, note: "راتب يناير", date: new Date(now.getFullYear(), now.getMonth() - 2, 5) },
      { userId: saraId, amount: 1500, note: "راتب فبراير", date: new Date(now.getFullYear(), now.getMonth() - 1, 5) },
      { userId: saraId, amount: 500, note: "مكافأة العمل", date: new Date(now.getFullYear(), now.getMonth() - 1, 15) },
      { userId: saraId, amount: 500, note: "ادخار شهري", date: new Date(now.getFullYear(), now.getMonth(), 3) },
    ]);
    console.log("✅ Sara savings transactions created");
  }

  // Savings goal
  await db
    .insert(schema.savingsGoalsTable)
    .values({ userId: saraId, goal: 15000 })
    .onConflictDoUpdate({ target: schema.savingsGoalsTable.userId, set: { goal: 15000 } });

  // Financial transactions
  const existingTx = await db.select().from(schema.transactionsTable).where(eq(schema.transactionsTable.userId, saraId));
  if (existingTx.length === 0) {
    const now = new Date();
    const m = now.getMonth();
    const y = now.getFullYear();
    await db.insert(schema.transactionsTable).values([
      { userId: saraId, type: "income", category: "راتب", amount: 7500, description: "راتب الشهر", transactionDate: new Date(y, m, 1), source: "صاحب العمل" },
      { userId: saraId, type: "expense", category: "طعام ومطاعم", amount: 200, description: "بقالة أسبوعية", transactionDate: new Date(y, m, 3), paymentMethod: "بطاقة" },
      { userId: saraId, type: "expense", category: "مواصلات", amount: 150, description: "وقود", transactionDate: new Date(y, m, 4), paymentMethod: "نقد" },
      { userId: saraId, type: "expense", category: "فواتير", amount: 300, description: "فاتورة كهرباء", transactionDate: new Date(y, m, 5), paymentMethod: "تحويل" },
      { userId: saraId, type: "expense", category: "تسوق", amount: 450, description: "ملابس", transactionDate: new Date(y, m, 8), paymentMethod: "بطاقة" },
      { userId: saraId, type: "expense", category: "طعام ومطاعم", amount: 180, description: "مطعم عشاء", transactionDate: new Date(y, m, 10), paymentMethod: "نقد" },
      { userId: saraId, type: "expense", category: "ترفيه", amount: 120, description: "سينما", transactionDate: new Date(y, m, 12), paymentMethod: "بطاقة" },
      { userId: saraId, type: "expense", category: "اشتراكات", amount: 60, description: "Netflix + Spotify", transactionDate: new Date(y, m, 2), paymentMethod: "بطاقة" },
    ]);
    console.log("✅ Sara transactions created");
  }

  // Pulse score
  await db.insert(schema.financialPulseTable).values({
    userId: saraId,
    score: 78,
    status: "مستقر مالياً",
    spendingIncomeRatio: 75,
    budgetCommitment: 80,
    savingGrowth: 70,
    obligationsScore: 85,
    behaviorScore: 80,
    goalsScore: 65,
  });
  console.log("✅ Sara pulse score recorded");

  // Welcome notification
  const existingNotifs = await db.select().from(schema.notificationsTable).where(eq(schema.notificationsTable.userId, saraId));
  if (existingNotifs.length === 0) {
    await db.insert(schema.notificationsTable).values([
      { userId: saraId, title: "مرحباً بك في نبض!", message: "حسابك جاهز. ابدأ بحساب نبضتك المالية.", type: "success" },
      { userId: saraId, title: "نصيحة هذا الأسبوع", message: "ادخار 10% من راتبك كل شهر يبني وسادة مالية قوية خلال سنة.", type: "info" },
      { userId: saraId, title: "تقترب من حد تسوق", message: "أنفقت 90% من ميزانية التسوق. تبقى 50 ر.س فقط.", type: "warning" },
    ]);
    console.log("✅ Sara notifications created");
  }

  // Activity log
  await db.insert(schema.activityLogsTable).values({
    userId: saraId,
    action: "account_created",
    description: "تم إنشاء حساب تجريبي لسارة",
  });

  // ── 2. Community Profiles from CSV ─────────────────────────────────────────
  const existingCommunity = await db.select().from(schema.communityProfilesTable).limit(1);
  if (existingCommunity.length > 0) {
    console.log("ℹ️  Community profiles already seeded, skipping");
  } else {
    const csvPath = path.join(__dirname, "../attached_assets/Nabd_12_Months_Clean01_1784219231240.csv");
    if (!fs.existsSync(csvPath)) {
      console.warn("⚠️  CSV file not found, skipping community data");
    } else {
      const rows = parseCSV(csvPath);

      // Group by User_ID and compute averages
      const userMap = new Map<number, CsvRow[]>();
      for (const row of rows) {
        if (!userMap.has(row.User_ID)) userMap.set(row.User_ID, []);
        userMap.get(row.User_ID)!.push(row);
      }

      const profiles = [];
      for (const [userId, months] of userMap.entries()) {
        const avg = (key: keyof CsvRow) =>
          Math.round(months.reduce((a, r) => a + (r[key] as number), 0) / months.length);

        const avgIncome = avg("Monthly_Income");
        const avgSavings = avg("Savings");
        const avgLoans = avg("Loans");
        const avgSpending = avg("Housing") + avg("Food") + avg("Transport") + avg("Entertainment") + avg("Subscriptions");

        const pulseScore = computeCommunityPulseScore({
          avgMonthlyIncome: avgIncome,
          avgTotalSpending: avgSpending,
          avgSavings,
          avgObligations: avgLoans,
        });

        profiles.push({
          csvUserId: userId,
          avgMonthlyIncome: avgIncome,
          avgSavings,
          avgObligations: avgLoans,
          avgTotalSpending: avgSpending,
          incomeBracket: getIncomeBracket(avgIncome),
          pulseScore,
        });
      }

      // Insert in batches of 100
      const batchSize = 100;
      for (let i = 0; i < profiles.length; i += batchSize) {
        await db.insert(schema.communityProfilesTable).values(profiles.slice(i, i + batchSize));
      }
      console.log(`✅ Inserted ${profiles.length} community profiles`);
    }
  }

  console.log("\n🎉 Seed complete!");
  console.log("   Demo user: sara@nabd.demo / Demo1234!");
  await pool.end();
}

main().catch(err => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
