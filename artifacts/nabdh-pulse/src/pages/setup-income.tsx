import React, { useState } from "react";
import { Logo } from "@/components/Logo";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Wallet, Calendar, TrendingUp } from "lucide-react";

export default function SetupIncomePage() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    monthlySalary: "",
    salaryDay: "",
    additionalIncome: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocation("/setup/commitments");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <Logo imageClassName="h-10" />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-slate-600">خطوة 2 من 7</span>
              <span className="text-sm font-semibold text-primary">29%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div className="bg-gradient-to-l from-primary to-secondary h-2 rounded-full" style={{ width: '29%' }}></div>
            </div>
          </div>

          <h2 className="text-2xl font-black text-slate-900 mb-2">مصادر دخلك</h2>
          <p className="text-slate-600 mb-8">أخبرنا عن دخلك الشهري</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">الراتب الشهري (ريال)</label>
              <div className="relative">
                <Wallet className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="number"
                  value={formData.monthlySalary}
                  onChange={(e) => setFormData({...formData, monthlySalary: e.target.value})}
                  placeholder="7500"
                  min="0"
                  step="100"
                  className="w-full pr-12 pl-4 py-3 border-2 border-slate-300 rounded-lg focus:border-primary focus:outline-none text-lg font-semibold"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">يوم نزول الراتب</label>
              <div className="relative">
                <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <select
                  value={formData.salaryDay}
                  onChange={(e) => setFormData({...formData, salaryDay: e.target.value})}
                  className="w-full pr-12 pl-4 py-3 border-2 border-slate-300 rounded-lg focus:border-primary focus:outline-none"
                  required
                >
                  <option value="">اختر اليوم</option>
                  {[...Array(28)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>يوم {i + 1}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">دخل إضافي (اختياري)</label>
              <div className="relative">
                <TrendingUp className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="number"
                  value={formData.additionalIncome}
                  onChange={(e) => setFormData({...formData, additionalIncome: e.target.value})}
                  placeholder="0"
                  min="0"
                  step="100"
                  className="w-full pr-12 pl-4 py-3 border-2 border-slate-300 rounded-lg focus:border-primary focus:outline-none"
                />
              </div>
              <p className="text-sm text-slate-500 mt-2">مثل: استثمارات، مشاريع جانبية، إلخ</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <span className="font-bold">إجمالي الدخل الشهري: </span>
                <span className="text-2xl font-black text-primary">
                  {(Number(formData.monthlySalary) + Number(formData.additionalIncome || 0)).toLocaleString()}
                </span> ريال
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                className="flex-1 py-4 bg-gradient-to-l from-primary to-secondary text-white rounded-lg font-bold text-lg hover:shadow-lg transition-all"
              >
                التالي
              </button>
              <Link 
                href="/setup/basics"
                className="py-4 px-6 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 transition-all flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>رجوع</span>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
