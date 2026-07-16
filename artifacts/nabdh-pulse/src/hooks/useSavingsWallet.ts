import { useState, useCallback } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface SavingTransaction {
  id: string;
  amount: number;
  date: string;        // ISO string
  note?: string;
}

export interface SavingsState {
  balance: number;
  availableBalance: number;
  goal: number;
  transactions: SavingTransaction[];
}

export interface MonthlyReport {
  totalIncome: number;
  totalSaved: number;
  savingPercent: number;
  actionCount: number;
  remainingBalance: number;
  goalProgress: number;   // 0–100
}

export interface Insight {
  id: string;
  icon: "trending-up" | "target" | "star";
  text: string;
}

const STORAGE_KEY = "nabdh_savings_wallet";

const DEFAULT_STATE: SavingsState = {
  balance: 0,
  availableBalance: 7500,   // simulated monthly income
  goal: 5000,
  transactions: [],
};

// ── Wallet level helper ───────────────────────────────────────────────────────
export function walletLevel(balance: number, goal: number): 1 | 2 | 3 | 4 {
  if (goal <= 0) return 1;
  const pct = balance / goal;
  if (pct >= 1)    return 4;
  if (pct >= 0.65) return 3;
  if (pct >= 0.30) return 2;
  return 1;
}

// ── Persistence helpers ───────────────────────────────────────────────────────
function load(): SavingsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...DEFAULT_STATE };
}

function save(state: SavingsState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useSavingsWallet() {
  const [state, setState] = useState<SavingsState>(load);

  const persist = useCallback((next: SavingsState) => {
    save(next);
    setState(next);
  }, []);

  // Add a saving deposit
  const addSaving = useCallback((amount: number, note?: string) => {
    setState(prev => {
      const tx: SavingTransaction = {
        id: Date.now().toString(),
        amount,
        date: new Date().toISOString(),
        note,
      };
      const next: SavingsState = {
        ...prev,
        balance: prev.balance + amount,
        availableBalance: Math.max(0, prev.availableBalance - amount),
        transactions: [tx, ...prev.transactions],
      };
      save(next);
      return next;
    });
  }, []);

  // Update savings goal
  const setGoal = useCallback((goal: number) => {
    setState(prev => {
      const next = { ...prev, goal };
      save(next);
      return next;
    });
  }, []);

  // Reset (for demo / testing)
  const reset = useCallback(() => {
    persist({ ...DEFAULT_STATE });
  }, [persist]);

  // Monthly report
  const getMonthlyReport = useCallback((): MonthlyReport => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthTxs = state.transactions.filter(tx => tx.date >= monthStart);
    const totalSaved = monthTxs.reduce((s, tx) => s + tx.amount, 0);
    const totalIncome = state.availableBalance + totalSaved; // reconstruct from deductions
    const goalProgress = state.goal > 0
      ? Math.min(100, Math.round((state.balance / state.goal) * 100))
      : 0;
    return {
      totalIncome,
      totalSaved,
      savingPercent: totalIncome > 0 ? Math.round((totalSaved / totalIncome) * 100) : 0,
      actionCount: monthTxs.length,
      remainingBalance: state.availableBalance,
      goalProgress,
    };
  }, [state]);

  // Smart insights
  const getInsights = useCallback((): Insight[] => {
    const report = getMonthlyReport();
    const insights: Insight[] = [];

    if (report.actionCount >= 3) {
      insights.push({
        id: "habit",
        icon: "star",
        text: `أنت تدخر بانتظام — ${report.actionCount} عملية توفير هذا الشهر. استمر!`,
      });
    }

    if (state.goal > 0 && state.balance > 0) {
      const remaining = state.goal - state.balance;
      if (remaining > 0 && report.totalSaved > 0) {
        const monthsLeft = Math.ceil(remaining / report.totalSaved);
        insights.push({
          id: "projection",
          icon: "target",
          text: `إذا واصلت نفس الوتيرة، ستصل إلى هدفك خلال ${monthsLeft} ${monthsLeft === 1 ? "شهر" : "أشهر"}.`,
        });
      }
    }

    if (report.savingPercent > 0) {
      insights.push({
        id: "rate",
        icon: "trending-up",
        text: `نسبة ادخارك هذا الشهر ${report.savingPercent}% — ${report.savingPercent >= 20 ? "ممتاز! أنت تدخر أكثر من المعدل العام." : "حاول الوصول لـ 20% لنتائج أفضل."}`,
      });
    }

    if (insights.length === 0) {
      insights.push({
        id: "start",
        icon: "star",
        text: "ابدأ بإضافة مبلغ صغير إلى محفظتك الآن — كل ريال يُحدث فرقًا!",
      });
    }

    return insights;
  }, [state, getMonthlyReport]);

  return {
    state,
    addSaving,
    setGoal,
    reset,
    getMonthlyReport,
    getInsights,
    level: walletLevel(state.balance, state.goal),
    progressPct: state.goal > 0 ? Math.min(100, Math.round((state.balance / state.goal) * 100)) : 0,
  };
}
