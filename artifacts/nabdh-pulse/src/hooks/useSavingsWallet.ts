import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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

const DEFAULT_GOAL = 5000;
const DEFAULT_AVAILABLE = 7500;

// ── API helpers ───────────────────────────────────────────────────────────────
// Session cookie is sent automatically by the browser — no auth header needed.
const JSON_HEADERS = { "Content-Type": "application/json" };

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(path, { credentials: "include" });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: JSON_HEADERS,
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "PUT",
    headers: JSON_HEADERS,
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

async function apiDelete<T>(path: string): Promise<T> {
  const res = await fetch(path, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

// ── Wallet level helper ───────────────────────────────────────────────────────
export function walletLevel(balance: number, goal: number): 1 | 2 | 3 | 4 {
  if (goal <= 0) return 1;
  const pct = balance / goal;
  if (pct >= 1)    return 4;
  if (pct >= 0.65) return 3;
  if (pct >= 0.30) return 2;
  return 1;
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useSavingsWallet() {
  const queryClient = useQueryClient();

  // ── Fetch goal ──────────────────────────────────────────────────────────────
  const { data: goalData } = useQuery({
    queryKey: ["savings-goal"],
    queryFn: () => apiGet<{ goal: number }>("/api/savings/goal"),
    staleTime: 30_000,
    retry: false,
  });

  // ── Fetch transactions ──────────────────────────────────────────────────────
  const { data: txData } = useQuery({
    queryKey: ["savings-transactions"],
    queryFn: () =>
      apiGet<{ transactions: SavingTransaction[] }>("/api/savings/transactions"),
    staleTime: 15_000,
    retry: false,
  });

  // ── Derived state ──────────────────────────────────────────────────────────
  const transactions: SavingTransaction[] = txData?.transactions ?? [];
  const goal = goalData?.goal ?? DEFAULT_GOAL;
  const balance = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  const availableBalance = Math.max(0, DEFAULT_AVAILABLE - balance);

  const state: SavingsState = {
    balance,
    availableBalance,
    goal,
    transactions,
  };

  // ── Add saving mutation ────────────────────────────────────────────────────
  const addSavingMutation = useMutation({
    mutationFn: ({ amount, note }: { amount: number; note?: string }) =>
      apiPost<SavingTransaction>("/api/savings/transactions", { amount, note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savings-transactions"] });
    },
  });

  const addSaving = useCallback(
    (amount: number, note?: string) => {
      addSavingMutation.mutate({ amount, note });
    },
    [addSavingMutation],
  );

  // ── Set goal mutation ──────────────────────────────────────────────────────
  const setGoalMutation = useMutation({
    mutationFn: (goal: number) =>
      apiPut<{ goal: number }>("/api/savings/goal", { goal }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savings-goal"] });
    },
  });

  const setGoal = useCallback(
    (goal: number) => {
      setGoalMutation.mutate(goal);
    },
    [setGoalMutation],
  );

  // ── Reset (clears all backend data for this user) ──────────────────────────
  const reset = useCallback(async () => {
    await Promise.all([
      apiDelete("/api/savings/transactions"),
      apiPut("/api/savings/goal", { goal: DEFAULT_GOAL }),
    ]);
    queryClient.invalidateQueries({ queryKey: ["savings-transactions"] });
    queryClient.invalidateQueries({ queryKey: ["savings-goal"] });
  }, [queryClient]);

  // ── Monthly report ─────────────────────────────────────────────────────────
  const getMonthlyReport = useCallback((): MonthlyReport => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthTxs = transactions.filter((tx) => tx.date >= monthStart);
    const totalSaved = monthTxs.reduce((s, tx) => s + tx.amount, 0);
    const totalIncome = availableBalance + totalSaved;
    const goalProgress =
      goal > 0 ? Math.min(100, Math.round((balance / goal) * 100)) : 0;
    return {
      totalIncome,
      totalSaved,
      savingPercent:
        totalIncome > 0 ? Math.round((totalSaved / totalIncome) * 100) : 0,
      actionCount: monthTxs.length,
      remainingBalance: availableBalance,
      goalProgress,
    };
  }, [transactions, availableBalance, goal, balance]);

  // ── Smart insights ─────────────────────────────────────────────────────────
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

    if (goal > 0 && balance > 0) {
      const remaining = goal - balance;
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
  }, [goal, balance, getMonthlyReport]);

  return {
    state,
    addSaving,
    setGoal,
    reset,
    getMonthlyReport,
    getInsights,
    level: walletLevel(state.balance, state.goal),
    progressPct:
      state.goal > 0
        ? Math.min(100, Math.round((state.balance / state.goal) * 100))
        : 0,
    isLoading: !txData || !goalData,
  };
}
