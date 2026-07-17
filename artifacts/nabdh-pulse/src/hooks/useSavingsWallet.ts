import { useState, useCallback, useEffect, useRef } from "react";
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

const DEFAULT_GOAL      = 5000;
const DEFAULT_AVAILABLE = 7500;

// ── localStorage keys ─────────────────────────────────────────────────────────
const LS_TRANSACTIONS   = "nabdh_transactions";
const LS_GOAL           = "nabdh_goal";
const REMINDER_KEY      = "nabdh_reminder_prefs";
const LAST_VISIT_KEY    = "nabdh_last_visit_month";
const LAST_REMINDER_FIRED = "nabdh_last_reminder_fired";

// ── Reminder helpers ──────────────────────────────────────────────────────────
export interface ReminderPrefs {
  enabled: boolean;
  dayOfWeek: number;
  hour: number;
}

const DEFAULT_REMINDER: ReminderPrefs = { enabled: false, dayOfWeek: 4, hour: 9 };

export function loadReminderPrefs(): ReminderPrefs {
  try {
    const raw = localStorage.getItem(REMINDER_KEY);
    if (raw) return { ...DEFAULT_REMINDER, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...DEFAULT_REMINDER };
}

export function saveReminderPrefs(prefs: ReminderPrefs): void {
  try { localStorage.setItem(REMINDER_KEY, JSON.stringify(prefs)); } catch { /* ignore */ }
}

export function checkAndRecordVisit(): string | null {
  const now = new Date();
  const current = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  try {
    const stored = localStorage.getItem(LAST_VISIT_KEY);
    localStorage.setItem(LAST_VISIT_KEY, current);
    if (stored && stored !== current) return stored;
  } catch { /* ignore */ }
  return null;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) return "denied";
  if (Notification.permission === "granted") return "granted";
  return Notification.requestPermission();
}

// ── Service Worker registration ───────────────────────────────────────────────

let _swRegistration: ServiceWorkerRegistration | null = null;

/** Register /sw.js once and cache the registration for later use. */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    if (_swRegistration) return _swRegistration;
    const base = import.meta.env.BASE_URL ?? "/";
    _swRegistration = await navigator.serviceWorker.register(`${base}sw.js`, { scope: base });
    return _swRegistration;
  } catch (err) {
    console.warn("[nabdh] SW registration failed:", err);
    return null;
  }
}

/**
 * Post the current reminder prefs + wallet snapshot to the Service Worker so
 * it can fire a background notification even when the tab is closed.
 * Also attempts to register a Periodic Background Sync (Chrome/Edge).
 */
export async function scheduleServiceWorkerReminder(
  prefs: ReminderPrefs,
  balance: number,
  goal: number,
): Promise<void> {
  const reg = await registerServiceWorker();
  if (!reg) return;

  // Wait for the SW to be ready to receive messages
  const sw = reg.active ?? reg.waiting ?? reg.installing;
  if (!sw) return;

  // Send the payload so the SW stores it in Cache API
  sw.postMessage({
    type: "SCHEDULE_REMINDER",
    payload: { ...prefs, balance, goal, lastFired: null },
  });

  // Attempt Periodic Background Sync (gracefully ignored if unsupported)
  if ("periodicSync" in reg && prefs.enabled && Notification.permission === "granted") {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (reg as any).periodicSync.register("nabdh-savings-reminder", {
        minInterval: 60 * 60 * 1000, // minimum 1 hour — browser decides actual cadence
      });
    } catch {
      // periodicSync.register may throw if the browser denies it (low engagement, etc.)
    }
  }
}

/**
 * Send a heartbeat CHECK_REMINDER message to the active SW.
 * Called every minute from the savings page so the SW can fire the notification
 * even without Periodic Background Sync (covers the "tab open" case cleanly).
 */
export async function pingServiceWorkerCheck(): Promise<void> {
  const reg = _swRegistration ?? await registerServiceWorker();
  if (!reg) return;
  const sw = reg.active ?? reg.waiting;
  if (sw) sw.postMessage({ type: "CHECK_REMINDER" });
}

/** Returns true if a reminder has already been fired for the current hour today. */
export function hasReminderFiredThisPeriod(): boolean {
  try {
    const stored = localStorage.getItem(LAST_REMINDER_FIRED);
    if (!stored) return false;
    const now = new Date();
    const key = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}`;
    return stored === key;
  } catch { return false; }
}

export function markReminderFired(): void {
  try {
    const now = new Date();
    const key = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}`;
    localStorage.setItem(LAST_REMINDER_FIRED, key);
  } catch { /* ignore */ }
}

