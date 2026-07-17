import { Router, type IRouter } from "express";
import {
  db, incomeTable, obligationsTable, budgetTable, goalsTable,
  transactionsTable, savingsTransactionsTable, financialPulseTable, activityLogsTable,
} from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "../middlewares/auth";
import { calculatePulseScore, simulatePurchaseImpact, type PulseInput } from "../services/pulse.service";
import { anthropic } from "@workspace/integrations-anthropic-ai";

const router: IRouter = Router();

const askSchema = z.object({
  question: z.string().min(1).max(500),
});

// ── Build full financial context snapshot for a user ──────────────────────────
async function buildFinancialContext(userId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const [
    income,
    obligations,
    budgets,
    goals,
    allTx,
    allSavings,
    pulseHistory,
  ] = await Promise.all([
    db.select().from(incomeTable).where(eq(incomeTable.userId, userId)).then(r => r[0]),
    db.select().from(obligationsTable).where(eq(obligationsTable.userId, userId)),
    db.select().from(budgetTable).where(eq(budgetTable.userId, userId)),
    db.select().from(goalsTable).where(eq(goalsTable.userId, userId)),
    db.select().from(transactionsTable).where(eq(transactionsTable.userId, userId)).orderBy(desc(transactionsTable.transactionDate)),
    db.select().from(savingsTransactionsTable).where(eq(savingsTransactionsTable.userId, userId)).orderBy(desc(savingsTransactionsTable.createdAt)),
    db.select().from(financialPulseTable).where(eq(financialPulseTable.userId, userId)).orderBy(desc(financialPulseTable.createdAt)).limit(6),
  ]);

  const monthlyIncome = (income?.monthlySalary ?? 0) + (income?.extraIncomeAmount ?? 0);
  const totalObligations = obligations.reduce((a, o) => a + o.amount, 0);

  // This-month transactions
  const thisMonthTx = allTx.filter(t => t.transactionDate >= startOfMonth);
  const lastMonthTx = allTx.filter(t => t.transactionDate >= startOfLastMonth && t.transactionDate <= endOfLastMonth);

  const thisMonthExpenses = thisMonthTx.filter(t => t.type === "expense").reduce((a, t) => a + t.amount, 0);
  const lastMonthExpenses = lastMonthTx.filter(t => t.type === "expense").reduce((a, t) => a + t.amount, 0);

  // Category breakdown this month
  const categoryMap: Record<string, number> = {};
  for (const t of thisMonthTx.filter(t => t.type === "expense")) {
    categoryMap[t.category] = (categoryMap[t.category] ?? 0) + t.amount;
  }
  const categoryBreakdown = Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, amt]) => ({ category: cat, amount: amt }));

  // Savings
  const totalSavings = allSavings.reduce((a, t) => a + t.amount, 0);
  const lastMonthSavings = allSavings
    .filter(t => t.createdAt <= endOfLastMonth)
    .reduce((a, t) => a + t.amount, 0);

  // Recent transactions (last 10)
  const recentTx = allTx.slice(0, 10).map(t => ({
    type: t.type,
    category: t.category,
    amount: t.amount,
    note: t.note,
    date: t.transactionDate,
  }));

  // Impulsive transaction detection (amount > 50% of category budget)
  const impulsiveCount = thisMonthTx.filter(t => {
    if (t.type !== "expense") return false;
    const budget = budgets.find(b => b.category === t.category);
    return budget && t.amount > budget.monthlyLimit * 0.5;
  }).length;

  // Pulse score — calculated fresh
  const pulseInput: PulseInput = {
    monthlySalary: income?.monthlySalary ?? 0,
    extraIncome: income?.extraIncomeAmount ?? 0,
    totalExpenses: thisMonthExpenses,
    totalObligations,
    totalSavings,
    prevMonthSavings: lastMonthSavings,
    budgetCategories: budgets.map(b => ({ limit: b.monthlyLimit, spent: b.currentSpending })),
    goalsProgress: goals.map(g => ({ target: g.targetAmount, current: g.currentAmount })),
    impulsiveTransactions: impulsiveCount,
  };
  const pulse = calculatePulseScore(pulseInput);

  // Remaining disposable income
  const remaining = monthlyIncome - thisMonthExpenses - totalObligations;
  const savingRate = monthlyIncome > 0 ? (totalSavings / monthlyIncome) * 100 : 0;
  const spendingRate = monthlyIncome > 0 ? (thisMonthExpenses / monthlyIncome) * 100 : 0;
  const obligationsRate = monthlyIncome > 0 ? (totalObligations / monthlyIncome) * 100 : 0;

  return {
    income, obligations, budgets, goals,
    monthlyIncome, totalObligations, thisMonthExpenses, lastMonthExpenses,
    categoryBreakdown, totalSavings, lastMonthSavings, recentTx,
    remaining, savingRate, spendingRate, obligationsRate,
    pulse, pulseInput,
    pulseHistory: pulseHistory.map(p => ({ score: p.score, date: p.createdAt })),
  };
}

