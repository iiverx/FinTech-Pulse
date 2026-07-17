import React, { useState, useEffect } from "react";
import { Logo } from "@/components/Logo";
import { PulseGauge } from "@/components/PulseGauge";
import { HeartbeatLine } from "@/components/HeartbeatLine";
import { HeroScene } from "@/components/HeroScene";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import {
  Home, Activity, Wallet, Bell, Brain, Users, Settings,
  TrendingUp, DollarSign, PiggyBank, CheckCircle2, AlertTriangle,
  Sparkles, Send, Zap, Target, CircleDollarSign, LogOut, User,
  ChevronLeft, ShoppingCart, CreditCard, Calculator, Shield,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// ── Static data (outside component — never recreated on re-render) ────────────
const forecastData = [
  { day: "اليوم", score: 78 },
  { day: "غدًا",  score: 77 },
  { day: "بعد يومين", score: 75 },
  { day: "3 أيام", score: 74 },
  { day: "4 أيام", score: 72 },
  { day: "5 أيام", score: 72 },
  { day: "6 أيام", score: 73 },
];

const alerts = [
  { title: "ارتفاع في الإنفاق",  desc: "إنفاقك على المطاعم ارتفع 22% هذا الشهر",       color: "red"   },
  { title: "فرصة توفير",         desc: "يمكنك توفير 200 ريال إضافي هذا الشهر",          color: "green" },
  { title: "اقتراب دفعة",        desc: "لديك دفعة بطاقة ائتمانية بعد 3 أيام",           color: "blue"  },
  { title: "تنبيه مؤشر",         desc: "قد ينخفض مؤشرك إلى 72 خلال 5 أيام",            color: "amber" },
];

const factors = [
  { label: "نسبة الإنفاق/الدخل",  value: 85, color: "green", status: "ممتاز"  },
  { label: "الالتزام بالميزانية", value: 78, color: "blue",  status: "جيد"    },
  { label: "نمو المدخرات",        value: 92, color: "teal",  status: "ممتاز"  },
  { label: "السلوك الشرائي",      value: 68, color: "amber", status: "متوسط"  },
  { label: "انتظام السداد",       value: 95, color: "green", status: "ممتاز"  },
];

// ── Section components ────────────────────────────────────────────────────────

function SectionHome({ userName }: { userName: string }) {
  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-l from-primary/10 to-secondary/10 border border-primary/20 rounded-2xl px-6 py-4">
        <h1 className="text-2xl font-black text-slate-900" style={{ fontFamily: "Cairo, sans-serif" }}>
          مرحبًا، {userName} 👋
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">
          آخر تحديث: اليوم، {new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>

      {/* 3D Hero Scene */}
      <div className="rounded-3xl overflow-hidden shadow-lg border border-slate-200" style={{ height: 420 }}>
        <HeroScene />
      </div>

      {/* Top Row: Pulse Gauge + Financial Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pulse Gauge Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col items-center">
          <div className="flex items-center justify-between w-full mb-3">
            <h3 className="font-bold text-slate-800" style={{ fontFamily: "Cairo, sans-serif" }}>مؤشر النبض المالي</h3>
            <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-semibold">مستقر ماليًا</span>
          </div>
          <PulseGauge value={78} size={150} />
          <div className="w-full mt-3">
            <HeartbeatLine color="#1D4ED8" />
          </div>
          <p className="text-xs text-slate-400 text-center mt-1" style={{ fontFamily: "Tajawal, sans-serif" }}>
            تم تحديث المؤشر اليوم بناءً على آخر معاملاتك
          </p>
        </div>

        {/* Financial Summary */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-4" style={{ fontFamily: "Cairo, sans-serif" }}>ملخص مالي سريع</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: "الدخل الشهري",       value: "7,500", unit: "ر.س",    color: "#16A34A", icon: TrendingUp   },
              { label: "الإنفاق الحالي",      value: "3,920", unit: "ر.س",    color: "#F59E0B", icon: ShoppingCart },
              { label: "الالتزامات القادمة",  value: "1,200", unit: "ر.س",    color: "#DC2626", icon: CreditCard   },
              { label: "نسبة الادخار",        value: "18",    unit: "%",       color: "#1D4ED8", icon: PiggyBank    },
              { label: "المبلغ الآمن اليومي", value: "64",    unit: "ر.س",    color: "#7C3AED", icon: Calculator   },
              { label: "حالة الميزانية",      value: "آمن",   unit: "✓",       color: "#16A34A", icon: CheckCircle2 },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl p-3.5" style={{ background: item.color + "12" }}>
                <div className="flex items-center gap-1.5 mb-2">
                  <item.icon size={13} style={{ color: item.color }} />
                  <span className="text-xs text-slate-500" style={{ fontFamily: "Tajawal, sans-serif" }}>{item.label}</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black" style={{ color: item.color, fontFamily: "Cairo, sans-serif" }}>{item.value}</span>
                  <span className="text-xs font-semibold" style={{ color: item.color }}>{item.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row: Savings Goal + Community */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Savings goal */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2" style={{ fontFamily: "Cairo, sans-serif" }}>
            <PiggyBank size={18} className="text-green-500" /> هدفك هذا الشهر
          </h3>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-black text-green-600" style={{ fontFamily: "Cairo, sans-serif" }}>310</span>
            <span className="text-slate-400 text-sm">/ 500 ر.س</span>
          </div>
          <p className="text-xs text-slate-400 mb-3" style={{ fontFamily: "Tajawal, sans-serif" }}>ادخار 500 ريال هذا الشهر</p>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-2">
            <div className="h-full rounded-full" style={{ width: "62%", background: "linear-gradient(90deg,#1D4ED8,#16A34A)" }} />
          </div>
          <div className="flex justify-between text-xs text-slate-400">
            <span>62% مكتمل</span>
            <span>باقي 190 ر.س</span>
          </div>
        </div>

        {/* Community compare */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2" style={{ fontFamily: "Cairo, sans-serif" }}>
            <Users size={18} className="text-blue-500" /> مجتمع نبض
          </h3>
          <div className="flex flex-col gap-3 mb-4">
            {[
              { label: "مؤشر نبضك",                value: 78, color: "#1D4ED8", highlight: true  },
              { label: "متوسط الأشخاص المشابهين", value: 71, color: "#94A3B8", highlight: false },
              { label: "أعلى 10%",                 value: 88, color: "#16A34A", highlight: false },
            ].map((item) => (
              <div key={item.label} className={`rounded-2xl px-4 py-3 flex items-center gap-3 ${item.highlight ? "bg-blue-50 border border-blue-200" : "bg-slate-50"}`}>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-slate-700" style={{ fontFamily: "Tajawal, sans-serif" }}>{item.label}</span>
                    <span className="text-sm font-black" style={{ color: item.color, fontFamily: "Cairo, sans-serif" }}>{item.value}</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${item.value}%`, background: item.color }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-green-50 rounded-2xl p-3 flex items-center gap-2">
            <Shield size={14} className="text-green-600 shrink-0" />
            <p className="text-xs text-green-700" style={{ fontFamily: "Tajawal, sans-serif" }}>لا تتم مشاركة أي بيانات شخصية.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionPulse() {
  return (
    <div className="space-y-6">
      {/* Big gauge */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-white text-sm font-semibold mb-6"
          style={{ background: "linear-gradient(135deg,#1D4ED8,#16A34A)", fontFamily: "Tajawal, sans-serif" }}>
          <Activity className="w-4 h-4" /> مؤشر النبض المالي
        </div>
        <div className="flex justify-center mb-4">
          <PulseGauge value={78} size={220} label="مستقر ماليًا" />
        </div>
        <div className="max-w-xs mx-auto mb-2">
          <HeartbeatLine color="#1D4ED8" />
        </div>
        <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto mt-6">
          {[
            { label: "هذا الأسبوع",   value: "+3", color: "#16A34A" },
            { label: "هذا الشهر",      value: "+8", color: "#16A34A" },
            { label: "توقع 7 أيام",   value: "−8", color: "#DC2626" },
          ].map((s) => (
            <div key={s.label} className="bg-slate-50 rounded-2xl p-3 text-center">
              <div className="text-xl font-black mb-1" style={{ color: s.color, fontFamily: "Cairo, sans-serif" }}>{s.value}</div>
              <div className="text-xs text-slate-400" style={{ fontFamily: "Tajawal, sans-serif" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Forecast chart */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3" style={{ fontFamily: "Cairo, sans-serif" }}>
          <Sparkles className="w-5 h-5 text-primary" />
          توقع النبض — الأيام القادمة
        </h2>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={forecastData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="day" stroke="#64748b" style={{ fontSize: "12px" }} />
            <YAxis domain={[60, 85]} stroke="#64748b" style={{ fontSize: "12px" }} />
            <Tooltip contentStyle={{ backgroundColor: "white", border: "2px solid #1D4ED8", borderRadius: "12px", direction: "rtl" }} />
            <Line type="monotone" dataKey="score" stroke="#1D4ED8" strokeWidth={3} dot={{ fill: "#1D4ED8", r: 5 }} activeDot={{ r: 7 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Factors */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3" style={{ fontFamily: "Cairo, sans-serif" }}>
          <Target className="w-5 h-5 text-primary" />
          تحليل العوامل
        </h2>
        <div className="space-y-4">
          {factors.map((f, idx) => (
            <div key={idx}>
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-slate-700">{f.label}</span>
                <span className={`text-sm font-bold text-${f.color}-600`}>{f.status}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div className={`bg-gradient-to-l from-${f.color}-500 to-${f.color}-600 h-2.5 rounded-full`} style={{ width: `${f.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionAlerts() {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
      <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
        <Bell className="w-6 h-6 text-primary" />
        التنبيهات الذكية
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {alerts.map((a, idx) => (
          <div key={idx} className={`bg-${a.color}-50 border-2 border-${a.color}-200 rounded-xl p-4 flex items-start gap-3`}>
            <Bell className={`w-5 h-5 text-${a.color}-600 flex-shrink-0 mt-0.5`} />
            <div>
              <h4 className={`font-bold text-${a.color}-900 mb-1`}>{a.title}</h4>
              <p className={`text-sm text-${a.color}-700`}>{a.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionSimulation() {
  const [amount, setAmount] = useState("");
  const score = amount ? Math.max(60, 78 - Math.round(Number(amount) / 50)) : null;
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
      <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
        <Zap className="w-6 h-6 text-primary" />
        محاكاة القرارات
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">أدخل قيمة الشراء المحتمل</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="350"
            className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-primary focus:outline-none text-lg font-semibold"
          />
          <button
            onClick={() => {}}
            className="w-full mt-3 py-3 bg-gradient-to-l from-primary to-secondary text-white rounded-lg font-bold hover:shadow-lg transition-all"
          >
            احسب التأثير
          </button>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-300 rounded-xl p-6">
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-amber-900 mb-2">النتيجة المتوقعة</h4>
              {score !== null ? (
                <p className="text-sm text-amber-800 mb-3">
                  سينخفض مؤشرك من <span className="font-bold">78</span> إلى <span className="font-bold">{score}</span>
                </p>
              ) : (
                <p className="text-sm text-amber-800 mb-3">أدخل مبلغاً لرؤية التأثير على مؤشرك</p>
              )}
            </div>
          </div>
          <div className="bg-amber-200 rounded-lg p-3">
            <p className="text-sm text-amber-900 font-semibold">
              {score !== null && score < 72 ? "التوصية: يُفضّل تأجيل هذا الشراء" : "التوصية: الشراء ضمن النطاق الآمن"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionAssistant() {
  const [messages, setMessages] = useState([
    { from: "user", text: "كيف يمكنني تحسين مؤشر نبضي؟" },
    { from: "bot",  text: "يمكنك تحسين مؤشرك بتقليل الإنفاق على المطاعم بنسبة 20% وزيادة الادخار الشهري. هذا سيرفع مؤشرك إلى 84 خلال شهرين." },
  ]);
  const [input, setInput] = useState("");

  const send = () => {
    if (!input.trim()) return;
    setMessages(m => [...m, { from: "user", text: input }, { from: "bot", text: "شكراً على سؤالك! سأحلل وضعك المالي وأعود إليك بتوصية مفصّلة قريباً." }]);
    setInput("");
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
      <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
        <Brain className="w-6 h-6 text-primary" />
        المساعد المالي الذكي
      </h2>
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 h-72 overflow-y-auto mb-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`rounded-2xl px-5 py-3 max-w-md text-sm ${
              m.from === "user"
                ? "bg-gradient-to-l from-primary to-secondary text-white rounded-bl-sm"
                : "bg-white border-2 border-slate-300 text-slate-800 rounded-br-sm"
            }`}>
              {m.text}
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="اكتب سؤالك المالي هنا..."
          className="flex-1 px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-primary focus:outline-none"
        />
        <button onClick={send} className="px-6 py-3 bg-gradient-to-l from-primary to-secondary text-white rounded-lg font-semibold hover:shadow-lg transition-all">
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

function SectionCommunity() {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
      <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
        <Users className="w-6 h-6 text-primary" />
        مجتمع نبض
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
          <p className="text-sm text-slate-600 mb-2">مؤشرك</p>
          <p className="text-5xl font-black text-primary mb-2">78</p>
          <p className="text-sm font-semibold text-slate-700">مستقر ماليًا</p>
        </div>
        <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-6">
          <p className="text-sm text-slate-600 mb-2">متوسط المستخدمين</p>
          <p className="text-5xl font-black text-slate-500 mb-2">71</p>
          <p className="text-sm font-semibold text-slate-700">أنت أفضل من المتوسط</p>
        </div>
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
          <p className="text-sm text-slate-600 mb-2">أعلى 10%</p>
          <p className="text-5xl font-black text-secondary mb-2">88</p>
          <p className="text-sm font-semibold text-slate-700">ممتاز ماليًا</p>
        </div>
      </div>
      <div className="mt-6 bg-gradient-to-l from-primary/10 to-secondary/10 border border-primary/20 rounded-xl p-5">
        <p className="text-center text-slate-700 font-semibold">
          🏆 أنت ضمن أفضل <span className="text-primary font-black">35%</span> من مستخدمي نبض هذا الشهر
        </p>
      </div>
    </div>
  );
}

function SectionSettings({ userName, userEmail }: { userName: string; userEmail: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
      <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
        <Settings className="w-6 h-6 text-primary" />
        الإعدادات
      </h2>
      <div className="space-y-4 max-w-lg">
        <div>
          <label className="block text-sm font-semibold text-slate-600 mb-1">الاسم</label>
          <input
            defaultValue={userName}
            className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-600 mb-1">البريد الإلكتروني</label>
          <input
            defaultValue={userEmail}
            className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-primary focus:outline-none bg-slate-50"
            readOnly
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-600 mb-1">الدخل الشهري (ريال)</label>
          <input
            type="number"
            defaultValue={7500}
            className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-primary focus:outline-none"
          />
        </div>
        <button className="mt-2 px-8 py-3 bg-gradient-to-l from-primary to-secondary text-white rounded-lg font-bold hover:shadow-lg transition-all">
          حفظ التغييرات
        </button>
      </div>
    </div>
  );
}

// ── Nav config ────────────────────────────────────────────────────────────────
type SectionKey = "home" | "pulse" | "alerts" | "simulation" | "assistant" | "community" | "settings";

const NAV_ITEMS: { key: SectionKey | "wallet" | "calculator"; icon: React.ElementType; label: string; href?: string }[] = [
  { key: "home",        icon: Home,             label: "الرئيسية"       },
  { key: "pulse",       icon: Activity,         label: "مؤشر النبض"     },
  { key: "wallet",      icon: Wallet,           label: "المحفظة الذكية", href: "/savings"    },
  { key: "alerts",      icon: Bell,             label: "التنبيهات"      },
  { key: "simulation",  icon: Zap,              label: "المحاكاة"       },
  { key: "calculator",  icon: CircleDollarSign, label: "الحاسبة الذكية", href: "/calculator" },
  { key: "assistant",   icon: Brain,            label: "المساعد الذكي"  },
  { key: "community",   icon: Users,            label: "مجتمع نبض"      },
  { key: "settings",    icon: Settings,         label: "الإعدادات"      },
];


// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user, logout } = useAuth();
  const userName = user?.name ?? "زائر";
  const userEmail = user?.email ?? "";

  // Read ?section= from URL to support deep-linking from other pages
  const [active, setActive] = useState<SectionKey>(() => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get("section") as SectionKey | null;
    return s && s in { home:1, pulse:1, alerts:1, simulation:1, assistant:1, community:1, settings:1 }
      ? s
      : "home";
  });

  // Keep section in sync if user navigates with browser back/forward
  useEffect(() => {
    const handler = () => {
      const params = new URLSearchParams(window.location.search);
      const s = params.get("section") as SectionKey | null;
      if (s && s in { home:1, pulse:1, alerts:1, simulation:1, assistant:1, community:1, settings:1 }) {
        setActive(s);
      }
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  const sections: Record<SectionKey, React.ReactNode> = {
    home:       <SectionHome userName={userName} />,
    pulse:      <SectionPulse />,
    alerts:     <SectionAlerts />,
    simulation: <SectionSimulation />,
    assistant:  <SectionAssistant />,
    community:  <SectionCommunity />,
    settings:   <SectionSettings userName={userName} userEmail={userEmail} />,
  };

  return (
    <div className="min-h-screen bg-slate-50 flex" dir="rtl">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-l border-slate-200 flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-200">
          <Logo imageClassName="h-10" showText={true} />
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) =>
            item.href ? (
              <Link
                key={item.key}
                href={item.href}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all text-slate-600 hover:bg-slate-100"
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span>{item.label}</span>
                <ChevronLeft className="w-4 h-4 mr-auto opacity-40" />
              </Link>
            ) : (
              <button
                key={item.key}
                onClick={() => { setActive(item.key as SectionKey); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all ${
                  active === item.key
                    ? "bg-gradient-to-l from-primary to-secondary text-white shadow-lg"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span>{item.label}</span>
              </button>
            )
          )}
        </nav>

        <div className="p-4 border-t border-slate-200 space-y-1">
          {user && (
            <div className="px-2 pb-2 border-b border-slate-100 mb-2">
              <p className="text-sm font-semibold text-slate-800 truncate">{user.name}</p>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>
          )}
          <button
            onClick={() => logout()}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-red-500 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-6">
          {sections[active]}
        </div>
      </main>
    </div>
  );
}
