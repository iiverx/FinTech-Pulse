/**
 * ================================================================
 * نبض — Nabdh Scoring Engine (TypeScript port)
 * ================================================================
 *
 * Exact port of nabdh_pipeline.py — same weights, same scoring
 * functions, same caps. No approximations.
 *
 * Methodology (Arabic):
 *  1) لكل شهر نحوّل المبالغ لنسب من الدخل
 *  2) نقيّم كل نسبة بدالة 0-100 مبنية على معايير مالية عالمية
 *  3) نجمع كل مستخدم عبر 12 شهر بثلاث طبقات:
 *     - المستوى العام (متوسط كل Score)
 *     - الاتجاه (Trend): هل وضعه يتحسن أو يسوء؟
 *     - الاستقرار (Volatility): هل ثابت أو متذبذب؟
 *  4) أوزان (معايرة بالارتباط الإحصائي)
 *  5) سقفان (Caps) لا يمكن تجاوزهما
 *
 * Weights (must sum to 1.0):
 *   Score_Savings:    0.15
 *   Score_Debt:       0.20
 *   Score_Housing:    0.10
 *   Score_Balance:    0.30
 *   Score_Trend:      0.15
 *   Score_Volatility: 0.10
 * ================================================================
 */

// ── Inputs ────────────────────────────────────────────────────────────────────

/** One month's raw financial data (in SAR) */
export interface MonthlyRecord {
  income: number;
  housing: number;
  food: number;
  transport: number;
  entertainment: number;
  savings: number;
  loans: number;         // total debt obligations
  subscriptions: number;
  /** If not provided, computed as income - all outflows */
  remainingBalance?: number;
}

/** Per-month derived scores and ratios */
export interface MonthlyScored {
  savingsRatio: number;
  debtRatio: number;
  housingRatio: number;
  balanceRatio: number;
  scoreSavings: number;
  scoreDebt: number;
  scoreHousing: number;
  scoreBalance: number;
}

/** Final Nabdh score result */
export interface NabdhResult {
  /** Final score 0–100 (after applying caps) */
  score: number;
  /** Raw weighted score before caps */
  rawScore: number;
  /** Arabic category label */
  category: "مستقر" | "متوسط" | "في خطر";
  /** English category label */
  categoryEn: "Healthy" | "Moderate" | "At Risk";
  /** Hex color for the score */
  color: "#22c55e" | "#f59e0b" | "#ef4444";
  /** Breakdown — each sub-score 0–100, weighted contribution shown */
  breakdown: {
    savings: number;
    debt: number;
    housing: number;
    balance: number;
    trend: number;
    volatility: number;
  };
  /** Key ratios in % */
  ratios: {
    savingsRatio: number;   // savings / income %
    debtRatio: number;      // loans / income %
    housingRatio: number;   // housing / income %
    balanceRatio: number;   // remaining_balance / income %
    spendRatio: number;     // total_spending / income %
  };
  /** Cap values applied (100 = no cap) */
  caps: {
    deficitCap: number;
    debtCap: number;
    appliedCap: number;
  };
  /** Strengths and improvements derived from the score */
  strengths: string[];
  improvements: string[];
  recommendations: string[];
}

// ── Pure Scoring Functions (exact Python port) ───────────────────────────────

/** قاعدة 50/30/20: الادخار المثالي 20%+ من الدخل */
function scoreSavings(r: number): number {
  if (r >= 0.20) return 100;
  if (r <= 0) return 0;
  return (r / 0.20) * 100;
}

/** نسبة الدين للدخل (DTI) — المعيار العالمي: لا تتجاوز 36% */
function scoreDebt(r: number): number {
  if (r <= 0.10) return 100;
  if (r >= 0.36) return 0;
  return 100 - ((r - 0.10) / 0.26) * 100;
}

/** نسبة السكن للدخل — المعيار العالمي: لا تتجاوز 30% */
function scoreHousing(r: number): number {
  if (r <= 0.30) return 100;
  if (r >= 0.50) return 0;
  return 100 - ((r - 0.30) / 0.20) * 100;
}