// ── Build system prompt ────────────────────────────────────────────────────────
function buildSystemPrompt(ctx: Awaited<ReturnType<typeof buildFinancialContext>>, userName: string): string {
  const arabicMonth = new Date().toLocaleDateString("ar-SA", { month: "long", year: "numeric" });
  const budgetLines = ctx.budgets.map(b =>
    `  • ${b.category}: حد ${b.monthlyLimit} ر.س — إنفاق فعلي ${b.currentSpending} ر.س (${b.monthlyLimit > 0 ? Math.round((b.currentSpending / b.monthlyLimit) * 100) : 0}%)${b.currentSpending > b.monthlyLimit ? " ⚠️ تجاوز" : ""}`
  ).join("\n") || "  لا يوجد فئات ميزانية محددة";

  const obligLines = ctx.obligations.map(o =>
    `  • ${o.type}: ${o.amount} ر.س شهرياً`
  ).join("\n") || "  لا توجد التزامات";

  const goalLines = ctx.goals.map(g =>
    `  • ${g.goalType}: ${g.currentAmount} / ${g.targetAmount} ر.س (${Math.round((g.currentAmount / Math.max(g.targetAmount, 1)) * 100)}%)`
  ).join("\n") || "  لا توجد أهداف ادخارية";

  const catLines = ctx.categoryBreakdown.map(c =>
    `  • ${c.category}: ${c.amount} ر.س`
  ).join("\n") || "  لا توجد مصروفات مسجلة هذا الشهر";

  const recentLines = ctx.recentTx.map(t =>
    `  • [${t.type === "expense" ? "مصروف" : "دخل"}] ${t.category}${t.note ? ` (${t.note})` : ""}: ${t.amount} ر.س`
  ).join("\n") || "  لا توجد معاملات حديثة";

  const pulseHistory = ctx.pulseHistory.length > 1
    ? `سجل النبض: ${ctx.pulseHistory.map(p => p.score).join(" ← ")} (الأحدث أولاً)`
    : "";

  return `أنت "نبض" — المساعد المالي الذكي لتطبيق نبض الخاص بـ ${userName}.
تتحدث باللغة العربية الفصحى البسيطة المفهومة. أسلوبك ودود، مباشر، عملي، وثقيل بالأرقام الحقيقية.

══════════════════════════════════
📊 الوضع المالي الكامل — ${arabicMonth}
══════════════════════════════════

🔢 مؤشر النبض المالي: ${ctx.pulse.score}/100 (${ctx.pulse.status})
${pulseHistory}

تفاصيل المؤشر:
  • الإنفاق مقابل الدخل:  ${ctx.pulse.spendingIncomeRatio}/100 (وزن 25%)
  • الالتزام بالميزانية:   ${ctx.pulse.budgetCommitment}/100 (وزن 20%)
  • نمو الادخار:           ${ctx.pulse.savingGrowth}/100 (وزن 20%)
  • عبء الالتزامات:        ${ctx.pulse.obligationsScore}/100 (وزن 15%)
  • السلوك الإنفاقي:       ${ctx.pulse.behaviorScore}/100 (وزن 10%)
  • تقدم الأهداف:          ${ctx.pulse.goalsScore}/100 (وزن 10%)

💰 الدخل والإنفاق:
  • الدخل الشهري الإجمالي: ${ctx.monthlyIncome} ر.س
  • إنفاق هذا الشهر:       ${ctx.thisMonthExpenses} ر.س (${Math.round(ctx.spendingRate)}% من الدخل)
  • إنفاق الشهر الماضي:    ${ctx.lastMonthExpenses} ر.س
  • إجمالي الالتزامات:     ${ctx.totalObligations} ر.س (${Math.round(ctx.obligationsRate)}% من الدخل)
  • المتبقي المتاح:         ${ctx.remaining} ر.س

💼 الالتزامات الشهرية:
${obligLines}

📦 الميزانيات:
${budgetLines}

🧾 الإنفاق حسب الفئة هذا الشهر:
${catLines}

🏦 الادخار:
  • إجمالي المدخرات:  ${ctx.totalSavings} ر.س
  • نسبة الادخار:     ${ctx.savingRate.toFixed(1)}% من الدخل الشهري
  • مدخرات الشهر الماضي: ${ctx.lastMonthSavings} ر.س

🎯 الأهداف الادخارية:
${goalLines}

🔍 آخر 10 معاملات:
${recentLines}

══════════════════════════════════
قواعد الإجابة:
1. استخدم الأرقام الحقيقية من البيانات أعلاه دائماً، لا تخمّن.
2. احسب وقارن الأرقام بنفسك (نسب، فوارق، توقعات) قبل الإجابة.
3. قدّم توصيات محددة وقابلة للتطبيق مع أرقام واضحة.
4. إذا سأل عن شراء بمبلغ معين، احسب: هل يكفي المتبقي؟ كيف يؤثر على المؤشر؟
5. إذا سأل عن تحسين النبض، اشرح أي بُعد يحتاج تحسيناً وكيف بالضبط.
6. الإجابة باللغة العربية فقط. أسلوبك محترف لكن ودود.
7. لا تكرر البيانات كلها في كل إجابة — استخدم فقط ما هو ذو صلة بالسؤال.
8. الإجابة المثالية: فقرة أو اثنتان مع أرقام دقيقة + توصية واحدة أو اثنتان محددتان.`;
}

