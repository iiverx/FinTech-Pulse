import React from "react";
import { Logo } from "@/components/Logo";
import { Link } from "wouter";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

export default function SetupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-3xl w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <Logo imageClassName="h-12" />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 md:p-12">
          {/* Progress Bar */}
          <div className="mb-12">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-semibold text-slate-600">خطوة 1 من 7</span>
              <span className="text-sm font-semibold text-primary">14%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3">
              <div className="bg-gradient-to-l from-primary to-secondary h-3 rounded-full transition-all duration-500" style={{ width: '14%' }}></div>
            </div>
          </div>

          <div className="text-center mb-12">
            <h1 className="text-4xl font-black text-slate-900 mb-4">لنبدأ ببناء نبضك المالي</h1>
            <p className="text-xl text-slate-600 leading-relaxed">
              سنطرح عليك بعض الأسئلة لنفهم وضعك المالي ونبني لك مؤشرًا دقيقًا
            </p>
          </div>

          <div className="space-y-4 mb-12">
            {[
              "معلوماتك الأساسية",
              "مصادر دخلك",
              "التزاماتك الشهرية",
              "ميزانيتك المقترحة",
              "أهدافك المالية",
              "ربط حسابك البنكي",
              "تحليل البيانات"
            ].map((step, idx) => (
              <div key={idx} className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${idx === 0 ? 'bg-gradient-to-l from-primary to-secondary text-white' : 'bg-slate-300 text-slate-600'}`}>
                  {idx + 1}
                </div>
                <span className={`font-semibold ${idx === 0 ? 'text-primary' : 'text-slate-600'}`}>{step}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link 
              href="/setup/basics"
              className="flex-1 py-4 bg-gradient-to-l from-primary to-secondary text-white rounded-lg font-bold text-lg text-center hover:shadow-lg transition-all"
            >
              ابدأ الإعداد
            </Link>
            <Link 
              href="/auth"
              className="py-4 px-6 bg-slate-100 text-slate-700 rounded-lg font-semibold text-center hover:bg-slate-200 transition-all"
            >
              رجوع
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