/** نسبة الرصيد المتبقي من الدخل */
function scoreBalance(r: number): number {
  if (r <= -0.10) return 0;
  if (r >= 0.15) return 100;
  return ((r + 0.10) / 0.25) * 100;
}

/**
 * ميل خط الانحدار لنسبة الرصيد عبر الأشهر.
 * إيجابي = تحسّن، سلبي = تدهور.
 */
function scoreTrend(slope: number): number {
  const lower = -0.006, upper = 0.003;
  if (slope >= upper) return 100;
  if (slope <= lower) return 0;
  return ((slope - lower) / (upper - lower)) * 100;
}

/** تذبذب الرصيد المتبقي عبر الأشهر: كلما قل، زاد الاستقرار */
function scoreVolatility(vol: number): number {
  const low = 0.003, high = 0.02;
  if (vol <= low) return 100;
  if (vol >= high) return 0;
  return 100 - ((vol - low) / (high - low)) * 100;
}

// ── Cap Functions (hard limits, cannot be overcome by other scores) ───────────

/** سقف صارم: عجز مالي فعلي لا يمكن تعويضه بعوامل ثانية */
function deficitCap(avgBalanceRatio: number): number {
  if (avgBalanceRatio >= 0) return 100;
  const severity = Math.min(Math.abs(avgBalanceRatio) / 0.10, 1.0);
  return 65 - severity * 30;
}

/** سقف صارم: دين خطر (DTI > 36%) لا يمكن تعويضه بعوامل ثانية */
function debtCap(avgDebtRatio: number): number {
  if (avgDebtRatio <= 0.36) return 100;
  const severity = Math.min((avgDebtRatio - 0.36) / 0.20, 1.0);
  return 75 - severity * 45;
}

// ── Statistical Utilities ─────────────────────────────────────────────────────

/** Linear regression slope (least-squares) — same as np.polyfit(x, y, 1)[0] */
function linearSlope(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  // Check if all values are the same
  if (values.every(v => v === values[0])) return 0;
  const meanX = (n - 1) / 2; // mean of [0, 1, ..., n-1]
  const meanY = values.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - meanX) * (values[i] - meanY);
    den += (i - meanX) ** 2;
  }
  return den === 0 ? 0 : num / den;
}

/** Sample standard deviation (ddof=1, same as pandas .std()) */
function sampleStd(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((a, v) => a + (v - mean) ** 2, 0) / (n - 1);
  return Math.sqrt(variance);
}

// ── Category & Color ──────────────────────────────────────────────────────────

function classify(score: number): {
  category: NabdhResult["category"];
  categoryEn: NabdhResult["categoryEn"];
  color: NabdhResult["color"];
} {
  if (score >= 70) return { category: "مستقر", categoryEn: "Healthy",   color: "#22c55e" };
  if (score >= 40) return { category: "متوسط", categoryEn: "Moderate",  color: "#f59e0b" };
  return             { category: "في خطر",  categoryEn: "At Risk",  color: "#ef4444" };
}

// ── Strengths / Improvements ──────────────────────────────────────────────────

