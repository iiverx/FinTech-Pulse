/**
 * Seed script for Nabd | Pulse
 * Run: pnpm --filter @workspace/api-server run seed
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import {
  db, pool,
  usersTable, incomeTable, obligationsTable, budgetTable, goalsTable,
  savingsTransactionsTable, savingsGoalsTable, transactionsTable,
  financialPulseTable, notificationsTable, activityLogsTable,
  communityProfilesTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function computeCommunityPulseScore(inc: number, spend: number, save: number, oblig: number): number {
  if (inc === 0) return 50;
  const spendRatio = spend / inc;
  const spendScore = spendRatio <= 0.40 ? 100 : spendRatio <= 0.55 ? 80 : spendRatio <= 0.70 ? 60 : spendRatio <= 0.85 ? 35 : 10;
  const saveRate = save / inc;
  const saveScore = saveRate >= 0.20 ? 100 : saveRate >= 0.10 ? 75 : saveRate >= 0.05 ? 50 : 25;
  const obligRatio = oblig / inc;
  const obligScore = obligRatio <= 0.20 ? 100 : obligRatio <= 0.30 ? 75 : obligRatio <= 0.40 ? 50 : 25;
  return Math.round(spendScore * 0.35 + saveScore * 0.35 + obligScore * 0.30);
}

function getIncomeBracket(salary: number): string {
  if (salary < 5000) return "low";
  if (salary < 10000) return "medium";
  if (salary < 20000) return "high";
  return "very_high";
}

interface CsvRow {
  User_ID: number; Month: string; Monthly_Income: number;
  Housing: number; Food: number; Transport: number;
  Entertainment: number; Savings: number; Loans: number;
  Subscriptions: number; Remaining_Balance: number;
}

function parseCSV(filePath: string): CsvRow[] {
  const lines = fs.readFileSync(filePath, "utf-8").trim().split("\n");
  const headers = lines[0]!.split(",").map(h => h.trim());
  return lines.slice(1).map(line => {
    const vals = line.split(",");
    const row: Record<string, number | string> = {};
    headers.forEach((h, i) => {
      const v = vals[i]?.trim() ?? "";
      row[h] = h === "Month" ? v : Number(v);
    });
    return row as unknown as CsvRow;
  });
}

async function main() {
  console.log("🌱 Seeding Nabd database...\n");

  // ── Demo user Sara ──────────────────────────────────────────────────────────
  const saraEmail = "sara@nabd.demo";
  const [existingSara] = await db.select().from(usersTable).where(eq(usersTable.email, saraEmail));
  let saraId: string;

  if (existingSara) {
    saraId = existingSara.id;
    console.log("ℹ️  Sara already exists");
  } else {
    const passwordHash = await bcrypt.hash("Demo1234!", 12);
    const [sara] = await db.insert(usersTable).values({
      name: "سارة", email: saraEmail, passwordHash,
      phone: "0501234567", city: "الرياض", age: 28,
      maritalStatus: "single", housingType: "rent", dependentsCount: 0,
    }).returning();
    saraId = sara!.id;
    console.log(`✅ Created Sara (${saraId})`);
  }

  // Income
  await db.insert(incomeTable)
    .values({ userId: saraId, monthlySalary: 7500, salaryDay: 1, hasExtraIncome: false, extraIncomeAmount: 0 })
    .onConflictDoUpdate({ target: incomeTable.userId, set: { monthlySalary: 7500, updatedAt: new Date() } });
  console.log("✅ Income set (7,500 SAR/month)");

  // Obligations
  const existingOblig = await db.select().from(obligationsTable).where(eq(obligationsTable.userId, saraId));
  if (!existingOblig.length) {
    await db.insert(obligationsTable).values([
      { userId: saraId, type: "قرض شخصي", amount: 800, dueDate: 5, isRecurring: true },
      { userId: saraId, type: "تأمين سيارة", amount: 400, dueDate: 10, isRecurring: true },
    ]);
    console.log("✅ Obligations created (1,200 SAR total)");
  }

  // Budget categories
  const existingBudget = await db.select().from(budgetTable).where(eq(budgetTable.userId, saraId));
  if (!existingBudget.length) {
    await db.insert(budgetTable).values([
      { userId: saraId, category: "طعام ومطاعم", monthlyLimit: 800, currentSpending: 620 },
      { userId: saraId, category: "مواصلات",      monthlyLimit: 400, currentSpending: 310 },
      { userId: saraId, category: "تسوق",          monthlyLimit: 500, currentSpending: 480 },
      { userId: saraId, category: "ترفيه",         monthlyLimit: 300, currentSpending: 190 },
      { userId: saraId, category: "فواتير",        monthlyLimit: 500, currentSpending: 420 },
      { userId: saraId, category: "اشتراكات",     monthlyLimit: 200, currentSpending: 180 },
    ]);
    console.log("✅ Budget categories created");
  }

  // Goals
  const existingGoals = await db.select().from(goalsTable).where(eq(goalsTable.userId, saraId));
  if (!existingGoals.length) {
    const deadline = new Date(); deadline.setMonth(deadline.getMonth() + 12);
    await db.insert(goalsTable).values([
      { userId: saraId, goalType: "صندوق الطوارئ", targetAmount: 15000, currentAmount: 4200, deadline, monthlyRequiredAmount: 900 },
      { userId: saraId, goalType: "رحلة سياحية",   targetAmount: 8000,  currentAmount: 1800, deadline, monthlyRequiredAmount: 520 },
    ]);
    console.log("✅ Goals created");
  }

  // Savings wallet
  const existingSavings = await db.select().from(savingsTransactionsTable).where(eq(savingsTransactionsTable.userId, saraId));
  if (!existingSavings.length) {
    const now = new Date(); const m = now.getMonth(); const y = now.getFullYear();
    await db.insert(savingsTransactionsTable).values([
      { userId: saraId, amount: 1500, note: "راتب يناير",   date: new Date(y, m - 2, 5) },
      { userId: saraId, amount: 1500, note: "راتب فبراير",  date: new Date(y, m - 1, 5) },
      { userId: saraId, amount: 500,  note: "مكافأة العمل", date: new Date(y, m - 1, 15) },
      { userId: saraId, amount: 500,  note: "ادخار شهري",   date: new Date(y, m, 3) },
    ]);
    await db.insert(savingsGoalsTable).values({ userId: saraId, goal: 15000 })
      .onConflictDoUpdate({ target: savingsGoalsTable.userId, set: { goal: 15000 } });
    console.log("✅ Savings wallet (4,000 SAR balance)");
  }

  // Transactions
  const existingTx = await db.select().from(transactionsTable).where(eq(transactionsTable.userId, saraId));
  if (!existingTx.length) {
    const now = new Date(); const m = now.getMonth(); const y = now.getFullYear();
    await db.insert(transactionsTable).values([
      { userId: saraId, type: "income",  category: "راتب",          amount: 7500, description: "راتب الشهر",          transactionDate: new Date(y, m, 1),  source: "صاحب العمل" },
      { userId: saraId, type: "expense", category: "طعام ومطاعم",   amount: 200,  description: "بقالة أسبوعية",       transactionDate: new Date(y, m, 3),  paymentMethod: "بطاقة" },
      { userId: saraId, type: "expense", category: "مواصلات",       amount: 150,  description: "وقود",                transactionDate: new Date(y, m, 4),  paymentMethod: "نقد" },
      { userId: saraId, type: "expense", category: "فواتير",        amount: 300,  description: "فاتورة كهرباء",        transactionDate: new Date(y, m, 5),  paymentMethod: "تحويل" },
      { userId: saraId, type: "expense", category: "تسوق",          amount: 450,  description: "ملابس",               transactionDate: new Date(y, m, 8),  paymentMethod: "بطاقة" },
      { userId: saraId, type: "expense", category: "طعام ومطاعم",   amount: 180,  description: "عشاء مطعم",            transactionDate: new Date(y, m, 10), paymentMethod: "نقد" },
      { userId: saraId, type: "expense", category: "ترفيه",         amount: 120,  description: "سينما",               transactionDate: new Date(y, m, 12), paymentMethod: "بطاقة" },
      { userId: saraId, type: "expense", category: "اشتراكات",     amount: 60,   description: "Netflix + Spotify",   transactionDate: new Date(y, m, 2),  paymentMethod: "بطاقة" },
    ]);
    console.log("✅ Transactions created (3,920 SAR spent)");
  }

  // Pulse score
  await db.insert(financialPulseTable).values({
    userId: saraId, score: 78, status: "مستقر مالياً",
    spendingIncomeRatio: 75, budgetCommitment: 80, savingGrowth: 70,
    obligationsScore: 85, behaviorScore: 80, goalsScore: 65,
  });
  console.log("✅ Pulse score recorded (78/100)");

  // Notifications
  const existingNotifs = await db.select().from(notificationsTable).where(eq(notificationsTable.userId, saraId));
  if (!existingNotifs.length) {
    await db.insert(notificationsTable).values([
      { userId: saraId, title: "مرحباً في نبض!", message: "حسابك جاهز. ابدأ بحساب نبضتك المالية.", type: "success" },
      { userId: saraId, title: "نصيحة هذا الأسبوع", message: "ادخار 10% من راتبك كل شهر يبني وسادة مالية قوية.", type: "info" },
      { userId: saraId, title: "تقترب من حد التسوق", message: "أنفقت 90% من ميزانية التسوق. تبقى 50 ر.س.", type: "warning" },
    ]);
    console.log("✅ Notifications created");
  }

  await db.insert(activityLogsTable).values({ userId: saraId, action: "seed", description: "بيانات تجريبية لسارة" });

  // ── Community Profiles from CSV ─────────────────────────────────────────────
  const existingComm = await db.select().from(communityProfilesTable).limit(1);
  if (existingComm.length) {
    console.log("ℹ️  Community profiles already exist");
  } else {
    // Try multiple possible paths for the CSV
    const possiblePaths = [
      "/home/runner/workspace/attached_assets/Nabd_12_Months_Clean01_1784219231240.csv",
      path.join(__dirname, "../../../attached_assets/Nabd_12_Months_Clean01_1784219231240.csv"),
      path.join(process.cwd(), "attached_assets/Nabd_12_Months_Clean01_1784219231240.csv"),
    ];
    const csvPath = possiblePaths.find(p => fs.existsSync(p));

    if (!csvPath) {
      console.warn("⚠️  CSV not found, skipping community data");
    } else {
      console.log(`📊 Loading CSV from: ${csvPath}`);
      const rows = parseCSV(csvPath);

      // Group by User_ID → compute 12-month averages
      const userMap = new Map<number, CsvRow[]>();
      for (const row of rows) {
        if (!userMap.has(row.User_ID)) userMap.set(row.User_ID, []);
        userMap.get(row.User_ID)!.push(row);
      }

      const profiles = [];
      for (const [uid, months] of userMap.entries()) {
        const avg = (key: keyof CsvRow) =>
          Math.round(months.reduce((a, r) => a + (r[key] as number), 0) / months.length);

        const avgIncome   = avg("Monthly_Income");
        const avgSavings  = avg("Savings");
        const avgLoans    = avg("Loans");
        const avgSpend    = avg("Housing") + avg("Food") + avg("Transport") + avg("Entertainment") + avg("Subscriptions");
        const pulseScore  = computeCommunityPulseScore(avgIncome, avgSpend, avgSavings, avgLoans);

        profiles.push({
          csvUserId: uid,
          avgMonthlyIncome: avgIncome,
          avgSavings,
          avgObligations: avgLoans,
          avgTotalSpending: avgSpend,
          incomeBracket: getIncomeBracket(avgIncome),
          pulseScore,
        });
      }

      // Batch insert 100 rows at a time
      for (let i = 0; i < profiles.length; i += 100) {
        await db.insert(communityProfilesTable).values(profiles.slice(i, i + 100));
      }
      console.log(`✅ Inserted ${profiles.length} community profiles`);
    }
  }

  console.log("\n🎉 Seed complete!");
  console.log("   Login: sara@nabd.demo / Demo1234!");
  await pool.end();
}

main().catch(err => { console.error("❌ Seed failed:", err); process.exit(1); });
