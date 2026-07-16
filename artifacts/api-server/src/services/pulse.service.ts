/**
 * Financial Pulse Score calculation service.
 * Score: 0–100 based on 6 weighted dimensions.
 *
 * Weights:
 *  25% Spending vs Income
 *  20% Budget commitment
 *  20% Saving growth
 *  15% Obligations regularity
 *  10% Spending behavior
 *  10% Goals progress
 */

export interface PulseInput {
  monthlySalary: number;
  extraIncome: number;
  totalExpenses: number;        // sum of transactions this month (expenses)
  totalObligations: number;     // sum of obligations amounts
  totalSavings: number;         // cumulative savings wallet balance
  prevMonthSavings: number;     // savings balance last month
  budgetCategories: { limit: number; spent: number }[];
  goalsProgress: { target: number; current: number }[];  // for each goal
  impulsiveTransactions: number; // count of transactions > 50% single-category budget
}

export interface PulseResult {
  score: number;
  status: "ممتاز" | "مستقر مالياً" | "يحتاج انتباه" | "خطر";
  statusEn: "Excellent" | "Financially stable" | "Needs attention" | "Risky";
  spendingIncomeRatio: number;
  budgetCommitment: number;
  savingGrowth: number;
  obligationsScore: number;
  behaviorScore: number;
  goalsScore: number;
  strengths: string[];
  improvements: string[];
  recommendations: string[];
}