export function fireReminderNotification(message: string): void {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification("نبض | تذكير الادخار 🪙", {
      body: message, icon: "/favicon.ico", dir: "rtl", lang: "ar",
    });
  } catch { /* ignore */ }
}

export function checkReminderShouldFire(prefs: ReminderPrefs): boolean {
  if (!prefs.enabled) return false;
  const now = new Date();
  if (now.getDay() !== prefs.dayOfWeek || now.getHours() !== prefs.hour) return false;
  if (hasReminderFiredThisPeriod()) return false;
  markReminderFired();
  return true;
}

// ── API helpers ───────────────────────────────────────────────────────────────
const JSON_HEADERS = { "Content-Type": "application/json" };

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(path, { credentials: "include" });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json() as Promise<T>;
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST", headers: JSON_HEADERS,
    credentials: "include", body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json() as Promise<T>;
}

async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "PUT", headers: JSON_HEADERS,
    credentials: "include", body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json() as Promise<T>;
}

async function apiDelete<T>(path: string): Promise<T> {
  const res = await fetch(path, { method: "DELETE", credentials: "include" });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json() as Promise<T>;
}

// ── localStorage helpers ──────────────────────────────────────────────────────
function lsLoadTransactions(): SavingTransaction[] {
  try {
    const raw = localStorage.getItem(LS_TRANSACTIONS);
    if (raw) return JSON.parse(raw) as SavingTransaction[];
  } catch { /* ignore */ }
  return [];
}

function lsSaveTransactions(txs: SavingTransaction[]): void {
  try { localStorage.setItem(LS_TRANSACTIONS, JSON.stringify(txs)); } catch { /* ignore */ }
}

function lsLoadGoal(): number {
  try {
    const raw = localStorage.getItem(LS_GOAL);
    if (raw) return Number(raw);
  } catch { /* ignore */ }
  return DEFAULT_GOAL;
}

