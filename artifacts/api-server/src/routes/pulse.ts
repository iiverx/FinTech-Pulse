import { Router, type IRouter } from "express";
import {
  db,
  financialPulseTable,
  incomeTable,
  obligationsTable,
  budgetTable,
  goalsTable,
  transactionsTable,
  savingsTransactionsTable,
  activityLogsTable,
} from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import {
  computeNabdhScore,
  buildMonthlyRecordFromBudget,
  runValidation,
  type MonthlyRecord,
} from "../services/nabdh-engine.service";
import { generateSmartNotifications } from "../services/notification.service";

const router: IRouter = Router();

// ── Category name → Nabdh category mapping ────────────────────────────────────
const CATEGORY_MAP: Record<string, keyof ReturnType<typeof getCategoryBuckets>> = {
  "سكن":             "housing",
  "إيجار":           "housing",
  "مسكن":            "housing",
  "طعام ومطاعم":    "food",
  "طعام":            "food",
  "مطاعم":           "food",
  "مواصلات":         "transport",
  "نقل":             "transport",
  "ترفيه":           "entertainment",
  "ترفيه وهوايات":  "entertainment",
  "اشتراكات":        "subscriptions",
  "اشتراكات رقمية": "subscriptions",
};

function getCategoryBuckets() {
  return { housing: 0, food: 0, transport: 0, entertainment: 0, subscriptions: 0 };
}

// ── Helper: gather all financial data for a user ───────────────────────────────
async function gatherUserData(userId: string) {
  const [income] = await db.select().from(incomeTable).where(eq(incomeTable.userId, userId));
  const obligations = await db.select().from(obligationsTable).where(eq(obligationsTable.userId, userId));
  const budgets = await db.select().from(budgetTable).where(eq(budgetTable.userId, userId));
  const goals = await db.select().from(goalsTable).where(eq(goalsTable.userId, userId));
  const allTx = await db.select().from(transactionsTable).where(eq(transactionsTable.userId, userId));
  const savingsTx = await db.select().from(savingsTransactionsTable).where(eq(savingsTransactionsTable.userId, userId));

  return { income, obligations, budgets, goals, allTx, savingsTx };
}

// ── Build monthly records from transaction history ────────────────────────────
function buildMonthlyHistory(opts: {
  allTx: Awaited<ReturnType<typeof gatherUserData>>["allTx"];
  savingsTx: Awaited<ReturnType<typeof gatherUserData>>["savingsTx"];
  monthlyIncome: number;
  loansTotal: number;
  maxMonths?: number;
}): MonthlyRecord[] {
  const { allTx, savingsTx, monthlyIncome, loansTotal, maxMonths = 12 } = opts;

  // Group expense transactions by year-month
  const monthMap = new Map<string, Record<string, number>>();
  for (const tx of allTx) {
    if (tx.type !== "expense") continue;
    const d = tx.transactionDate;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!monthMap.has(key)) monthMap.set(key, {});
    const m = monthMap.get(key)!;
    m[tx.category] = (m[tx.category] ?? 0) + tx.amount;
  }

  // Group savings by year-month
  const savingsMap = new Map<string, number>();
  for (const s of savingsTx) {
    const d = s.date;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    savingsMap.set(key, (savingsMap.get(key) ?? 0) + s.amount);
  }

  // Combine keys
  const allKeys = Array.from(new Set([...monthMap.keys(), ...savingsMap.keys()])).sort();
  const recentKeys = allKeys.slice(-maxMonths);

  return recentKeys.map(key => {
    const spending = monthMap.get(key) ?? {};
    const savingsAmount = savingsMap.get(key) ?? 0;

    const budgetSpending: Record<string, number> = {};
    for (const [cat, amount] of Object.entries(spending)) {
      budgetSpending[cat] = (budgetSpending[cat] ?? 0) + amount;
    }

    return buildMonthlyRecordFromBudget({
      income: monthlyIncome,
      budgetSpending,
      loansTotal,
      savingsThisMonth: savingsAmount,
    });
  });
}