export function calculatePulseScore(input: PulseInput): PulseResult {
  const totalIncome = input.monthlySalary + input.extraIncome;

  // ── 1. Spending vs Income (25%) ─────────────────────────────────────────────
  const spendingRatio = totalIncome > 0 ? input.totalExpenses / totalIncome : 1;
  let spendingScore = 0;
  if (spendingRatio <= 0.40) spendingScore = 100;
  else if (spendingRatio <= 0.55) spendingScore = 80;
  else if (spendingRatio <= 0.70) spendingScore = 60;
  else if (spendingRatio <= 0.85) spendingScore = 35;
  else spendingScore = 10;

  // ── 2. Budget Commitment (20%) ──────────────────────────────────────────────
  let budgetScore = 85; // default if no budgets set
  if (input.budgetCategories.length > 0) {
    const ratios = input.budgetCategories.map(b =>
      b.limit > 0 ? Math.min(b.spent / b.limit, 1.5) : 0
    );
    const avgRatio = ratios.reduce((a, c) => a + c, 0) / ratios.length;
    if (avgRatio <= 0.70) budgetScore = 100;
    else if (avgRatio <= 0.85) budgetScore = 80;
    else if (avgRatio <= 1.00) budgetScore = 60;
    else if (avgRatio <= 1.20) budgetScore = 30;
    else budgetScore = 10;
  }

  // ── 3. Saving Growth (20%) ──────────────────────────────────────────────────
  let savingScore = 50; // default
  const savingRate = totalIncome > 0 ? input.totalSavings / totalIncome : 0;
  const savingGrowthRate = input.prevMonthSavings > 0
    ? (input.totalSavings - input.prevMonthSavings) / input.prevMonthSavings
    : (input.totalSavings > 0 ? 1 : 0);
  if (savingRate >= 0.20 && savingGrowthRate >= 0) savingScore = 100;
  else if (savingRate >= 0.10) savingScore = 75;
  else if (savingRate >= 0.05) savingScore = 50;
  else if (savingRate > 0) savingScore = 25;
  else savingScore = 0;

  // ── 4. Obligations Regularity (15%) ────────────────────────────────────────
  const obligationsRatio = totalIncome > 0 ? input.totalObligations / totalIncome : 0;
  let obligationsScore = 0;
  if (obligationsRatio <= 0.20) obligationsScore = 100;
  else if (obligationsRatio <= 0.30) obligationsScore = 75;
  else if (obligationsRatio <= 0.40) obligationsScore = 50;
  else if (obligationsRatio <= 0.50) obligationsScore = 25;
  else obligationsScore = 0;

  // ── 5. Spending Behavior (10%) ──────────────────────────────────────────────
  let behaviorScore = 100;
  if (input.impulsiveTransactions >= 5) behaviorScore = 20;
  else if (input.impulsiveTransactions >= 3) behaviorScore = 50;
  else if (input.impulsiveTransactions >= 1) behaviorScore = 75;

  // ── 6. Goals Progress (10%) ─────────────────────────────────────────────────
  let goalsScore = 70; // default no goals
  if (input.goalsProgress.length > 0) {
    const progresses = input.goalsProgress.map(g =>
      g.target > 0 ? g.current / g.target : 0
    );
    const avgProgress = progresses.reduce((a, c) => a + c, 0) / progresses.length;
    goalsScore = Math.min(Math.round(avgProgress * 100), 100);
  }

  // ── Weighted Total ──────────────────────────────────────────────────────────
  const score = Math.round(
    spendingScore  * 0.25 +
    budgetScore    * 0.20 +
    savingScore    * 0.20 +
    obligationsScore * 0.15 +
    behaviorScore  * 0.10 +
    goalsScore     * 0.10
  );

  const clampedScore = Math.max(0, Math.min(100, score));

  // ── Status ──────────────────────────────────────────────────────────────────
  let status: PulseResult["status"];
  let statusEn: PulseResult["statusEn"];
  if (clampedScore >= 80) { status = "ممتاز"; statusEn = "Excellent"; }
  else if (clampedScore >= 60) { status = "مستقر مالياً"; statusEn = "Financially stable"; }
  else if (clampedScore >= 40) { status = "يحتاج انتباه"; statusEn = "Needs attention"; }
  else { status = "خطر"; statusEn = "Risky"; }

  // ── Strengths & Improvements ────────────────────────────────────────────────
  const strengths: string[] = [];
  const improvements: string[] = [];
  const recommendations: string[] = [];

  if (spendingScore >= 80) strengths.push("إنفاقك في حدود آمنة مقارنة بدخلك");
  else improvements.push("تقليل الإنفاق الشهري لحماية رصيدك");

  if (budgetScore >= 80) strengths.push("التزامك بالميزانية ممتاز");
  else improvements.push("راجع ميزانية الفئات المتجاوزة");

  if (savingScore >= 75) strengths.push("معدل ادخارك جيد جداً");
  else { improvements.push("زيادة نسبة الادخار الشهري"); recommendations.push("حاول ادخار 10% على الأقل من دخلك كل شهر"); }

  if (obligationsScore >= 75) strengths.push("التزاماتك المالية في نطاق مقبول");
  else { improvements.push("الالتزامات مرتفعة نسبياً"); recommendations.push("تجنب إضافة التزامات جديدة حتى تنخفض النسبة"); }

  if (behaviorScore >= 75) strengths.push("سلوكك الإنفاقي منضبط");
  else { improvements.push("تجنب المشتريات الاندفاعية"); recommendations.push("انتظر 24 ساعة قبل أي شراء غير ضروري"); }

  if (goalsScore >= 50) strengths.push("تقدم ملحوظ نحو أهدافك المالية");
  else { improvements.push("زيادة المساهمة في أهدافك"); }

  return {
    score: clampedScore,
    status,
    statusEn,
    spendingIncomeRatio: Math.round(spendingScore),
    budgetCommitment: Math.round(budgetScore),
    savingGrowth: Math.round(savingScore),
    obligationsScore: Math.round(obligationsScore),
    behaviorScore: Math.round(behaviorScore),
    goalsScore: Math.round(goalsScore),
    strengths,
    improvements,
    recommendations,
  };
}

/** Compute pulse score impact of a hypothetical expense */
export function simulatePurchaseImpact(
  baseInput: PulseInput,
  purchaseAmount: number,
  category: string,
): { before: PulseResult; after: PulseResult; impactLevel: "low" | "medium" | "high" } {
  const before = calculatePulseScore(baseInput);

  const modifiedBudgets = baseInput.budgetCategories.map(b =>
    b === undefined ? b : { ...b }
  );
  // Add spending in the matching category
  const catBudget = modifiedBudgets.find(b => b.limit > 0);
  if (catBudget) catBudget.spent += purchaseAmount;

  const afterInput: PulseInput = {
    ...baseInput,
    totalExpenses: baseInput.totalExpenses + purchaseAmount,
    budgetCategories: modifiedBudgets,
  };
  const after = calculatePulseScore(afterInput);

  const diff = before.score - after.score;
  const impactLevel: "low" | "medium" | "high" =
    diff <= 3 ? "low" : diff <= 8 ? "medium" : "high";

  return { before, after, impactLevel };
}
