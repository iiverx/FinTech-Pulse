import React from "react";
import { Logo } from "@/components/Logo";
import { PulseGauge } from "@/components/PulseGauge";
import { HeartbeatLine } from "@/components/HeartbeatLine";
import { Link } from "wouter";
import { TrendingUp, AlertTriangle, Sparkles, ArrowLeft } from "lucide-react";

export default function ResultPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <Logo imageClassName="h-12" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 mb-4">مبروك! مؤشر نبضك جاهز</h1>
          <p className="text-xl text-slate-600">
            إليك أول تقييم لصحتك المالية
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 md:p-12 mb-8">
          <div className="flex justify-center mb-6">
            <PulseGauge value={78} size={220} label="مستقر ماليًا" />
          </div>
          <div className="max-w-xs mx-auto mb-8">
            <HeartbeatLine color="#1D4ED8" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-green-900">أقوى نقطة</h3>
              </div>
              <p className="text-green-800 leading-relaxed">
                نسبة ادخارك ممتازة (18% من الدخل). تلتزم بالخطة المالية بشكل جيد.
              </p>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-300 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-amber-900">يحتاج تحسين</h3>
              </div>
              <p className="text-amber-800 leading-relaxed">
                إنفاقك على المطاعم مرتفع (22% من الميزانية). يمكن تقليله بـ 300 ريال شهريًا.
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-blue-900">فرصة توفير</h3>
              </div>
              <p className="text-blue-800 leading-relaxed">
                يمكنك توفير 450 ريال إضافي شهريًا بتحسين عادات الإنفاق.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-l from-primary to-secondary rounded-2xl shadow-xl p-8 text-white text-center mb-6">
          <h2 className="text-2xl font-black mb-3">رحلتك المالية تبدأ الآن</h2>
          <p className="text-lg opacity-95 mb-6">
            استكشف لوحة نبض وابدأ في تحسين وضعك المالي مع التوصيات الذكية
          </p>
          <Link 
            href="/dashboard"
            className="inline-block px-10 py-4 bg-white text-primary rounded-lg font-bold text-lg hover:shadow-xl transition-all"
          >
            الدخول إلى لوحة نبض
          </Link>
        </div>
      </div>
    </div>
  );
}
