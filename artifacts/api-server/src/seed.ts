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

// ── Nabdh Engine (inline for seed — avoids circular build deps) ───────────────
// Exact same functions as nabdh-engine.service.ts
function _scoreSavings(r: number): number { return r >= 0.20 ? 100 : r <= 0 ? 0 : (r / 0.20) * 100; }
function _scoreDebt(r: number): number { return r <= 0.10 ? 100 : r >= 0.36 ? 0 : 100 - ((r - 0.10) / 0.26) * 100; }
function _scoreHousing(r: number): number { return r <= 0.30 ? 100 : r >= 0.50 ? 0 : 100 - ((r - 0.30) / 0.20) * 100; }
function _scoreBalance(r: number): number { return r <= -0.10 ? 0 : r >= 0.15 ? 100 : ((r + 0.10) / 0.25) * 100; }
function _scoreTrend(slope: number): number { return slope >= 0.003 ? 100 : slope <= -0.006 ? 0 : ((slope + 0.006) / 0.009) * 100; }
function _scoreVolatility(vol: number): number { return vol <= 0.003 ? 100 : vol >= 0.02 ? 0 : 100 - ((vol - 0.003) / 0.017) * 100; }
function _deficitCap(r: number): number { return r >= 0 ? 100 : 65 - Math.min(Math.abs(r) / 0.10, 1.0) * 30; }
function _debtCap(r: number): number { return r <= 0.36 ? 100 : 75 - Math.min((r - 0.36) / 0.20, 1.0) * 45; }
function _slope(vals: number[]): number {
  const n = vals.length;
  if (n < 2 || vals.every(v => v === vals[0])) return 0;
  const mx = (n - 1) / 2;
  const my = vals.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) { num += (i - mx) * (vals[i] - my); den += (i - mx) ** 2; }
  return den === 0 ? 0 : num / den;
}
function _std(vals: number[]): number {
  if (vals.length < 2) return 0;
  const m = vals.reduce((a, b) => a + b, 0) / vals.length;
  return Math.sqrt(vals.reduce((a, v) => a + (v - m) ** 2, 0) / (vals.length - 1));
}

interface MonthlyRow { income: number; housing: number; food: number; transport: number; entertainment: number; savings: number; loans: number; subscriptions: number; remainingBalance: number; }

function computeCommunityPulseScore(months: MonthlyRow[]): number {
  if (months.length === 0) return 50;
  const scored = months.map(m => {
    const inc = m.income > 0 ? m.income : 1;
    return {
      savingsRatio:  m.savings / inc,
      debtRatio:     m.loans / inc,
      housingRatio:  m.housing / inc,
      balanceRatio:  m.remainingBalance / inc,
      sS: _scoreSavings(m.savings / inc),
      sD: _scoreDebt(m.loans / inc),
      sH: _scoreHousing(m.housing / inc),
      sB: _scoreBalance(m.remainingBalance / inc),
    };
  });
  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const balRatios = scored.map(s => s.balanceRatio);
  const trend  = months.length >= 2 ? _slope(balRatios) : 0;
  const vol    = months.length >= 2 ? _std(balRatios) : 0;
  const raw =
    avg(scored.map(s => s.sS)) * 0.15 +
    avg(scored.map(s => s.sD)) * 0.20 +
    avg(scored.map(s => s.sH)) * 0.10 +
    avg(scored.map(s => s.sB)) * 0.30 +
    _scoreTrend(trend)       * 0.15 +
    (months.length >= 2 ? _scoreVolatility(vol) : 50) * 0.10;
  const cap = Math.min(_deficitCap(avg(balRatios)), _debtCap(avg(scored.map(s => s.debtRatio))));
  return Math.round(Math.max(0, Math.min(100, Math.min(raw, cap))));
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

  // Pulse score — computed using Nabdh engine from Sara's actual seeded data
  // income=7500, housing=0, food=620, transport=310, entertainment=190,
  // savings=500, loans=1200, subscriptions=180, remaining=4500
  const saraMonthlyRows: MonthlyRow[] = [{
    income: 7500, housing: 0, food: 620, transport: 310, entertainment: 190,
    savings: 500, loans: 1200, subscriptions: 180, remainingBalance: 4500,
  }];
  const saraPulse = computeCommunityPulseScore(saraMonthlyRows);
  await db.insert(financialPulseTable).values({
    userId: saraId,
    score: saraPulse,
    status: saraPulse >= 70 ? "مستقر" : saraPulse >= 40 ? "متوسط" : "في خطر",
    spendingIncomeRatio: Math.round((1200 / 7500) * 100),  // debt ratio %
    savingGrowth:        Math.round(_scoreSavings(500 / 7500)),
    obligationsScore:    Math.round(_scoreDebt(1200 / 7500)),
    budgetCommitment:    Math.round(_scoreBalance(4500 / 7500)),
    behaviorScore:       50, // trend = neutral (1 month)
    goalsScore:          50, // volatility = neutral (1 month)
  });
  console.log(`✅ Pulse score (Nabdh engine): ${saraPulse}/100`);

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
    // Try multiple possible paths for the CSV (newest file first)
    const possiblePaths = [
      "/home/runner/workspace/attached_assets/Nabd_12_Months_Clean01_1784277638917.csv",
      "/home/runner/workspace/attached_assets/Nabd_12_Months_Clean01_1784219231240.csv",
      path.join(__dirname, "../../../attached_assets/Nabd_12_Months_Clean01_1784277638917.csv"),
      path.join(__dirname, "../../../attached_assets/Nabd_12_Months_Clean01_1784219231240.csv"),
      path.join(process.cwd(), "attached_assets/Nabd_12_Months_Clean01_1784277638917.csv"),
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
        // Build full MonthlyRow array for Nabdh engine (trend + volatility)
        const monthlyRows: MonthlyRow[] = months.map(r => ({
          income:           r.Monthly_Income,
          housing:          r.Housing,
          food:             r.Food,
          transport:        r.Transport,
          entertainment:    r.Entertainment,
          savings:          r.Savings,
          loans:            r.Loans,
          subscriptions:    r.Subscriptions,
          remainingBalance: r.Remaining_Balance,
        }));

        const numAvg = (key: keyof CsvRow) =>
          Math.round(months.reduce((a, r) => a + (r[key] as number), 0) / months.length);

        const avgIncome  = numAvg("Monthly_Income");
        const avgSavings = numAvg("Savings");
        const avgLoans   = numAvg("Loans");
        const avgSpend   = numAvg("Housing") + numAvg("Food") + numAvg("Transport") + numAvg("Entertainment") + numAvg("Subscriptions");

        // Use Nabdh engine with full 12-month history (includes trend & volatility)
        const pulseScore = computeCommunityPulseScore(monthlyRows);

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
