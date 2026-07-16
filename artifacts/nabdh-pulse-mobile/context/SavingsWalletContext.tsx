import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface SavingTransaction {
  id: string;
  amount: number;
  date: string; // ISO string
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
  goalProgress: number; // 0–100
}

export interface Insight {
  id: string;
  icon: 'trending-up' | 'target' | 'star';
  text: string;
}

export function walletLevel(balance: number, goal: number): 1 | 2 | 3 | 4 {
  if (goal <= 0) return 1;
  const pct = balance / goal;
  if (pct >= 1) return 4;
  if (pct >= 0.65) return 3;
  if (pct >= 0.3) return 2;
  return 1;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'nabdh_savings_wallet';

const DEFAULT_STATE: SavingsState = {
  balance: 0,
  availableBalance: 7500,
  goal: 5000,
  transactions: [],
};

// ── Context ───────────────────────────────────────────────────────────────────

interface WalletContextValue {
  state: SavingsState;
  loaded: boolean;
  addSaving: (amount: number, note?: string) => void;
  setGoal: (goal: number) => void;
  reset: () => void;
  getMonthlyReport: () => MonthlyReport;
  getInsights: () => Insight[];
  level: 1 | 2 | 3 | 4;
  progressPct: number;
  /** Monotonically-increasing counter; bumped on every addSaving call so screens can react. */
  depositCount: number;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export function SavingsWalletProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SavingsState>({ ...DEFAULT_STATE });
  const [loaded, setLoaded] = useState(false);
  const [depositCount, setDepositCount] = useState(0);

  // Load from AsyncStorage on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          setState({ ...DEFAULT_STATE, ...JSON.parse(raw) });
        } catch {
          // ignore parse errors
        }
      }
      setLoaded(true);
    });
  }, []);

  const persist = useCallback((next: SavingsState) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
    setState(next);
  }, []);

  const addSaving = useCallback((amount: number, note?: string) => {
    setState((prev) => {
      const tx: SavingTransaction = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
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
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
    // Bump deposit counter so wallet screen can react cross-tab
    setDepositCount((c) => c + 1);
  }, []);

  const setGoal = useCallback(
    (goal: number) => {
      persist({ ...state, goal });
    },
    [state, persist],
  );

  const reset = useCallback(() => {
    persist({ ...DEFAULT_STATE });
  }, [persist]);

  const getMonthlyReport = useCallback((): MonthlyReport => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthTxs = state.transactions.filter((tx) => tx.date >= monthStart);
    const totalSaved = monthTxs.reduce((s, tx) => s + tx.amount, 0);
    const totalIncome = state.availableBalance + totalSaved;
    const goalProgress =
      state.goal > 0 ? Math.min(100, Math.round((state.balance / state.goal) * 100)) : 0;
    return {
      totalIncome,
      totalSaved,
      savingPercent: totalIncome > 0 ? Math.round((totalSaved / totalIncome) * 100) : 0,
      actionCount: monthTxs.length,
      remainingBalance: state.availableBalance,
      goalProgress,
    };
  }, [state]);

  const getInsights = useCallback((): Insight[] => {
    const report = getMonthlyReport();
    const insights: Insight[] = [];

    if (report.actionCount >= 3) {
      insights.push({
        id: 'habit',
        icon: 'star',
        text: `أنت تدخر بانتظام — ${report.actionCount} عملية توفير هذا الشهر. استمر!`,
      });
    }

    if (state.goal > 0 && state.balance > 0) {
      const remaining = state.goal - state.balance;
      if (remaining > 0 && report.totalSaved > 0) {
        const monthsLeft = Math.ceil(remaining / report.totalSaved);
        insights.push({
          id: 'projection',
          icon: 'target',
          text: `إذا واصلت نفس الوتيرة، ستصل إلى هدفك خلال ${monthsLeft} ${monthsLeft === 1 ? 'شهر' : 'أشهر'}.`,
        });
      }
    }

    if (report.savingPercent > 0) {
      insights.push({
        id: 'rate',
        icon: 'trending-up',
        text: `نسبة ادخارك ${report.savingPercent}% — ${report.savingPercent >= 20 ? 'ممتاز! أنت تدخر أكثر من المعدل.' : 'حاول الوصول لـ 20% لنتائج أفضل.'}`,
      });
    }

    if (insights.length === 0) {
      insights.push({
        id: 'start',
        icon: 'star',
        text: 'ابدأ بإضافة مبلغ صغير إلى محفظتك الآن — كل ريال يُحدث فرقًا!',
      });
    }

    return insights;
  }, [state, getMonthlyReport]);

  const level = walletLevel(state.balance, state.goal);
  const progressPct =
    state.goal > 0 ? Math.min(100, Math.round((state.balance / state.goal) * 100)) : 0;

  return (
    <WalletContext.Provider
      value={{ state, loaded, addSaving, setGoal, reset, getMonthlyReport, getInsights, level, progressPct, depositCount }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useSavingsWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useSavingsWallet must be used within SavingsWalletProvider');
  return ctx;
}
