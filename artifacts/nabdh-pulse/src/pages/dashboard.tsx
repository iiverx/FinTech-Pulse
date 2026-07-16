import React, { useState } from "react";
import { Logo } from "@/components/Logo";
import { CircularIndicator } from "@/components/CircularIndicator";
import { Link } from "wouter";
import { 
  Home, 
  Activity, 
  Wallet, 
  Bell, 
  Brain, 
  Users, 
  Settings,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PiggyBank,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Send,
  Zap,
  Target,
  CircleDollarSign
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// Static data — defined once outside the component, never recreated on re-render
const forecastData = [
  { day: "اليوم", score: 78 },
  { day: "غدًا", score: 77 },
  { day: "بعد يومين", score: 75 },
  { day: "3 أيام", score: 74 },
  { day: "4 أيام", score: 72 },
  { day: "5 أيام", score: 72 },
  { day: "6 أيام", score: 73 },
];

export default function DashboardPage() {
  const [simulationAmount, setSimulationAmount] = useState("");
  const [chatMessage, setChatMessage] = useState("");

  return (
    <div className="min-h-screen bg-slate-50 flex" dir="rtl">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-l border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-200">
          <Logo imageClassName="h-10" showText={true} />
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {[
            { icon: Home,             label: "الرئيسية",       href: "/dashboard",   active: true  },
            { icon: Activity,         label: "مؤشر النبض",     href: "/dashboard",   active: false },
            { icon: Wallet,           label: "المحفظة الذكية", href: "/savings",     active: false },
            { icon: Bell,             label: "التنبيهات",      href: "/dashboard",   active: false },
            { icon: Zap,              label: "المحاكاة",       href: "/dashboard",   active: false },
            { icon: CircleDollarSign, label: "الحاسبة الذكية", href: "/calculator",  active: false },
            { icon: Brain,            label: "المساعد الذكي",  href: "/dashboard",   active: false },
            { icon: Users,            label: "مجتمع نبض",      href: "/dashboard",   active: false },
            { icon: Settings,         label: "الإعدادات",      href: "/dashboard",   active: false },
          ].map((item, idx) => (
            <Link
              key={idx}
              href={item.href}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all ${
                item.active
                  ? 'bg-gradient-to-l from-primary to-secondary text-white shadow-lg'
                  : 'text-slate-600 hover:bg-slate-100'
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

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1 text-center md:text-right">
                <h1 className="text-3xl font-black text-slate-900 mb-2">مرحبًا، أحمد</h1>
                <p className="text-slate-600">آخر تحديث: اليوم، 3:45 م</p>
              </div>
              <CircularIndicator value={78} size={160} strokeWidth={14} label="مستقر ماليًا" />
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: "الدخل الشهري", value: "7,500", unit: "ريال", icon: TrendingUp, color: "green", bg: "green-50", border: "green-200" },
              { label: "الإنفاق", value: "3,920", unit: "ريال", icon: DollarSign, color: "blue", bg: "blue-50", border: "blue-200" },
              { label: "الالتزامات", value: "1,200", unit: "ريال", icon: AlertTriangle, color: "amber", bg: "amber-50", border: "amber-200" },
              { label: "الادخار", value: "18%", unit: "من الدخل", icon: PiggyBank, color: "teal", bg: "teal-50", border: "teal-200" },
              { label: "الحالة", value: "ضمن النطاق", unit: "", icon: CheckCircle2, color: "green", bg: "green-50", border: "green-200" }
            ].map((card, idx) => (
              <div key={idx} className={`bg-${card.bg} border-2 border-${card.border} rounded-xl p-5`}>
                <div className="flex items-center justify-between mb-3">
                  <card.icon className={`w-6 h-6 text-${card.color}-600`} />
                </div>
                <p className="text-sm text-slate-600 mb-1">{card.label}</p>
                <p className={`text-2xl font-black text-${card.color}-700`}>{card.value}</p>
                {card.unit && <p className="text-xs text-slate-500 mt-1">{card.unit}</p>}
              </div>
            ))}
          </div>

          {/* Safe Amount & Goal */}
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
                <div className="bg-gradient-to-l from-blue-600 to-green-500 h-4 rounded-full" style={{ width: '62%' }}></div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-blue-700">تم توفير: 310 ريال</span>
                <span className="text-blue-700">باقي: 190 ريال</span>
              </div>
            </div>
          </div>

          {/* Smart Alerts */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
              <Bell className="w-6 h-6 text-primary" />
              <span>التنبيهات الذكية</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { type: "warning", title: "ارتفاع في الإنفاق", desc: "إنفاقك على المطاعم ارتفع 22% هذا الشهر", color: "red" },
                { type: "success", title: "فرصة توفير", desc: "يمكنك توفير 200 ريال إضافي هذا الشهر", color: "green" },
                { type: "info", title: "اقتراب دفعة", desc: "لديك دفعة بطاقة ائتمانية بعد 3 أيام", color: "blue" },
                { type: "alert", title: "تنبيه مؤشر", desc: "قد ينخفض مؤشرك إلى 72 خلال 5 أيام", color: "amber" }
              ].map((alert, idx) => (
                <div key={idx} className={`bg-${alert.color}-50 border-2 border-${alert.color}-200 rounded-xl p-4 flex items-start gap-3`}>
                  <Bell className={`w-5 h-5 text-${alert.color}-600 flex-shrink-0 mt-0.5`} />
                  <div>
                    <h4 className={`font-bold text-${alert.color}-900 mb-1`}>{alert.title}</h4>
                    <p className={`text-sm text-${alert.color}-700`}>{alert.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Forecast Chart */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-primary" />
              <span>توقع الأيام القادمة</span>
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" stroke="#64748b" style={{ fontSize: '12px' }} />
                <YAxis domain={[60, 85]} stroke="#64748b" style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '2px solid #1D4ED8', 
                    borderRadius: '8px',
                    direction: 'rtl'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#1D4ED8" 
                  strokeWidth={3} 
                  dot={{ fill: '#1D4ED8', r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Decision Simulation */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
              <Zap className="w-6 h-6 text-primary" />
              <span>محاكاة القرارات</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  أدخل قيمة الشراء المحتمل
                </label>
                <input
                  type="number"
                  value={simulationAmount}
                  onChange={(e) => setSimulationAmount(e.target.value)}
                  placeholder="350"
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-primary focus:outline-none text-lg font-semibold"
                />
                <button className="w-full mt-3 py-3 bg-gradient-to-l from-primary to-secondary text-white rounded-lg font-bold hover:shadow-lg transition-all">
                  احسب التأثير
                </button>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-300 rounded-xl p-6">
                <div className="flex items-start gap-3 mb-4">
                  <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-amber-900 mb-2">النتيجة المتوقعة</h4>
                    <p className="text-sm text-amber-800 mb-3">
                      سينخفض مؤشرك من <span className="font-bold">78</span> إلى <span className="font-bold">72</span>
                    </p>
                  </div>
                </div>
                <div className="bg-amber-200 rounded-lg p-3">
                  <p className="text-sm text-amber-900 font-semibold">
                    التوصية: يُفضّل تأجيل هذا الشراء
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* AI Assistant */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
              <Brain className="w-6 h-6 text-primary" />
              <span>المساعد المالي الذكي</span>
            </h2>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 h-64 overflow-y-auto mb-4">
              <div className="space-y-4">
                <div className="flex justify-end">
                  <div className="bg-gradient-to-l from-primary to-secondary text-white rounded-2xl rounded-bl-sm px-5 py-3 max-w-md">
                    <p>كيف يمكنني تحسين مؤشر نبضي؟</p>
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-white border-2 border-slate-300 rounded-2xl rounded-br-sm px-5 py-3 max-w-md">
                    <p className="text-slate-800">
                      يمكنك تحسين مؤشرك بتقليل الإنفاق على المطاعم بنسبة 20% وزيادة الادخار الشهري. هذا سيرفع مؤشرك إلى 84 خلال شهرين.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="اكتب سؤالك المالي هنا..."
                className="flex-1 px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-primary focus:outline-none"
              />
              <button className="px-6 py-3 bg-gradient-to-l from-primary to-secondary text-white rounded-lg font-semibold hover:shadow-lg transition-all">
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Factor Analysis */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
              <Target className="w-6 h-6 text-primary" />
              <span>تحليل العوامل</span>
            </h2>
            <div className="space-y-4">
              {[
                { label: "نسبة الإنفاق/الدخل", value: 85, color: "green", status: "ممتاز" },
                { label: "الالتزام بالميزانية", value: 78, color: "blue", status: "جيد" },
                { label: "نمو المدخرات", value: 92, color: "teal", status: "ممتاز" },
                { label: "السلوك الشرائي", value: 68, color: "amber", status: "متوسط" },
                { label: "انتظام السداد", value: 95, color: "green", status: "ممتاز" }
              ].map((factor, idx) => (
                <div key={idx}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-slate-700">{factor.label}</span>
                    <span className={`text-sm font-bold text-${factor.color}-600`}>{factor.status}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3">
                    <div 
                      className={`bg-gradient-to-l from-${factor.color}-500 to-${factor.color}-600 h-3 rounded-full`}
                      style={{ width: `${factor.value}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Community Comparison */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
              <Users className="w-6 h-6 text-primary" />
              <span>مجتمع نبض</span>
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
          </div>
        </div>
      </main>
    </div>
  );
}
