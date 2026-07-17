import React, { useState } from "react";
import { Logo } from "@/components/Logo";
import { CircularIndicator } from "@/components/CircularIndicator";
import { Link } from "wouter";
import {
  Home, Activity, Wallet, Bell, Brain, Users, Settings,
  TrendingUp, DollarSign, PiggyBank, CheckCircle2, AlertTriangle,
  Sparkles, Send, Zap, Target, CircleDollarSign, LogOut, User,
  ChevronLeft,
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

function SectionHome() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1 text-center md:text-right">
            <h1 className="text-3xl font-black text-slate-900 mb-2">مرحبًا، أحمد</h1>
            <p className="text-slate-600">آخر تحديث: اليوم، 3:45 م</p>
          </div>
          <CircularIndicator value={78} size={160} strokeWidth={14} label="مستقر ماليًا" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "الدخل الشهري", value: "7,500", unit: "ريال",       icon: TrendingUp,   color: "green" },
          { label: "الإنفاق",      value: "3,920", unit: "ريال",       icon: DollarSign,   color: "blue"  },
          { label: "الالتزامات",   value: "1,200", unit: "ريال",       icon: AlertTriangle,color: "amber" },
          { label: "الادخار",      value: "18%",   unit: "من الدخل",   icon: PiggyBank,    color: "teal"  },
          { label: "الحالة",       value: "ضمن النطاق", unit: "",      icon: CheckCircle2, color: "green" },
        ].map((card, idx) => (
          <div key={idx} className={`bg-${card.color}-50 border-2 border-${card.color}-200 rounded-xl p-5`}>
            <div className="flex items-center justify-between mb-3">
              <card.icon className={`w-6 h-6 text-${card.color}-600`} />
            </div>
            <p className="text-sm text-slate-600 mb-1">{card.label}</p>
            <p className={`text-2xl font-black text-${card.color}-700`}>{card.value}</p>
            {card.unit && <p className="text-xs text-slate-500 mt-1">{card.unit}</p>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-green-900">المبلغ الآمن للإنفاق اليوم</h3>
          </div>
          <p className="text-5xl font-black text-green-600 mb-2">64 <span className="text-2xl">ريال</span></p>
          <p className="text-sm text-green-700">بناءً على ميزانيتك والتزاماتك القادمة</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-blue-900">هدف: ادخار 500 ريال</h3>
            <span className="text-2xl font-black text-blue-600">62%</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-4 mb-3">
            <div className="bg-gradient-to-l from-blue-600 to-green-500 h-4 rounded-full" style={{ width: "62%" }} />
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-blue-700">تم توفير: 310 ريال</span>
            <span className="text-blue-700">باقي: 190 ريال</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionPulse() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-primary" />
          توقع مؤشر النبض — الأيام القادمة
        </h2>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={forecastData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="day" stroke="#64748b" style={{ fontSize: "12px" }} />
            <YAxis domain={[60, 85]} stroke="#64748b" style={{ fontSize: "12px" }} />
            <Tooltip contentStyle={{ backgroundColor: "white", border: "2px solid #1D4ED8", borderRadius: "8px", direction: "rtl" }} />
            <Line type="monotone" dataKey="score" stroke="#1D4ED8" strokeWidth={3} dot={{ fill: "#1D4ED8", r: 5 }} activeDot={{ r: 7 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
          <Target className="w-6 h-6 text-primary" />
          تحليل العوامل
        </h2>
        <div className="space-y-4">
          {factors.map((f, idx) => (
            <div key={idx}>
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-slate-700">{f.label}</span>
                <span className={`text-sm font-bold text-${f.color}-600`}>{f.status}</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3">
                <div className={`bg-gradient-to-l from-${f.color}-500 to-${f.color}-600 h-3 rounded-full`} style={{ width: `${f.value}%` }} />
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

function SectionSettings() {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
      <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
        <Settings className="w-6 h-6 text-primary" />
        الإعدادات
      </h2>
      <div className="space-y-4 max-w-lg">
        {[
          { label: "الاسم", value: "أحمد محمد" },
          { label: "البريد الإلكتروني", value: "ahmed@example.com" },
          { label: "الدخل الشهري", value: "7,500 ريال" },
        ].map((f, i) => (
          <div key={i}>
            <label className="block text-sm font-semibold text-slate-600 mb-1">{f.label}</label>
            <input
              defaultValue={f.value}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-primary focus:outline-none"
            />
          </div>
        ))}
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

const SECTIONS: Record<SectionKey, React.ReactNode> = {
  home:       <SectionHome />,
  pulse:      <SectionPulse />,
  alerts:     <SectionAlerts />,
  simulation: <SectionSimulation />,
  assistant:  <SectionAssistant />,
  community:  <SectionCommunity />,
  settings:   <SectionSettings />,
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [active, setActive] = useState<SectionKey>("home");

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
                onClick={() => setActive(item.key as SectionKey)}
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

        <div className="p-4 border-t border-slate-200">
          <Link href="/" className="flex items-center gap-2 text-sm text-slate-500 hover:text-red-500 transition-colors">
            <LogOut className="w-4 h-4" />
            تسجيل الخروج
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-6">
          {SECTIONS[active]}
        </div>
      </main>
    </div>
  );
}