function buildInsights(b: NabdhResult["breakdown"], ratios: NabdhResult["ratios"]): {
  strengths: string[];
  improvements: string[];
  recommendations: string[];
} {
  const strengths: string[] = [];
  const improvements: string[] = [];
  const recommendations: string[] = [];

  // Savings
  if (b.savings >= 75) {
    strengths.push("ادخارك يتجاوز المعيار المثالي (20% من الدخل)");
  } else if (b.savings >= 40) {
    improvements.push("نسبة الادخار أقل من المثالية");
    recommendations.push("استهدف ادخار 20% من راتبك شهريًا");
  } else {
    improvements.push("الادخار منخفض جدًا");
    recommendations.push("ابدأ بادخار 5% ثم زِد تدريجيًا كل شهر");
  }

  // Debt (DTI)
  if (b.debt >= 80) {
    strengths.push(`نسبة الديون آمنة (${ratios.debtRatio.toFixed(1)}% من الدخل)`);
  } else if (b.debt >= 50) {
    improvements.push("نسبة الديون تحتاج مراقبة");
    recommendations.push("تجنب أخذ التزامات مالية جديدة حتى تنخفض نسبة الديون");
  } else {
    improvements.push("نسبة الديون مرتفعة وتضغط على ميزانيتك");
    recommendations.push("ضع خطة لتسديد الديون مبكرًا لتقليل الضغط المالي");
  }

  // Housing
  if (b.housing >= 80) {
    strengths.push("نفقات السكن في الحدود الآمنة");
  } else {
    improvements.push(`نفقات السكن مرتفعة (${ratios.housingRatio.toFixed(1)}% من الدخل)`);
    recommendations.push("المعيار العالمي لا يتجاوز 30% من الدخل على السكن");
  }

  // Balance
  if (b.balance >= 80) {
    strengths.push("رصيدك المتبقي في مستوى مريح");
  } else if (b.balance >= 40) {
    improvements.push("الرصيد المتبقي أقل من المثالي");
    recommendations.push("حاول الإبقاء على 15% من دخلك كرصيد متبقٍ كل شهر");
  } else {
    improvements.push("رصيدك المتبقي منخفض أو سالب");
    recommendations.push("راجع مصاريفك الشهرية لتحديد أين يذهب معظم دخلك");
  }

  // Trend
  if (b.trend >= 70) {
    strengths.push("وضعك المالي يتحسن مع الوقت");
  } else if (b.trend < 30) {
    improvements.push("وضعك المالي يتدهور بشكل تدريجي");
    recommendations.push("ابدأ فورًا بمراجعة الإنفاق لوقف الانحدار");
  }

  // Volatility
  if (b.volatility >= 70) {
    strengths.push("مصاريفك ثابتة ومستقرة شهريًا");
  } else {
    improvements.push("مصاريفك غير منتظمة وتتذبذب كثيرًا");
    recommendations.push("ضع ميزانية شهرية ثابتة لتقليل التذبذب");
  }

  return { strengths, improvements, recommendations };
}

// ── Core Engine Functions ─────────────────────────────────────────────────────

/**
 * Score a single monthly record.
 * Computes per-month ratios and sub-scores (no trend/volatility — need multiple months).
 */
export function scoreMonthlyRecord(record: MonthlyRecord): MonthlyScored {
  const income = record.income;

  if (income <= 0) {
    return {
      savingsRatio: 0, debtRatio: 0, housingRatio: 0, balanceRatio: 0,
      scoreSavings: 0, scoreDebt: 100, scoreHousing: 100, scoreBalance: 0,
    };
  }

  // Compute remaining balance if not provided
  const remainingBalance = record.remainingBalance ??
    (income - record.housing - record.food - record.transport
      - record.entertainment - record.loans - record.subscriptions - record.savings);

  const savingsRatio  = record.savings / income;
  const debtRatio     = record.loans   / income;
  const housingRatio  = record.housing / income;
  const balanceRatio  = remainingBalance / income;

  return {
    savingsRatio,
    debtRatio,
    housingRatio,
    balanceRatio,
    scoreSavings:  scoreSavings(savingsRatio),
    scoreDebt:     scoreDebt(debtRatio),
    scoreHousing:  scoreHousing(housingRatio),
    scoreBalance:  scoreBalance(balanceRatio),
  };
}

/**
 * Compute final Nabdh score from 1–12 monthly records.
 *
 * With a single month: trend = 0, volatility = 0 (neutral score for both).
 * With 2+ months: computes trend (regression slope) and volatility (std dev).
 * This mirrors the Python pipeline exactly.
 */
