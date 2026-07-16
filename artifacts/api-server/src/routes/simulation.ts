import { Router, type IRouter } from "express";
import {
  db,
  incomeTable,
  obligationsTable,
  budgetTable,
  goalsTable,
  transactionsTable,
  savingsTransactionsTable,
  activityLogsTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "../middlewares/auth";
import { calculatePulseScore, simulatePurchaseImpact } from "../services/pulse.service";

const router: IRouter = Router();

const simulationSchema = z.object({
  amount: z.number().positive(),
  category: z.string().min(1),
});

// ── POST /api/simulation/purchase ─────────────────────────────────────────────
router.post("/simulation/purchase", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  const parsed = simulationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid data", details: parsed.error.issues });
    return;
  }

  try {
    const [income] = await db.select().from(incomeTable).where(eq(incomeTable.userId, userId));
    const obligations = await db.select().from(obligationsTable).where(eq(obligationsTable.userId, userId));
    const budgets = await db.select().from(budgetTable).where(eq(budgetTable.userId, userId));
    const goals = await db.select().from(goalsTable).where(eq(goalsTable.userId, userId));

    const startOfMonth = new Date();
    startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);

    const transactions = await db.select().from(transactionsTable).where(eq(transactionsTable.userId, userId));
    const thisMonthExpenses = transactions
      .filter(t => t.type === "expense" && t.transactionDate >= startOfMonth)
      .reduce((a, t) => a + t.amount, 0);

    const savingsTx = await db.select().from(savingsTransactionsTable).where(eq(savingsTransactionsTable.userId, userId));
    const totalSavings = savingsTx.reduce((a, t) => a + t.amount, 0);
    const prevMonthSavings = savingsTx
      .filter(t => t.date < startOfMonth)
      .reduce((a, t) => a + t.amount, 0);

    const impulsive = transactions.filter(t => {
      const b = budgets.find(b => b.category === t.category);
      return b && t.amount > b.monthlyLimit * 0.5;
    }).length;

    const baseInput = {
      monthlySalary: income?.monthlySalary ?? 0,
      extraIncome: income?.extraIncomeAmount ?? 0,
      totalExpenses: thisMonthExpenses,
      totalObligations: obligations.reduce((a, o) => a + o.amount, 0),
      totalSavings,
      prevMonthSavings,
      budgetCategories: budgets.map(b => ({ limit: b.monthlyLimit, spent: b.currentSpending })),
      goalsProgress: goals.map(g => ({ target: g.targetAmount, current: g.currentAmount })),
      impulsiveTransactions: impulsive,
    };

    const { before, after, impactLevel } = simulatePurchaseImpact(
      baseInput,
      parsed.data.amount,
      parsed.data.category,
    );

    const impactLabels = { low: "منخفض", medium: "متوسط", high: "مرتفع" };
    const recommendation =
      impactLevel === "low"
        ? "الشراء آمن ولن يؤثر كثيراً على صحتك المالية."
        : impactLevel === "medium"
        ? `الشراء سيخفض نبضتك من ${before.score} إلى ${after.score}. فكّر قبل الشراء.`
        : `تجنب هذا الشراء الآن. سيخفض نبضتك من ${before.score} إلى ${after.score}. أفضل تأجيله.`;

    // Activity log
    await db.insert(activityLogsTable).values({
      userId,
      action: "purchase_simulation",
      description: `محاكاة شراء: ${parsed.data.amount} ر.س (${parsed.data.category}) - تأثير ${impactLabels[impactLevel]}`,
    }).catch(() => {});

    res.json({
      purchaseAmount: parsed.data.amount,
      category: parsed.data.category,
      currentScore: before.score,
      predictedScoreAfterPurchase: after.score,
      scoreDrop: before.score - after.score,
      impactLevel: impactLabels[impactLevel],
      recommendation,
      currentStatus: before.status,
      predictedStatus: after.status,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to run simulation" });
  }
});

export default router;
