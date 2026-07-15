import React from "react";
import { Logo } from "@/components/Logo";
import { Link, useLocation } from "wouter";
import { Shield, Lock, Eye, Brain, CreditCard } from "lucide-react";

export default function LinkBankPage() {
  const [, setLocation] = useLocation();

  const handleLink = () => {
    setLocation("/analyzing");
  };

  const handleDemo = () => {
    setLocation("/analyzing");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <Logo imageClassName="h-12" />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 md:p-12">
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-slate-600">خطوة 6 من 7</span>
              <span className="text-sm font-semibold text-primary">86%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div className="bg-gradient-to-l from-primary to-secondary h-2 rounded-full" style={{ width: '86%' }}></div>
            </div>
          </div>

          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-slate-900 mb-4">ربط حسابك البنكي</h2>
            <p className="text-xl text-slate-600 leading-relaxed">
              اربط حسابك مع بنك الإنماء لنبني لك مؤشر نبض دقيق
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              { icon: Shield, title: "آمن 100%", desc: "تشفير من الدرجة البنكية" },
              { icon: Lock, title: "خصوصية كاملة", desc: "بياناتك محمية بالكامل" },
              { icon: Eye, title: "للقراءة فقط", desc: "لا نستطيع إجراء معاملات" },
              { icon: Brain, title: "تحليل ذكي", desc: "ذكاء اصطناعي متقدم" }
            ].map((feature, idx) => (
              <div key={idx} className="bg-gradient-to-br from-blue-50 to-green-50 border border-blue-200 rounded-xl p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-600">{feature.desc}</p>
              </div>
            ))}
          </div>

          <div className="space-y-4 mb-8">
            <button
              onClick={handleLink}
              className="w-full flex items-center justify-center gap-4 p-6 bg-gradient-to-l from-green-600 to-green-500 text-white rounded-xl font-bold text-lg hover:shadow-xl transition-all"
            >
              <CreditCard className="w-6 h-6" />
              <span>ربط حساب الإنماء</span>
            </button>

            <button
              onClick={handleDemo}
              className="w-full p-5 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-all"
            >
              تجربة ببيانات تجريبية
            </button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <Shield className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-blue-900 mb-2">لماذا نحتاج ربط حسابك؟</h4>
                <p className="text-sm text-blue-800 leading-relaxed">
                  لنحلل معاملاتك المصرفية ونبني لك مؤشر نبض دقيق. نستخدم بروتوكولات أمان بنكية ولا نشارك بياناتك مع أي جهة خارجية.
                </p>
              </div>
            </div>
          </div>

          <div className="text-center mt-8">
            <Link href="/setup/goals" className="text-primary hover:underline font-semibold">
              رجوع
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
