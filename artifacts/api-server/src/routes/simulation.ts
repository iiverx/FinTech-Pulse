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
import {
  computeNabdhScore,
  buildMonthlyRecordFromBudget,
  type MonthlyRecord,
} from "../services/nabdh-engine.service";

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
    res.status(400).json({ error: "بيانات غير صحيحة", details: parsed.error.issues });
    return;
  }

  try {
    const [income] = await db.select().from(incomeTable).where(eq(incomeTable.userId, userId));
    const obligations = await db.select().from(obligationsTable).where(eq(obligationsTable.userId, userId));
    const budgets = await db.select().from(budgetTable).where(eq(budgetTable.userId, userId));
    const savingsTx = await db.select().from(savingsTransactionsTable).where(eq(savingsTransactionsTable.userId, userId));

    const totalIncome = (income?.monthlySalary ?? 0) + (income?.extraIncomeAmount ?? 0);
    const loansTotal = obligations.reduce((a, o) => a + o.amount, 0);

    const startOfMonth = new Date();
    startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);

    const savingsThisMonth = savingsTx
      .filter(s => s.date >= startOfMonth)
      .reduce((a, s) => a + s.amount, 0);

    // Build budget spending map for current month
    const budgetSpending: Record<string, number> = {};
    for (const b of budgets) {
      budgetSpending[b.category] = b.currentSpending;
    }

    // ── Before: current snapshot ──────────────────────────────────────────────
    const beforeRecord = buildMonthlyRecordFromBudget({
      income: totalIncome,
      budgetSpending,
      loansTotal,
      savingsThisMonth,
    });
    const beforeResult = computeNabdhScore([beforeRecord]);

    // ── After: add the purchase to the relevant category ──────────────────────
    const afterBudgetSpending = { ...budgetSpending };

    // Try to match the purchase category to a budget category name
    const purchaseCategory = parsed.data.category;
    // Direct match first
    if (afterBudgetSpending[purchaseCategory] !== undefined) {
      afterBudgetSpending[purchaseCategory] += parsed.data.amount;
    } else {
      // Put it in "other" — we increase the most relevant category or add as misc
      // Default: add to entertainment (common impulse category)
      const fallback = Object.keys(afterBudgetSpending).find(k =>
        k.includes("ترفيه") || k.includes("تسوق")
      ) ?? Object.keys(afterBudgetSpending)[0];
      if (fallback) {
        afterBudgetSpending[fallback] = (afterBudgetSpending[fallback] ?? 0) + parsed.data.amount;
      }
    }

    const afterRecord = buildMonthlyRecordFromBudget({
      income: totalIncome,
      budgetSpending: afterBudgetSpending,
      loansTotal,
      savingsThisMonth,
    });
    const afterResult = computeNabdhScore([afterRecord]);

    // ── Impact assessment ─────────────────────────────────────────────────────
    const scoreDrop = Math.round((beforeResult.score - afterResult.score) * 10) / 10;
    const impactLevel: "low" | "medium" | "high" =
      scoreDrop <= 2 ? "low" : scoreDrop <= 6 ? "medium" : "high";
    const impactLabels = { low: "منخفض", medium: "متوسط", high: "مرتفع" };

    // ── Spending safety check ─────────────────────────────────────────────────
    const safeSpendingRemaining = Math.max(0,
      totalIncome * 0.15 - (afterRecord.housing + afterRecord.food + afterRecord.transport
        + afterRecord.entertainment + afterRecord.loans + afterRecord.subscriptions)
    );

    const recommendation =
      impactLevel === "low"
        ? `الشراء آمن — نبضك سيبقى ${afterResult.score} (${afterResult.category}).`
        : impactLevel === "medium"
        ? `الشراء سيخفض نبضك من ${beforeResult.score} إلى ${afterResult.score}. فكّر قبل الشراء.`
        : `يُفضّل تأجيل هذا الشراء. سيخفض نبضك من ${beforeResult.score} إلى ${afterResult.score} (${afterResult.category}).`;

    // Activity log
    await db.insert(activityLogsTable).values({
      userId,
      action: "purchase_simulation",
      description: `محاكاة شراء: ${parsed.data.amount} ر.س (${parsed.data.category}) — نبض ${beforeResult.score} → ${afterResult.score}`,
    }).catch(() => {});

    res.json({
      purchaseAmount: parsed.data.amount,
      category: parsed.data.category,
      currentScore: beforeResult.score,
      currentStatus: beforeResult.category,
      currentColor: beforeResult.color,
      predictedScore: afterResult.score,
      predictedStatus: afterResult.category,
      predictedColor: afterResult.color,
      scoreDrop,
      impactLevel: impactLabels[impactLevel],
      impactLevelEn: impactLevel,
      recommendation,
      safeSpendingRemaining: Math.round(safeSpendingRemaining),
      breakdownChange: {
        balance: Math.round((afterResult.breakdown.balance - beforeResult.breakdown.balance) * 10) / 10,
        savings: Math.round((afterResult.breakdown.savings - beforeResult.breakdown.savings) * 10) / 10,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "فشل في تشغيل المحاكاة" });
  }
});

export default router;
