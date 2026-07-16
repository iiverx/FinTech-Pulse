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
import { eq, desc, gte } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { calculatePulseScore } from "../services/pulse.service";
import { generateSmartNotifications } from "../services/notification.service";

const router: IRouter = Router();

// ── Helper: gather user financial data for pulse calc ─────────────────────────
async function gatherPulseData(userId: string) {
  const [income] = await db.select().from(incomeTable).where(eq(incomeTable.userId, userId));
  const obligations = await db.select().from(obligationsTable).where(eq(obligationsTable.userId, userId));
  const budgets = await db.select().from(budgetTable).where(eq(budgetTable.userId, userId));
  const goals = await db.select().from(goalsTable).where(eq(goalsTable.userId, userId));

  // Transactions this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);

  const transactions = await db
    .select()
    .from(transactionsTable)
    .where(eq(transactionsTable.userId, userId));

  const thisMonthExpenses = transactions
    .filter(t => t.type === "expense" && t.transactionDate >= startOfMonth)
    .reduce((a, t) => a + t.amount, 0);

  // Savings
  const savingsTx = await db.select().from(savingsTransactionsTable).where(eq(savingsTransactionsTable.userId, userId));
  const totalSavings = savingsTx.reduce((a, t) => a + t.amount, 0);
  const prevMonthStart = new Date(startOfMonth);
  prevMonthStart.setMonth(prevMonthStart.getMonth() - 1);
  const prevMonthSavings = savingsTx
    .filter(t => t.date < startOfMonth)
    .reduce((a, t) => a + t.amount, 0);

  // Impulsive: transactions > 50% of category budget
  const impulsive = transactions.filter(t => {
    const b = budgets.find(b => b.category === t.category);
    return b && t.amount > b.monthlyLimit * 0.5;
  }).length;

  return {
    income,
    obligations,
    budgets,
    goals,
    thisMonthExpenses,
    totalSavings,
    prevMonthSavings,
    impulsive,
  };
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

    if (!latest) {
      // Auto-calculate if none exists
      const data = await gatherPulseData(userId);
      const result = calculatePulseScore({
        monthlySalary: data.income?.monthlySalary ?? 0,
        extraIncome: data.income?.extraIncomeAmount ?? 0,
        totalExpenses: data.thisMonthExpenses,
        totalObligations: data.obligations.reduce((a, o) => a + o.amount, 0),
        totalSavings: data.totalSavings,
        prevMonthSavings: data.prevMonthSavings,
        budgetCategories: data.budgets.map(b => ({ limit: b.monthlyLimit, spent: b.currentSpending })),
        goalsProgress: data.goals.map(g => ({ target: g.targetAmount, current: g.currentAmount })),
        impulsiveTransactions: data.impulsive,
      });
      return res.json({ score: result.score, status: result.status, statusEn: result.statusEn, strengths: result.strengths, improvements: result.improvements, recommendations: result.recommendations, calculatedNow: true });
    }

    res.json(latest);
  } catch {
    res.status(500).json({ error: "Failed to fetch pulse score" });
  }
});

// ── POST /api/pulse/calculate ─────────────────────────────────────────────────
router.post("/pulse/calculate", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  try {
    const data = await gatherPulseData(userId);
    const totalObligations = data.obligations.reduce((a, o) => a + o.amount, 0);

    const result = calculatePulseScore({
      monthlySalary: data.income?.monthlySalary ?? 0,
      extraIncome: data.income?.extraIncomeAmount ?? 0,
      totalExpenses: data.thisMonthExpenses,
      totalObligations,
      totalSavings: data.totalSavings,
      prevMonthSavings: data.prevMonthSavings,
      budgetCategories: data.budgets.map(b => ({ limit: b.monthlyLimit, spent: b.currentSpending })),
      goalsProgress: data.goals.map(g => ({ target: g.targetAmount, current: g.currentAmount })),
      impulsiveTransactions: data.impulsive,
    });

    // Persist
    const [saved] = await db
      .insert(financialPulseTable)
      .values({
        userId,
        score: result.score,
        status: result.status,
        spendingIncomeRatio: result.spendingIncomeRatio,
        budgetCommitment: result.budgetCommitment,
        savingGrowth: result.savingGrowth,
        obligationsScore: result.obligationsScore,
        behaviorScore: result.behaviorScore,
        goalsScore: result.goalsScore,
      })
      .returning();

    // Activity log
    await db.insert(activityLogsTable).values({
      userId,
      action: "calculate_pulse",
      description: `تم حساب النبضة المالية: ${result.score}/100 - ${result.status}`,
    }).catch(() => {});

    // Smart notifications
    const nearestDueObligation = data.obligations.reduce((min, o) => {
      const days = o.dueDate ? o.dueDate - new Date().getDate() : 30;
      return days < min ? days : min;
    }, 30);

    await generateSmartNotifications({
      userId,
      monthlySalary: data.income?.monthlySalary ?? 0,
      spentSoFar: data.thisMonthExpenses,
      budgetCategories: data.budgets.map(b => ({ category: b.category, limit: b.monthlyLimit, spent: b.currentSpending })),
      goalsProgress: data.goals.map(g => ({ goalType: g.goalType, target: g.targetAmount, current: g.currentAmount })),
      totalObligations,
      daysUntilObligationDue: Math.max(0, nearestDueObligation),
      savingsRate: (data.income?.monthlySalary ?? 0) > 0
        ? data.totalSavings / (data.income?.monthlySalary ?? 1)
        : 0,
    }).catch(() => {});

    res.json({
      ...saved,
      strengths: result.strengths,
      improvements: result.improvements,
      recommendations: result.recommendations,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to calculate pulse score" });
  }
});

// ── GET /api/pulse/history ────────────────────────────────────────────────────
router.get("/pulse/history", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  const { days = "30" } = req.query as { days?: string };
  try {
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));

    const rows = await db
      .select()
      .from(financialPulseTable)
      .where(eq(financialPulseTable.userId, userId))
      .orderBy(desc(financialPulseTable.createdAt))
      .limit(100);

    res.json({ history: rows });
  } catch {
    res.status(500).json({ error: "Failed to fetch pulse history" });
  }
});

export default router;
