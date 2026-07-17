import React, { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { Logo } from "@/components/Logo";
import { WalletGraphic } from "@/components/WalletGraphic";
import { CoinAnimation } from "@/components/CoinAnimation";
import { useSavingsWallet } from "@/hooks/useSavingsWallet";
import {
  loadReminderPrefs, saveReminderPrefs, checkAndRecordVisit,
  requestNotificationPermission, fireReminderNotification,
  checkReminderShouldFire,
  registerServiceWorker, scheduleServiceWorkerReminder, pingServiceWorkerCheck,
  type ReminderPrefs,
} from "@/hooks/useSavingsWallet";
import {
  Home, Activity, Wallet, Bell, Brain, Users, Settings,
  TrendingUp, Target, Zap, Plus, X, Star, Trophy,
  Sparkles, PiggyBank, ArrowDown, Clock, Calendar, CircleDollarSign,
} from "lucide-react";

const DAY_NAMES = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

// ── Sample income transactions ────────────────────────────────────────────────
const SAMPLE_TRANSACTIONS = [
  { id: "t1", label: "راتب شهر يونيو",       amount: 7500, date: "2026-06-01", icon: "💼" },
  { id: "t2", label: "عمولة مبيعات",         amount: 1200, date: "2026-06-10", icon: "📈" },
  { id: "t3", label: "مكافأة أداء",           amount: 800,  date: "2026-06-15", icon: "⭐" },
  { id: "t4", label: "دخل إضافي",            amount: 500,  date: "2026-06-20", icon: "💰" },
];

const LEVEL_LABELS: Record<1 | 2 | 3 | 4, string> = {
  1: "محفظة مبتدئة",
  2: "محفظة نشطة",
  3: "محفظة ذهبية",
  4: "محفظة فاخرة ✨",
};

const LEVEL_COLORS: Record<1 | 2 | 3 | 4, string> = {
  1: "from-amber-700 to-amber-900",
  2: "from-amber-600 to-yellow-700",
  3: "from-yellow-500 to-amber-600",
  4: "from-yellow-400 to-amber-500",
};

// ── Icon mapper for insights ──────────────────────────────────────────────────
function InsightIcon({ type }: { type: string }) {
  if (type === "trending-up") return <TrendingUp className="w-5 h-5 text-secondary" />;
  if (type === "target")      return <Target className="w-5 h-5 text-primary" />;
  return <Star className="w-5 h-5 text-yellow-500" />;
}

// ── Animated number ───────────────────────────────────────────────────────────
function AnimatedNumber({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    if (prev.current === value) return;
    const start = prev.current;
    const end   = value;
    const diff  = end - start;
    const dur   = 600;
    const t0    = performance.now();

    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(start + diff * eased));
      if (p < 1) requestAnimationFrame(step);
      else { prev.current = end; }
    };
    requestAnimationFrame(step);
  }, [value]);

  const fmt = new Intl.NumberFormat("ar-SA", { maximumFractionDigits: 0 }).format(display);
  return <>{prefix}{fmt}{suffix}</>;
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SavingsPage() {
  const { state, addSaving, setGoal, getMonthlyReport, getInsights, level, progressPct, reset } = useSavingsWallet();
  const [showModal,  setShowModal]  = useState(false);
  const [modalTx,    setModalTx]    = useState<typeof SAMPLE_TRANSACTIONS[0] | null>(null);
  const [inputAmt,   setInputAmt]   = useState("");
  const [animActive, setAnimActive] = useState(false);
  const [animAmt,    setAnimAmt]    = useState(0);
  const [showGoal,   setShowGoal]   = useState(false);
  const [goalInput,  setGoalInput]  = useState(String(state.goal));
  const [showCelebration, setShowCelebration] = useState(false);
  const walletRef = useRef<HTMLDivElement>(null!);

  const report   = getMonthlyReport();
  const insights = getInsights();

  // ── Reminder prefs state ──────────────────────────────────────────────
  const [reminderPrefs, setReminderPrefsState] = useState<ReminderPrefs>(loadReminderPrefs);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(
    () => (typeof window !== "undefined" && "Notification" in window ? Notification.permission : "denied")
  );
  const [showReminderSaved, setShowReminderSaved] = useState(false);

  // ── End-of-month banner ───────────────────────────────────────────────
  const [prevMonthBanner, setPrevMonthBanner] = useState<string | null>(null);

  useEffect(() => {
    const missed = checkAndRecordVisit();
    if (missed) setPrevMonthBanner(missed);
    // Register the Service Worker once on page load
    registerServiceWorker();
  }, []);

  // ── Reminder scheduler (every minute while tab is open) ──────────────
  // Primary path: delegate to Service Worker (works even when tab is closed).
  // Fallback path: in-session Notification API (when SW is unavailable).
  useEffect(() => {
    const run = async () => {
      // SW heartbeat — lets the SW fire the notification using stored prefs
      await pingServiceWorkerCheck();
      // Fallback: fire directly if SW check didn't handle it (e.g. SW not active)
      if (checkReminderShouldFire(reminderPrefs)) {
        fireReminderNotification("وقت مراجعة مدخراتك! افتح محفظتك وأضف توفيرًا جديدًا 🪙");
      }
    };
    run(); // immediate check on mount or prefs change
    const id = setInterval(run, 60_000); // then every minute
    return () => clearInterval(id);
  }, [reminderPrefs]);

  const handleSaveReminder = (prefs: ReminderPrefs) => {
    saveReminderPrefs(prefs);
    setReminderPrefsState(prefs);
    setShowReminderSaved(true);
    setTimeout(() => setShowReminderSaved(false), 3000);
    // Schedule via Service Worker (includes balance + goal progress in notification)
    scheduleServiceWorkerReminder(prefs, state.balance, state.goal);
  };

  const handleRequestNotif = async () => {
    const perm = await requestNotificationPermission();
    setNotifPermission(perm);
  };

  // ── Detect goal completion ────────────────────────────────────────────
  const prevPct = useRef(progressPct);
  useEffect(() => {
    if (prevPct.current < 100 && progressPct >= 100) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 5000);
    }
    prevPct.current = progressPct;
  }, [progressPct]);

  const openModal = (tx: typeof SAMPLE_TRANSACTIONS[0]) => {
    setModalTx(tx);
    setInputAmt(String(tx.amount));
    setShowModal(true);
  };

  const confirmAdd = () => {
    const amt = parseFloat(inputAmt);
    if (!amt || amt <= 0) return;
    addSaving(amt, modalTx?.label);
    setShowModal(false);
    setAnimAmt(amt);
    setAnimActive(true);
  };

  const confirmGoal = () => {
    const g = parseFloat(goalInput);
    if (g > 0) setGoal(g);
    setShowGoal(false);
  };

  const fmt = (n: number) => new Intl.NumberFormat("ar-SA", { maximumFractionDigits: 0 }).format(n);

  return (
    <div className="min-h-screen bg-slate-50 flex" dir="rtl">
      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className="w-72 bg-white border-l border-slate-200 flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-200">
          <Logo imageClassName="h-10" />
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {[
            { icon: Home,     label: "الرئيسية",        href: "/dashboard",                    active: false },
            { icon: Activity, label: "مؤشر النبض",      href: "/dashboard?section=pulse",      active: false },
            { icon: Wallet,   label: "المحفظة الذكية",  href: "/savings",                      active: true  },
            { icon: Bell,     label: "التنبيهات",       href: "/dashboard?section=alerts",     active: false },
            { icon: Zap,      label: "المحاكاة",        href: "/dashboard?section=simulation", active: false },
            { icon: CircleDollarSign, label: "الحاسبة الذكية", href: "/calculator",            active: false },
            { icon: Brain,    label: "المساعد الذكي",   href: "/dashboard?section=assistant",  active: false },
            { icon: Users,    label: "مجتمع نبض",       href: "/dashboard?section=community",  active: false },
            { icon: Settings, label: "الإعدادات",       href: "/dashboard?section=settings",   active: false },
          ].map((item, idx) => (
            <Link
              key={idx}
              href={item.href}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all ${
                item.active
                  ? "bg-gradient-to-l from-primary to-secondary text-white shadow-lg"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-200 space-y-2">
          <button onClick={reset} className="text-xs text-slate-400 hover:text-red-500 transition-colors">
            إعادة ضبط المحفظة
          </button>
          <br />
          <Link href="/" className="text-sm text-slate-500 hover:text-primary transition-colors">
            تسجيل الخروج
          </Link>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6 space-y-6">

          {/* ── End-of-month banner ──────────────────────────────────── */}
          {prevMonthBanner && (
            <div className="bg-gradient-to-l from-indigo-600 to-primary text-white rounded-2xl p-5 shadow-xl flex items-start gap-4 relative">
              <button
                onClick={() => setPrevMonthBanner(null)}
                className="absolute top-3 left-3 text-white/60 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="text-3xl">📊</div>
              <div>
                <p className="font-black text-lg">شهر جديد — راجع مدخراتك!</p>
                <p className="text-white/80 text-sm mt-1">
                  انتهى شهر {prevMonthBanner}. شهر جديد، فرصة جديدة للادخار. راجع تقريرك الشهري وضع هدفك لهذا الشهر.
                </p>
                <button
                  onClick={() => { setPrevMonthBanner(null); document.getElementById("monthly-report")?.scrollIntoView({ behavior: "smooth" }); }}
                  className="mt-2 px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-bold transition-colors"
                >
                  عرض التقرير ↓
                </button>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-black text-slate-900">المحفظة الذكية</h1>
                <p className="text-slate-500 mt-1">وفّر اليوم، ابنِ مستقبلك غداً</p>
              </div>
              <div className={`px-4 py-2 rounded-full text-white font-bold bg-gradient-to-l ${LEVEL_COLORS[level]} shadow`}>
                {LEVEL_LABELS[level]}
              </div>
            </div>
          </div>

          {/* ── Wallet + Stats ─────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Animated wallet */}
            <div
              ref={walletRef}
              className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-xl overflow-hidden"
              style={{ minHeight: 320 }}
            >
              <WalletGraphic level={level} pulse className="w-full" style={{ height: 320 }} />
              <CoinAnimation
                active={animActive}
                amount={animAmt}
                onDone={() => setAnimActive(false)}
                containerRef={walletRef as React.RefObject<HTMLDivElement>}
              />

              {/* Level badge */}
              <div className="absolute top-4 right-4">
                <div className={`px-3 py-1 rounded-full text-white text-sm font-bold bg-gradient-to-l ${LEVEL_COLORS[level]} shadow`}>
                  المستوى {level}
                </div>
              </div>

              {/* Balance overlay */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-5 text-white">
                <p className="text-sm opacity-75 mb-1">رصيد المحفظة</p>
                <p className="text-4xl font-black">
                  <AnimatedNumber value={state.balance} suffix=" ر.س" />
                </p>
              </div>

              {/* Celebration overlay */}
              {showCelebration && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
                  <div className="text-5xl mb-3">🏆</div>
                  <p className="text-white font-black text-xl text-center px-4">
                    مبروك! وصلت إلى هدف الادخار!
                  </p>
                  <div className="mt-3 flex gap-1">
                    {["✨","🎉","⭐","🎊","✨"].map((e, i) => (
                      <span key={i} className="text-2xl" style={{ animation: `bounce 0.5s ease ${i * 0.1}s infinite alternate` }}>{e}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Stats + Goal */}
            <div className="space-y-4">
              {/* Quick stats */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "الرصيد المتاح",   value: state.availableBalance, icon: "💳", color: "blue"  },
                  { label: "إجمالي الادخار",  value: state.balance,          icon: "🏦", color: "green" },
                  { label: "الهدف",           value: state.goal,             icon: "🎯", color: "amber" },
                  { label: "عدد التوفيرات",   value: state.transactions.length, icon: "📊", color: "purple", isCount: true },
                ].map((s, i) => (
                  <div key={i} className={`bg-${s.color}-50 border-2 border-${s.color}-200 rounded-xl p-4`}>
                    <span className="text-2xl">{s.icon}</span>
                    <p className={`text-xl font-black text-${s.color}-700 mt-1`}>
                      {s.isCount ? s.value : <AnimatedNumber value={s.value} suffix=" ر.س" />}
                    </p>
                    <p className="text-xs text-slate-500">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Progress bar */}
              <div className="bg-white rounded-2xl border-2 border-slate-200 p-5 shadow">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    هدف الادخار
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-primary">{progressPct}%</span>
                    <button
                      onClick={() => setShowGoal(true)}
                      className="text-xs text-slate-400 hover:text-primary border border-slate-200 rounded-lg px-2 py-1 transition-colors"
                    >
                      تعديل
                    </button>
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-5 overflow-hidden">
                  <div
                    className="h-5 rounded-full bg-gradient-to-l from-primary to-secondary transition-all duration-700 relative overflow-hidden"
                    style={{ width: `${progressPct}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse" />
                  </div>
                </div>
                <div className="flex justify-between text-sm text-slate-500 mt-2">
                  <span>تم توفير {fmt(state.balance)} ر.س</span>
                  <span>الهدف {fmt(state.goal)} ر.س</span>
                </div>
                {progressPct >= 100 && (
                  <div className="mt-3 bg-yellow-50 border border-yellow-300 rounded-lg p-2 text-center text-yellow-800 font-bold text-sm">
                    🏆 تهانينا! وصلت إلى هدفك!
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Income transactions ────────────────────────────────────── */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <ArrowDown className="w-5 h-5 text-secondary" />
              معاملات الدخل — أضف إلى محفظتك
            </h2>
            <div className="space-y-3">
              {SAMPLE_TRANSACTIONS.map(tx => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 hover:border-primary transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{tx.icon}</span>
                    <div>
                      <p className="font-semibold text-slate-800">{tx.label}</p>
                      <p className="text-xs text-slate-400">{new Date(tx.date).toLocaleDateString("ar-SA")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-black text-secondary text-lg">{fmt(tx.amount)} ر.س</span>
                    <button
                      onClick={() => openModal(tx)}
                      className="flex items-center gap-1 px-4 py-2 bg-gradient-to-l from-primary to-secondary text-white rounded-lg font-semibold text-sm hover:shadow-lg transition-all hover:scale-105"
                    >
                      <Plus className="w-4 h-4" />
                      أضف إلى محفظتي
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Monthly report ─────────────────────────────────────────── */}
          <div
            id="monthly-report"
            className="rounded-2xl p-6 shadow-xl border border-white/20"
            style={{
              background: "rgba(15,23,42,0.85)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
            }}
          >
            <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              التقرير الشهري
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: "إجمالي الدخل",    value: fmt(report.totalIncome) + " ر.س",  icon: "💼" },
                { label: "إجمالي الادخار",  value: fmt(report.totalSaved)  + " ر.س",  icon: "🏦" },
                { label: "نسبة الادخار",    value: report.savingPercent    + "%",       icon: "📊" },
                { label: "عدد العمليات",    value: String(report.actionCount),         icon: "🔢" },
                { label: "الرصيد المتبقي",  value: fmt(report.remainingBalance) + " ر.س", icon: "💳" },
                { label: "نسبة الهدف",      value: report.goalProgress     + "%",       icon: "🎯" },
              ].map((m, i) => (
                <div
                  key={i}
                  className="rounded-xl p-4 border border-white/10"
                  style={{ background: "rgba(255,255,255,0.07)" }}
                >
                  <span className="text-2xl">{m.icon}</span>
                  <p className="text-xl font-black text-white mt-1">{m.value}</p>
                  <p className="text-xs text-slate-400">{m.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Smart insights ─────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              رؤى ذكية
            </h2>
            <div className="space-y-3">
              {insights.map(ins => (
                <div
                  key={ins.id}
                  className="flex items-start gap-3 bg-gradient-to-l from-blue-50 to-green-50 border border-primary/20 rounded-xl p-4 hover:shadow-md transition-shadow"
                >
                  <div className="w-9 h-9 rounded-full bg-white shadow flex items-center justify-center shrink-0">
                    <InsightIcon type={ins.icon} />
                  </div>
                  <p className="text-slate-700 font-medium leading-relaxed">{ins.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Transaction history ────────────────────────────────────── */}
          {state.transactions.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <PiggyBank className="w-5 h-5 text-secondary" />
                سجل التوفيرات
              </h2>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {state.transactions.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                    <div>
                      <p className="font-semibold text-slate-700">{tx.note || "توفير"}</p>
                      <p className="text-xs text-slate-400">{new Date(tx.date).toLocaleString("ar-SA")}</p>
                    </div>
                    <span className="font-black text-secondary">+{fmt(tx.amount)} ر.س</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Reminder settings ──────────────────────────────────────── */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              تذكيرات الادخار
            </h2>
            <p className="text-slate-500 text-sm mb-5">احصل على تنبيه أسبوعي يذكّرك بالادخار في وقتك المفضل.</p>

            {/* Enable toggle */}
            <div className="flex items-center justify-between mb-5 bg-slate-50 rounded-xl p-4 border border-slate-200">
              <div>
                <p className="font-semibold text-slate-800">تفعيل التذكيرات</p>
                <p className="text-xs text-slate-500 mt-0.5">تذكير أسبوعي في اليوم والوقت المختار</p>
              </div>
              <button
                role="switch"
                aria-checked={reminderPrefs.enabled}
                onClick={() => handleSaveReminder({ ...reminderPrefs, enabled: !reminderPrefs.enabled })}
                className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${reminderPrefs.enabled ? "bg-primary" : "bg-slate-300"}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${reminderPrefs.enabled ? "right-0.5" : "left-0.5"}`} />
              </button>
            </div>

            {/* Day + Time pickers */}
            <div className={`grid grid-cols-2 gap-4 mb-5 transition-opacity ${reminderPrefs.enabled ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1">
                  <Calendar className="w-4 h-4" /> يوم التذكير
                </label>
                <select
                  value={reminderPrefs.dayOfWeek}
                  onChange={e => setReminderPrefsState(p => ({ ...p, dayOfWeek: Number(e.target.value) }))}
                  className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 font-semibold focus:border-primary focus:outline-none bg-white"
                >
                  {DAY_NAMES.map((name, i) => (
                    <option key={i} value={i}>{name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1">
                  <Clock className="w-4 h-4" /> وقت التذكير
                </label>
                <select
                  value={reminderPrefs.hour}
                  onChange={e => setReminderPrefsState(p => ({ ...p, hour: Number(e.target.value) }))}
                  className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 font-semibold focus:border-primary focus:outline-none bg-white"
                >
                  {Array.from({ length: 24 }, (_, h) => (
                    <option key={h} value={h}>
                      {String(h).padStart(2, "0")}:00
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Notification permission */}
            <div className="mb-5">
              {notifPermission === "granted" ? (
                <div className="flex items-center gap-2 text-secondary text-sm font-semibold bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                  <Bell className="w-4 h-4" />
                  إشعارات المتصفح مفعّلة ✓
                </div>
              ) : notifPermission === "denied" ? (
                <div className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                  ⚠️ الإشعارات محجوبة في المتصفح. يرجى السماح بها من إعدادات المتصفح لتلقي التنبيهات.
                </div>
              ) : (
                <button
                  onClick={handleRequestNotif}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-primary/30 text-primary rounded-xl font-semibold text-sm hover:bg-primary hover:text-white transition-all"
                >
                  <Bell className="w-4 h-4" />
                  السماح بإشعارات المتصفح
                </button>
              )}
            </div>

            {/* Save button */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleSaveReminder(reminderPrefs)}
                className="flex-1 py-3 bg-gradient-to-l from-primary to-secondary text-white rounded-xl font-bold hover:shadow-lg transition-all"
              >
                حفظ إعدادات التذكير
              </button>
              {showReminderSaved && (
                <div className="text-secondary font-bold text-sm flex items-center gap-1" style={{ animation: "fadeInUp 0.3s ease-out" }}>
                  ✓ تم الحفظ
                </div>
              )}
            </div>

            <p className="text-xs text-slate-400 mt-3 text-center">
              التذكير يُرسل كإشعار متصفح في اليوم والوقت المحدد — حتى عند إغلاق التبويب إن كان المتصفح يدعم الإشعارات في الخلفية.
            </p>
          </div>

        </div>
      </main>

      {/* ── Add to Wallet modal ─────────────────────────────────────────── */}
      {showModal && modalTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-10"
            style={{ animation: "fadeInUp 0.3s ease-out" }}
          >
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 left-4 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-3 shadow-lg">
                <Wallet className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-black text-slate-900">إضافة إلى المحفظة</h3>
              <p className="text-slate-500 text-sm mt-1">{modalTx.label}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  المبلغ الذي تريد توفيره (ر.س)
                </label>
                <input
                  type="number"
                  value={inputAmt}
                  onChange={e => setInputAmt(e.target.value)}
                  max={modalTx.amount}
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl text-2xl font-black text-center text-slate-900 focus:border-primary focus:outline-none transition-colors"
                  autoFocus
                />
                <p className="text-xs text-slate-400 mt-1 text-center">
                  الحد الأقصى: {fmt(modalTx.amount)} ر.س
                </p>
              </div>

              {/* Quick amounts */}
              <div className="flex gap-2 flex-wrap justify-center">
                {[100, 250, 500, modalTx.amount].map(q => (
                  <button
                    key={q}
                    onClick={() => setInputAmt(String(q))}
                    className="px-3 py-1.5 rounded-full border-2 border-primary/30 text-primary text-sm font-semibold hover:bg-primary hover:text-white transition-all"
                  >
                    {fmt(q)}
                  </button>
                ))}
              </div>

              <button
                onClick={confirmAdd}
                disabled={!inputAmt || parseFloat(inputAmt) <= 0}
                className="w-full py-4 bg-gradient-to-l from-primary to-secondary text-white rounded-xl font-black text-lg hover:shadow-xl transition-all disabled:opacity-40"
              >
                أضف {inputAmt ? fmt(parseFloat(inputAmt)) : "—"} ر.س إلى المحفظة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Set goal modal ──────────────────────────────────────────────── */}
      {showGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowGoal(false)} />
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 z-10"
            style={{ animation: "fadeInUp 0.3s ease-out" }}
          >
            <button onClick={() => setShowGoal(false)} className="absolute top-4 left-4 text-slate-400 hover:text-slate-700">
              <X className="w-5 h-5" />
            </button>
            <div className="text-center mb-5">
              <Trophy className="w-10 h-10 text-yellow-500 mx-auto mb-2" />
              <h3 className="text-xl font-black text-slate-900">حدد هدفك</h3>
            </div>
            <input
              type="number"
              value={goalInput}
              onChange={e => setGoalInput(e.target.value)}
              className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl text-2xl font-black text-center focus:border-primary focus:outline-none mb-4"
              autoFocus
            />
            <button
              onClick={confirmGoal}
              className="w-full py-3 bg-gradient-to-l from-primary to-secondary text-white rounded-xl font-bold hover:shadow-lg transition-all"
            >
              حفظ الهدف
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce {
          from { transform: translateY(0); }
          to   { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}
