import { Router, type IRouter } from "express";
import {
  db,
  incomeTable,
  obligationsTable,
  budgetTable,
  goalsTable,
  transactionsTable,
  savingsTransactionsTable,
  financialPulseTable,
  activityLogsTable,
} from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "../middlewares/auth";
import { calculatePulseScore } from "../services/pulse.service";

const router: IRouter = Router();

const askSchema = z.object({
  question: z.string().min(1),
  purchaseAmount: z.number().positive().optional(),
  category: z.string().optional(),
});

// ── POST /api/assistant/ask ───────────────────────────────────────────────────
router.post("/assistant/ask", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  const parsed = askSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
    return;
  }

  try {
    const { question, purchaseAmount, category } = parsed.data;

    // Gather context
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

    const totalIncome = (income?.monthlySalary ?? 0) + (income?.extraIncomeAmount ?? 0);
    const totalObligations = obligations.reduce((a, o) => a + o.amount, 0);
    const remainingBudget = totalIncome - thisMonthExpenses - totalObligations;

    // Get latest pulse score
    const [latestPulse] = await db
      .select()
      .from(financialPulseTable)
      .where(eq(financialPulseTable.userId, userId))
      .orderBy(desc(financialPulseTable.createdAt))
      .limit(1);

    const currentScore = latestPulse?.score ?? 70;

    // Rule-based AI response
    let response = "";
    const lq = question.toLowerCase();

    if (purchaseAmount !== undefined) {
      // Purchase decision
      const canAfford = remainingBudget >= purchaseAmount;
      const goalImpact = totalSavings > 0 && purchaseAmount > totalSavings * 0.2;
      const scoreImpact = Math.round((purchaseAmount / Math.max(totalIncome, 1)) * 30);
      const newScore = Math.max(0, currentScore - scoreImpact);

      if (!canAfford) {
        response = `لا أنصح بهذا الشراء الآن. رصيدك المتاح (${Math.round(remainingBudget)} ر.س) أقل من المبلغ المطلوب (${purchaseAmount} ر.س). أفضل انتظار الراتب القادم.`;
      } else if (goalImpact) {
        response = `يمكنك شراء هذا، لكن انتبه: سيؤثر على أهدافك الادخارية. نبضتك ستنخفض من ${currentScore} إلى ${newScore} تقريباً. إذا كان الشراء ضرورياً، تأكد من تعويض الادخار خلال الشهر.`;
      } else if (scoreImpact <= 5) {
        response = `الشراء آمن! رصيدك المتاح (${Math.round(remainingBudget)} ر.س) كافٍ، ونبضتك ستبقى مستقرة عند ${newScore}/100.`;
      } else {
        response = `يمكنك الشراء لكن بحذر. سيخفض نبضتك من ${currentScore} إلى ${newScore}. إذا أمكن، ابحث عن بديل بسعر أقل أو انتظر 5 أيام لتقييم الضرورة.`;
      }
    } else if (lq.includes("توفير") || lq.includes("ادخار") || lq.includes("وفر")) {
      const savingsRate = totalIncome > 0 ? totalSavings / totalIncome : 0;
      if (savingsRate >= 0.20) {
        response = `ممتاز! أنت تدخر أكثر من 20% من دخلك. حافظ على هذا المعدل وفكر في استثمار جزء منه.`;
      } else if (savingsRate >= 0.10) {
        response = `معدل ادخارك جيد (${Math.round(savingsRate * 100)}%). لزيادته، حاول تقليل الإنفاق على ${budgets.sort((a, b) => b.currentSpending - a.currentSpending)[0]?.category ?? "الترفيه"} بنسبة 10%.`;
      } else {
        response = `معدل ادخارك منخفض. أنصح بادخار ${Math.round(totalIncome * 0.10)} ر.س شهرياً (10% من دخلك) كحد أدنى. ضع هدف ادخار تلقائي.`;
      }
    } else if (lq.includes("ميزانية") || lq.includes("صرف") || lq.includes("إنفاق")) {
      const overBudget = budgets.filter(b => b.currentSpending > b.monthlyLimit);
      if (overBudget.length > 0) {
        response = `تجاوزت ميزانية ${overBudget.map(b => b.category).join("، ")}. راجع إنفاقك في هذه الفئات. رصيدك الآمن المتاح هذا الشهر: ${Math.max(0, Math.round(remainingBudget))} ر.س.`;
      } else {
        response = `ميزانيتك في المسار الصحيح! الرصيد المتاح هذا الشهر: ${Math.round(remainingBudget)} ر.س. استمر في الالتزام.`;
      }
    } else if (lq.includes("هدف") || lq.includes("goal")) {
      if (goals.length === 0) {
        response = `لم تضع أهدافاً ادخارية بعد. أنصحك بتحديد هدف واضح (مثل: شراء سيارة، سفر، طوارئ) وسأساعدك في خطة ادخار شهرية.`;
      } else {
        const progresses = goals.map(g => `${g.goalType}: ${Math.round((g.currentAmount / g.targetAmount) * 100)}%`).join(", ");
        response = `تقدمك في أهدافك: ${progresses}. ${totalSavings > 0 ? `رصيد محفظتك الحالي ${totalSavings} ر.س.` : "ابدأ بإضافة مدخرات لتسريع تحقيق أهدافك."}`;
      }
    } else if (lq.includes("التزام") || lq.includes("قرض") || lq.includes("ديون")) {
      const obligationsRatio = totalIncome > 0 ? totalObligations / totalIncome : 0;
      response = `التزاماتك الشهرية: ${totalObligations} ر.س (${Math.round(obligationsRatio * 100)}% من دخلك). ${obligationsRatio > 0.40 ? "هذا مرتفع! أنصح بتجنب أي التزامات إضافية." : "أنت في منطقة آمنة."}`;
    } else {
      // General financial health
      response = `نبضتك المالية الحالية: ${currentScore}/100. دخلك الشهري: ${totalIncome} ر.س، إنفاقك هذا الشهر: ${thisMonthExpenses} ر.س، مدخراتك: ${totalSavings} ر.س. ${currentScore >= 70 ? "وضعك المالي جيد، استمر!" : "وضعك يحتاج بعض التحسين. ابدأ بتقليل الإنفاق وزيادة الادخار."}`;
    }

    // Activity log
    await db.insert(activityLogsTable).values({
      userId,
      action: "assistant_query",
      description: `سؤال للمساعد: "${question.slice(0, 50)}"`,
    }).catch(() => {});

    res.json({
      question,
      response,
      context: {
        currentScore,
        totalIncome,
        thisMonthExpenses,
        totalSavings,
        remainingBudget: Math.round(remainingBudget),
        totalObligations,
        goalsCount: goals.length,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to process question" });
  }
});

export default router;