function lsSaveGoal(goal: number): void {
  try { localStorage.setItem(LS_GOAL, String(goal)); } catch { /* ignore */ }
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

  // ── 1. Check if user is authenticated ───────────────────────────────────────
  const { data: authData, isLoading: authLoading } = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => apiGet<{ id: string }>("/api/auth/me"),
    retry: false,
    staleTime: 60_000,
  });

  const isAuthenticated = !!authData?.id;

  // ── 2a. API-backed queries (only when authenticated) ─────────────────────────
  const { data: goalData } = useQuery({
    queryKey: ["savings-goal"],
    queryFn: () => apiGet<{ goal: number }>("/api/savings/goal"),
    enabled: isAuthenticated,
    staleTime: 30_000,
    retry: false,
  });

  const { data: txData } = useQuery({
    queryKey: ["savings-transactions"],
    queryFn: () => apiGet<{ transactions: SavingTransaction[] }>("/api/savings/transactions"),
    enabled: isAuthenticated,
    staleTime: 15_000,
    retry: false,
  });

  // ── 2b. localStorage state (when NOT authenticated) ───────────────────────────
  const [lsTxs,  setLsTxs]  = useState<SavingTransaction[]>([]);
  const [lsGoal, setLsGoal] = useState<number>(DEFAULT_GOAL);
  const lsInited = useRef(false);

  useEffect(() => {
    // Load from localStorage once auth check resolves
    if (authLoading) return;
    if (!isAuthenticated && !lsInited.current) {
      lsInited.current = true;
      setLsTxs(lsLoadTransactions());
      setLsGoal(lsLoadGoal());
    }
  }, [authLoading, isAuthenticated]);

  // ── 3. Unified derived state ──────────────────────────────────────────────────
  const transactions: SavingTransaction[] = isAuthenticated
    ? (txData?.transactions ?? [])
    : lsTxs;

  const goal = isAuthenticated ? (goalData?.goal ?? DEFAULT_GOAL) : lsGoal;
  const balance = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  const availableBalance = Math.max(0, DEFAULT_AVAILABLE - balance);

  const state: SavingsState = { balance, availableBalance, goal, transactions };

  // ── 4a. API mutations ─────────────────────────────────────────────────────────
  const addSavingApiMutation = useMutation({
    mutationFn: ({ amount, note }: { amount: number; note?: string }) =>
      apiPost<SavingTransaction>("/api/savings/transactions", { amount, note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savings-transactions"] });
    },
  });

  const setGoalApiMutation = useMutation({
    mutationFn: (newGoal: number) =>
      apiPut<{ goal: number }>("/api/savings/goal", { goal: newGoal }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savings-goal"] });
    },
  });

  // ── 4b. localStorage mutations ────────────────────────────────────────────────
  const addSavingLocal = useCallback((amount: number, note?: string) => {
    const newTx: SavingTransaction = {
      id: `ls-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      amount,
      note,
      date: new Date().toISOString(),
    };
    setLsTxs(prev => {
      const next = [newTx, ...prev];
      lsSaveTransactions(next);
      return next;
    });
  }, []);

  const setGoalLocal = useCallback((newGoal: number) => {
    setLsGoal(newGoal);
    lsSaveGoal(newGoal);
  }, []);

  // ── 5. Unified API ────────────────────────────────────────────────────────────
  const addSaving = useCallback(
    (amount: number, note?: string) => {
      if (isAuthenticated) addSavingApiMutation.mutate({ amount, note });
      else addSavingLocal(amount, note);
    },
    [isAuthenticated, addSavingApiMutation, addSavingLocal],
  );

  const setGoal = useCallback(
    (newGoal: number) => {
      if (isAuthenticated) setGoalApiMutation.mutate(newGoal);
      else setGoalLocal(newGoal);
    },
    [isAuthenticated, setGoalApiMutation, setGoalLocal],
  );

  const reset = useCallback(async () => {
    if (isAuthenticated) {
      await Promise.all([
        apiDelete("/api/savings/transactions"),
        apiPut("/api/savings/goal", { goal: DEFAULT_GOAL }),
      ]);
      queryClient.invalidateQueries({ queryKey: ["savings-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["savings-goal"] });
    } else {
      setLsTxs([]);
      setLsGoal(DEFAULT_GOAL);
      lsSaveTransactions([]);
      lsSaveGoal(DEFAULT_GOAL);
    }
  }, [isAuthenticated, queryClient]);

  // ── 6. Monthly report & insights ─────────────────────────────────────────────
  const getMonthlyReport = useCallback((): MonthlyReport => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthTxs   = transactions.filter(tx => tx.date >= monthStart);
    const totalSaved = monthTxs.reduce((s, tx) => s + tx.amount, 0);
    const totalIncome = availableBalance + totalSaved;
    const goalProgress = goal > 0 ? Math.min(100, Math.round((balance / goal) * 100)) : 0;
    return {
      totalIncome,
      totalSaved,
      savingPercent: totalIncome > 0 ? Math.round((totalSaved / totalIncome) * 100) : 0,
      actionCount: monthTxs.length,
      remainingBalance: availableBalance,
      goalProgress,
    };
  }, [transactions, availableBalance, goal, balance]);

  const getInsights = useCallback((): Insight[] => {
    const report = getMonthlyReport();
    const insights: Insight[] = [];

    if (report.actionCount >= 3) {
      insights.push({
        id: "habit", icon: "star",
        text: `أنت تدخر بانتظام — ${report.actionCount} عملية توفير هذا الشهر. استمر!`,
      });
    }

    if (goal > 0 && balance > 0) {
      const remaining = goal - balance;
      if (remaining > 0 && report.totalSaved > 0) {
        const monthsLeft = Math.ceil(remaining / report.totalSaved);
        insights.push({
          id: "projection", icon: "target",
          text: `إذا واصلت نفس الوتيرة، ستصل إلى هدفك خلال ${monthsLeft} ${monthsLeft === 1 ? "شهر" : "أشهر"}.`,
        });
      }
    }

    if (report.savingPercent > 0) {
      insights.push({
        id: "rate", icon: "trending-up",
        text: `نسبة ادخارك هذا الشهر ${report.savingPercent}% — ${report.savingPercent >= 20 ? "ممتاز! أنت تدخر أكثر من المعدل العام." : "حاول الوصول لـ 20% لنتائج أفضل."}`,
      });
    }

    if (insights.length === 0) {
      insights.push({
        id: "start", icon: "star",
        text: "ابدأ بإضافة مبلغ صغير إلى محفظتك الآن — كل ريال يُحدث فرقًا!",
      });
    }

    return insights;
  }, [goal, balance, getMonthlyReport]);

  // isLoading: wait for auth check first, then wait for data if authed
  const isLoading = authLoading || (isAuthenticated && (!txData || !goalData));

  return {
    state,
    addSaving,
    setGoal,
    reset,
    getMonthlyReport,
    getInsights,
    level: walletLevel(state.balance, state.goal),
    progressPct: state.goal > 0
      ? Math.min(100, Math.round((state.balance / state.goal) * 100))
      : 0,
    isLoading,
    isAuthenticated,
  };
}