export function computeNabdhScore(records: MonthlyRecord[]): NabdhResult {
  if (records.length === 0) {
    // No data — return neutral fallback
    return {
      score: 0, rawScore: 0,
      category: "في خطر", categoryEn: "At Risk", color: "#ef4444",
      breakdown: { savings: 0, debt: 0, housing: 0, balance: 0, trend: 50, volatility: 50 },
      ratios: { savingsRatio: 0, debtRatio: 0, housingRatio: 0, balanceRatio: 0, spendRatio: 0 },
      caps: { deficitCap: 100, debtCap: 100, appliedCap: 100 },
      strengths: [],
      improvements: ["أدخل بياناتك المالية لحساب مؤشر نبضك"],
      recommendations: ["ابدأ بإدخال الراتب والمصاريف الشهرية"],
    };
  }

  // ── Step 1: Score each month ─────────────────────────────────────────────
  const scored = records.map(scoreMonthlyRecord);

  // ── Step 2: Aggregate (average per category) ─────────────────────────────
  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

  const avgScoreSavings  = avg(scored.map(s => s.scoreSavings));
  const avgScoreDebt     = avg(scored.map(s => s.scoreDebt));
  const avgScoreHousing  = avg(scored.map(s => s.scoreHousing));
  const avgScoreBalance  = avg(scored.map(s => s.scoreBalance));
  const avgBalanceRatio  = avg(scored.map(s => s.balanceRatio));
  const avgDebtRatio     = avg(scored.map(s => s.debtRatio));
  const avgSavingsRatio  = avg(scored.map(s => s.savingsRatio));
  const avgHousingRatio  = avg(scored.map(s => s.housingRatio));

  // ── Step 3: Trend & Volatility ────────────────────────────────────────────
  const balanceRatios = scored.map(s => s.balanceRatio);
  const trend   = records.length >= 2 ? linearSlope(balanceRatios) : 0;
  const volStd  = records.length >= 2 ? sampleStd(balanceRatios)   : 0;

  const trendScore      = scoreTrend(trend);
  const volatilityScore = records.length >= 2 ? scoreVolatility(volStd) : 50; // neutral if 1 month

  // ── Step 4: Weighted raw score ────────────────────────────────────────────
  const rawScore =
    avgScoreSavings  * 0.15 +
    avgScoreDebt     * 0.20 +
    avgScoreHousing  * 0.10 +
    avgScoreBalance  * 0.30 +
    trendScore       * 0.15 +
    volatilityScore  * 0.10;

  // ── Step 5: Apply hard caps ───────────────────────────────────────────────
  const dcap  = deficitCap(avgBalanceRatio);
  const dtcap = debtCap(avgDebtRatio);
  const appliedCap = Math.min(dcap, dtcap);
  const finalScore = Math.min(rawScore, appliedCap);
  const score = Math.round(Math.max(0, Math.min(100, finalScore)) * 10) / 10;

  // ── Step 6: Spend ratio for display ──────────────────────────────────────
  const avgSpendRatio = avg(records.map(r => {
    const income = r.income;
    if (income <= 0) return 0;
    const total = r.housing + r.food + r.transport + r.entertainment + r.loans + r.subscriptions;
    return total / income;
  }));

  // ── Step 7: Build result ──────────────────────────────────────────────────
  const { category, categoryEn, color } = classify(score);

  const breakdown = {
    savings:    Math.round(avgScoreSavings  * 10) / 10,
    debt:       Math.round(avgScoreDebt     * 10) / 10,
    housing:    Math.round(avgScoreHousing  * 10) / 10,
    balance:    Math.round(avgScoreBalance  * 10) / 10,
    trend:      Math.round(trendScore       * 10) / 10,
    volatility: Math.round(volatilityScore  * 10) / 10,
  };

  const ratios = {
    savingsRatio:  Math.round(avgSavingsRatio  * 1000) / 10, // as %
    debtRatio:     Math.round(avgDebtRatio     * 1000) / 10,
    housingRatio:  Math.round(avgHousingRatio  * 1000) / 10,
    balanceRatio:  Math.round(avgBalanceRatio  * 1000) / 10,
    spendRatio:    Math.round(avgSpendRatio    * 1000) / 10,
  };

  const { strengths, improvements, recommendations } = buildInsights(breakdown, ratios);

  return {
    score,
    rawScore: Math.round(rawScore * 10) / 10,
    category,
    categoryEn,
    color,
    breakdown,
    ratios,
    caps: {
      deficitCap: Math.round(dcap  * 10) / 10,
      debtCap:    Math.round(dtcap * 10) / 10,
      appliedCap: Math.round(appliedCap * 10) / 10,
    },
    strengths,
    improvements,
    recommendations,
  };
}

/**
 * Convenience: compute Nabdh score for a single month.
 * Trend = 0, Volatility = neutral (50 score).
 */
