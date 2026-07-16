import { Link } from "wouter";
import SmartCalculator from "@/components/SmartCalculator";
import {
  Home, Activity, Wallet, Bell, Zap,
  Brain, Users, Settings, CircleDollarSign,
} from "lucide-react";

const NAV_ITEMS = [
  { icon: Home,              label: "الرئيسية",        href: "/dashboard" },
  { icon: Activity,          label: "مؤشر النبض",      href: "/dashboard" },
  { icon: Wallet,            label: "المحفظة الذكية",  href: "/savings"   },
  { icon: Bell,              label: "التنبيهات",       href: "/dashboard" },
  { icon: Zap,               label: "المحاكاة",        href: "/dashboard" },
  { icon: CircleDollarSign,  label: "الحاسبة الذكية",  href: "/calculator", active: true },
  { icon: Brain,             label: "المساعد الذكي",   href: "/dashboard" },
  { icon: Users,             label: "مجتمع نبض",       href: "/dashboard" },
  { icon: Settings,          label: "الإعدادات",       href: "/dashboard" },
];

export default function CalculatorPage() {
  return (
    <div dir="rtl" className="flex h-screen bg-slate-50 font-['Cairo',sans-serif]">

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="w-64 bg-white border-l border-slate-200 flex flex-col shadow-lg shrink-0">
        <div className="p-5 border-b border-slate-200">
          <Link href="/" className="flex items-center gap-2">
            <img src="/nabdh-pulse/nabd-logo.svg" alt="نبض" className="h-8" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            <span className="text-xl font-black text-primary">نبض</span>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item, idx) => (
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
        <div className="p-4 border-t border-slate-200">
          <Link href="/" className="text-sm text-slate-500 hover:text-primary transition-colors">
            تسجيل الخروج
          </Link>
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-6 space-y-6">

          {/* Header */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-teal-600 flex items-center justify-center shadow">
                <CircleDollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900">الحاسبة المالية الذكية</h1>
                <p className="text-slate-500 text-sm mt-0.5">
                  اكتب وضعك المالي بالعربي وستحسب لك المبلغ الآمن لكل يوم
                </p>
              </div>
            </div>
          </div>

          {/* Calculator */}
          <SmartCalculator />

          {/* How it works */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h2 className="font-bold text-slate-800">كيف تستخدمها؟</h2>
            <div className="space-y-3 text-sm text-slate-600">
              {[
                { step: "١", text: 'اكتب راتبك والتزاماتك بالعربي — مثل: "راتبي 8000 وإيجاري 2000 وقسط سيارة 700"' },
                { step: "٢", text: "الحاسبة تفهم النص وتستخرج الأرقام تلقائياً بالذكاء الاصطناعي" },
                { step: "٣", text: 'يمكنك إضافة بيانات جديدة بدون حذف القديمة — مثل: "زاد قسط جوال 300"' },
                { step: "٤", text: "ترى فوراً المبلغ الآمن لكل يوم حتى نهاية الشهر" },
              ].map((item) => (
                <div key={item.step} className="flex gap-3">
                  <span className="w-7 h-7 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold shrink-0 text-xs">
                    {item.step}
                  </span>
                  <p className="leading-relaxed pt-0.5">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
