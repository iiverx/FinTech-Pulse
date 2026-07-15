import React, { useState } from "react";
import { Logo } from "@/components/Logo";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Home, CreditCard, Briefcase, Receipt, Wifi, Users, DollarSign } from "lucide-react";

export default function SetupCommitmentsPage() {
  const [, setLocation] = useLocation();
  const [commitments, setCommitments] = useState({
    rent: "",
    installments: "",
    loans: "",
    creditCards: "",
    bills: "",
    subscriptions: "",
    familyExpenses: "",
    other: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocation("/setup/budget");
  };

  const total = Object.values(commitments).reduce((sum, val) => sum + Number(val || 0), 0);

  const fields = [
    { key: "rent", label: "إيجار السكن", icon: Home },
    { key: "installments", label: "أقساط شهرية", icon: Briefcase },
    { key: "loans", label: "قروض", icon: DollarSign },
    { key: "creditCards", label: "بطاقات ائتمانية", icon: CreditCard },
    { key: "bills", label: "فواتير (كهرباء، ماء، إلخ)", icon: Receipt },
    { key: "subscriptions", label: "اشتراكات", icon: Wifi },
    { key: "familyExpenses", label: "مصاريف عائلية", icon: Users },
    { key: "other", label: "أخرى", icon: DollarSign }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-3xl w-full">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <Logo imageClassName="h-10" />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-slate-600">خطوة 3 من 7</span>
              <span className="text-sm font-semibold text-primary">43%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div className="bg-gradient-to-l from-primary to-secondary h-2 rounded-full" style={{ width: '43%' }}></div>
            </div>
          </div>

          <h2 className="text-2xl font-black text-slate-900 mb-2">التزاماتك الشهرية</h2>
          <p className="text-slate-600 mb-8">ما هي المصاريف الثابتة الشهرية؟</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fields.map(({ key, label, icon: Icon }) => (
                <div key={key}>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{label}</label>
                  <div className="relative">
                    <Icon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="number"
                      value={commitments[key as keyof typeof commitments]}
                      onChange={(e) => setCommitments({...commitments, [key]: e.target.value})}
                      placeholder="0"
                      min="0"
                      step="10"
                      className="w-full pr-11 pl-4 py-3 border-2 border-slate-300 rounded-lg focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-l from-blue-50 to-green-50 border-2 border-primary/30 rounded-xl p-6 mt-6">
              <p className="text-sm text-slate-700 mb-2">إجمالي الالتزامات الشهرية:</p>
              <p className="text-4xl font-black text-primary">{total.toLocaleString()} <span className="text-xl">ريال</span></p>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                className="flex-1 py-4 bg-gradient-to-l from-primary to-secondary text-white rounded-lg font-bold text-lg hover:shadow-lg transition-all"
              >
                التالي
              </button>
              <Link 
                href="/setup/income"
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