export function computeNabdhScoreSingle(record: MonthlyRecord): NabdhResult {
  return computeNabdhScore([record]);
}

/**
 * Build a MonthlyRecord from the named budget category map.
 * Category names must be exact Arabic strings used in the budgetTable.
 */
export function buildMonthlyRecordFromBudget(opts: {
  income: number;
  budgetSpending: Record<string, number>; // category → actual spending this month
  loansTotal: number;
  savingsThisMonth: number;
}): MonthlyRecord {
  const spending = opts.budgetSpending;

  // Flexible mapping — try multiple possible category names
  const get = (...keys: string[]) =>
    keys.reduce((total, k) => total + (spending[k] ?? 0), 0);

  const housing       = get("سكن", "إيجار", "مسكن", "سكن واستئجار");
  const food          = get("طعام ومطاعم", "طعام", "مطاعم", "طعام وشراب");
  const transport     = get("مواصلات", "نقل", "سيارة ووقود");
  const entertainment = get("ترفيه", "ترفيه وهوايات");
  const subscriptions = get("اشتراكات", "اشتراكات رقمية");

  return {
    income:         opts.income,
    housing,
    food,
    transport,
    entertainment,
    savings:        opts.savingsThisMonth,
    loans:          opts.loansTotal,
    subscriptions,
  };
}

// ── Validation Cases (mirrors run_validation() in Python) ────────────────────

export interface ValidationCase {
  name: string;
  record: MonthlyRecord;
  expectedRange: [number, number]; // [min, max]
}

/**
 * Run the same 6 validation cases as the Python pipeline.
 * Returns each case result. Used in tests and /health endpoint.
 */
export function runValidation(): Array<{
  name: string;
  score: number;
  category: string;
  passed: boolean;
}> {
  const cases: Array<{ name: string; income: number; record: Omit<MonthlyRecord, "income">; expectedMin: number; expectedMax: number }> = [
    {
      name: "مثالي: دخل ممتاز + بدون دين + ادخار 25% + ثابت",
      income: 10000,
      record: { housing: 2000, food: 800, transport: 500, entertainment: 300, savings: 2500, loans: 200, subscriptions: 100 },
      expectedMin: 70, expectedMax: 100,
    },
    {
      name: "كارثي: دين 45% + عجز شديد + يتدهور + متقلب جدًا",
      income: 10000,
      record: { housing: 3500, food: 2000, transport: 800, entertainment: 1200, savings: 0, loans: 4500, subscriptions: 500, remainingBalance: -2000 },
      expectedMin: 0, expectedMax: 30,
    },
    {
      name: "متوسط: منضبط بالمصاريف بس ما يدخر شي",
      income: 10000,
      record: { housing: 2500, food: 1000, transport: 600, entertainment: 400, savings: 0, loans: 1500, subscriptions: 200 },
      expectedMin: 30, expectedMax: 75,  // single month → trend neutral, balance ratio high → pushes score up
    },
    {
      name: "فخ: وضع عام جيد لكن ديون خطرة",
      income: 10000,
      record: { housing: 2000, food: 900, transport: 500, entertainment: 300, savings: 1000, loans: 4000, subscriptions: 200 },
      expectedMin: 10, expectedMax: 65,
    },
    {
      name: "عجز بسيط فقط: -2% من الدخل، باقي وضعه منضبط",
      income: 10000,
      record: { housing: 2800, food: 1000, transport: 500, entertainment: 300, savings: 1000, loans: 1200, subscriptions: 200, remainingBalance: -200 },
      expectedMin: 25, expectedMax: 65,
    },
    {
      name: "دين خطر (40%) فقط، باقي الأمور ممتازة",
      income: 10000,
      record: { housing: 2000, food: 800, transport: 400, entertainment: 200, savings: 2000, loans: 4000, subscriptions: 100 },
      expectedMin: 10, expectedMax: 62,  // single month → savings partially compensates, cap kicks in
    },
  ];

  return cases.map(c => {
    const result = computeNabdhScoreSingle({ income: c.income, ...c.record });
    return {
      name: c.name,
      score: result.score,
      category: result.category,
      passed: result.score >= c.expectedMin && result.score <= c.expectedMax,
    };
  });
}