// ── Build current-month record from budget table (currentSpending) ─────────────
function buildCurrentMonthRecord(opts: {
  income: number;
  budgets: Awaited<ReturnType<typeof gatherUserData>>["budgets"];
  savingsTx: Awaited<ReturnType<typeof gatherUserData>>["savingsTx"];
  loansTotal: number;
}): MonthlyRecord {
  const { income, budgets, savingsTx, loansTotal } = opts;

  const startOfMonth = new Date();
  startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);

  const savingsThisMonth = savingsTx
    .filter(s => s.date >= startOfMonth)
    .reduce((a, s) => a + s.amount, 0);

  const budgetSpending: Record<string, number> = {};
  for (const b of budgets) {
    budgetSpending[b.category] = b.currentSpending;
  }

  return buildMonthlyRecordFromBudget({ income, budgetSpending, loansTotal, savingsThisMonth });
}

// ── GET /api/pulse/current ────────────────────────────────────────────────────
router.get("/pulse/current", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  try {
    const [latest] = await db
      .select()
      .from(financialPulseTable)
      .where(eq(financialPulseTable.userId, userId))
      .orderBy(desc(financialPulseTable.createdAt))
      .limit(1);

    if (latest) {
      return res.json(latest);
    }

    // Auto-calculate on first visit
    const data = await gatherUserData(userId);
    const income = data.income?.monthlySalary ?? 0;
    const loansTotal = data.obligations.reduce((a, o) => a + o.amount, 0);
    const record = buildCurrentMonthRecord({ income, budgets: data.budgets, savingsTx: data.savingsTx, loansTotal });
    const result = computeNabdhScore([record]);

    res.json({
      score: result.score,
      status: result.category,
      statusEn: result.categoryEn,
      breakdown: result.breakdown,
      ratios: result.ratios,
      strengths: result.strengths,
      improvements: result.improvements,
      recommendations: result.recommendations,
      calculatedNow: true,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "فشل في جلب مؤشر النبض" });
  }
});

// ── POST /api/pulse/calculate ─────────────────────────────────────────────────
router.post("/pulse/calculate", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  try {
    const data = await gatherUserData(userId);
    const totalIncome = (data.income?.monthlySalary ?? 0) + (data.income?.extraIncomeAmount ?? 0);
    const loansTotal = data.obligations.reduce((a, o) => a + o.amount, 0);

    // Build full monthly history for trend + volatility
    const history = buildMonthlyHistory({
      allTx: data.allTx,
      savingsTx: data.savingsTx,
      monthlyIncome: totalIncome,
      loansTotal,
    });

    // Always include the current month from budget table (most accurate for this month)
    const currentRecord = buildCurrentMonthRecord({
      income: totalIncome,
      budgets: data.budgets,
      savingsTx: data.savingsTx,
      loansTotal,
    });

    // Use history if available, otherwise just current month
    const records: MonthlyRecord[] = history.length > 0 ? history : [currentRecord];

    const result = computeNabdhScore(records);

    // Persist
    const [saved] = await db
      .insert(financialPulseTable)
      .values({
        userId,
        score: Math.round(result.score),
        status: result.category,
        // Map breakdown to existing DB columns (repurposed for nabdh algorithm)
        spendingIncomeRatio: Math.round(result.ratios.spendRatio),       // spend % of income
        savingGrowth:        Math.round(result.breakdown.savings),        // savings sub-score
        obligationsScore:    Math.round(result.breakdown.debt),           // debt sub-score
        budgetCommitment:    Math.round(result.breakdown.balance),        // balance sub-score
        behaviorScore:       Math.round(result.breakdown.trend),          // trend sub-score
        goalsScore:          Math.round(result.breakdown.volatility),     // volatility sub-score
      })
      .returning();

    await db.insert(activityLogsTable).values({
      userId,
      action: "calculate_pulse",
      description: `تم حساب مؤشر النبض: ${result.score}/100 - ${result.category} (${records.length} أشهر)`,
    }).catch(() => {});

    // Smart notifications
    const nearestDueDays = data.obligations.reduce((min, o) => {
      const days = o.dueDate ? Math.max(0, o.dueDate - new Date().getDate()) : 30;
      return days < min ? days : min;
    }, 30);

    await generateSmartNotifications({
      userId,
      monthlySalary: data.income?.monthlySalary ?? 0,
      spentSoFar: data.budgets.reduce((a, b) => a + b.currentSpending, 0),
      budgetCategories: data.budgets.map(b => ({ category: b.category, limit: b.monthlyLimit, spent: b.currentSpending })),
      goalsProgress: data.goals.map(g => ({ goalType: g.goalType, target: g.targetAmount, current: g.currentAmount })),
      totalObligations: loansTotal,
      daysUntilObligationDue: nearestDueDays,
      savingsRate: totalIncome > 0 ? (currentRecord.savings / totalIncome) : 0,
    }).catch(() => {});

    res.json({
      ...saved,
      score: result.score,
      status: result.category,
      statusEn: result.categoryEn,
      color: result.color,
      breakdown: result.breakdown,
      ratios: result.ratios,
      caps: result.caps,
      monthsAnalyzed: records.length,
      strengths: result.strengths,
      improvements: result.improvements,
      recommendations: result.recommendations,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "فشل في حساب مؤشر النبض" });
  }
});