// ── POST /api/assistant/ask (SSE streaming) ────────────────────────────────────
router.post("/assistant/ask", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  const userName = req.session.userName ?? "المستخدم";
  const parsed = askSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const { question } = parsed.data;

  try {
    const ctx = await buildFinancialContext(userId);
    const systemPrompt = buildSystemPrompt(ctx, userName);

    // SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    let fullResponse = "";

    const stream = anthropic.messages.stream({
      model: "claude-haiku-4-5",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: question }],
    });

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        fullResponse += event.delta.text;
        res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`);
      }
    }

    // Send context snapshot alongside completion
    res.write(`data: ${JSON.stringify({
      done: true,
      context: {
        score: ctx.pulse.score,
        status: ctx.pulse.status,
        monthlyIncome: ctx.monthlyIncome,
        thisMonthExpenses: ctx.thisMonthExpenses,
        totalSavings: ctx.totalSavings,
        remaining: Math.round(ctx.remaining),
        totalObligations: ctx.totalObligations,
        savingRate: Math.round(ctx.savingRate),
        spendingRate: Math.round(ctx.spendingRate),
      },
    })}\n\n`);
    res.end();

    // Log activity
    await db.insert(activityLogsTable).values({
      userId,
      action: "assistant_query",
      description: `سؤال: "${question.slice(0, 60)}"`,
    }).catch(() => {});

  } catch (e) {
    console.error("[assistant]", e);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to process question" });
    } else {
      res.write(`data: ${JSON.stringify({ error: "حدث خطأ، حاول مجدداً." })}\n\n`);
      res.end();
    }
  }
});

// ── POST /api/assistant/simulate ── purchase impact without streaming ──────────
router.post("/assistant/simulate", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  const schema = z.object({ amount: z.number().positive(), category: z.string().optional() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid request" }); return; }

  try {
    const ctx = await buildFinancialContext(userId);
    const result = simulatePurchaseImpact(ctx.pulseInput, parsed.data.amount, parsed.data.category ?? "عام");
    res.json({
      before: result.before.score,
      after: result.after.score,
      drop: result.before.score - result.after.score,
      impactLevel: result.impactLevel,
      canAfford: ctx.remaining >= parsed.data.amount,
      remaining: Math.round(ctx.remaining),
    });
  } catch {
    res.status(500).json({ error: "Failed to simulate" });
  }
});

export default router;