// ── GET /api/pulse/history ────────────────────────────────────────────────────
router.get("/pulse/history", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  try {
    const rows = await db
      .select()
      .from(financialPulseTable)
      .where(eq(financialPulseTable.userId, userId))
      .orderBy(desc(financialPulseTable.createdAt))
      .limit(100);

    res.json({ history: rows });
  } catch {
    res.status(500).json({ error: "فشل في جلب سجل النبض" });
  }
});

// ── GET /api/pulse/breakdown ──────────────────────────────────────────────────
// Returns the full Nabdh breakdown for the current state
router.get("/pulse/breakdown", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  try {
    const data = await gatherUserData(userId);
    const totalIncome = (data.income?.monthlySalary ?? 0) + (data.income?.extraIncomeAmount ?? 0);
    const loansTotal = data.obligations.reduce((a, o) => a + o.amount, 0);

    const history = buildMonthlyHistory({
      allTx: data.allTx,
      savingsTx: data.savingsTx,
      monthlyIncome: totalIncome,
      loansTotal,
    });
    const currentRecord = buildCurrentMonthRecord({
      income: totalIncome,
      budgets: data.budgets,
      savingsTx: data.savingsTx,
      loansTotal,
    });
    const records = history.length > 0 ? history : [currentRecord];
    const result = computeNabdhScore(records);

    res.json({
      ...result,
      monthsAnalyzed: records.length,
      weightExplanation: {
        savings:    "15% — قاعدة 50/30/20: ادخار 20%+ ممتاز",
        debt:       "20% — نسبة الدين (DTI): المعيار الآمن أقل من 36%",
        housing:    "10% — نسبة السكن: لا تتجاوز 30% من الدخل",
        balance:    "30% — نسبة الرصيد المتبقي: الأكثر أهمية",
        trend:      "15% — اتجاه 12 شهر: هل يتحسن أو يتدهور؟",
        volatility: "10% — الاستقرار: ثبات المصاريف شهرياً",
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "فشل في حساب تفاصيل النبض" });
  }
});

// ── GET /api/pulse/validate ───────────────────────────────────────────────────
// Run algorithm validation cases — useful for QA / admin
router.get("/pulse/validate", requireAuth, async (req, res) => {
  try {
    const results = runValidation();
    const allPassed = results.every(r => r.passed);
    res.json({ allPassed, cases: results });
  } catch (e) {
    res.status(500).json({ error: "Validation failed" });
  }
});

export default router;
