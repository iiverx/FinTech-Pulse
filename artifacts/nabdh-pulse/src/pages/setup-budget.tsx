import React, { useState } from "react";
import { Logo } from "@/components/Logo";
import { Link, useLocation } from "wouter";
import { ArrowLeft, ShoppingCart, Utensils, Car, Heart, Shirt, Smartphone, Coffee, MoreHorizontal } from "lucide-react";

export default function SetupBudgetPage() {
  const [, setLocation] = useLocation();
  const [budget, setBudget] = useState({
    groceries: "",
    dining: "",
    transport: "",
    health: "",
    clothing: "",
    entertainment: "",
    personal: "",
    other: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocation("/setup/goals");
  };

  const total = Object.values(budget).reduce((sum, val) => sum + Number(val || 0), 0);

  const categories = [
    { key: "groceries", label: "بقالة ومواد غذائية", icon: ShoppingCart, color: "blue" },
    { key: "dining", label: "مطاعم ومقاهي", icon: Utensils, color: "amber" },
    { key: "transport", label: "مواصلات ووقود", icon: Car, color: "green" },
    { key: "health", label: "صحة ورياضة", icon: Heart, color: "red" },
    { key: "clothing", label: "ملابس وإكسسوارات", icon: Shirt, color: "purple" },
    { key: "entertainment", label: "ترفيه وتسلية", icon: Smartphone, color: "pink" },
    { key: "personal", label: "عناية شخصية", icon: Coffee, color: "teal" },
    { key: "other", label: "أخرى", icon: MoreHorizontal, color: "slate" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <Logo imageClassName="h-10" />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-slate-600">خطوة 4 من 7</span>
              <span className="text-sm font-semibold text-primary">57%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div className="bg-gradient-to-l from-primary to-secondary h-2 rounded-full" style={{ width: '57%' }}></div>
            </div>
          </div>

          <h2 className="text-2xl font-black text-slate-900 mb-2">ميزانيتك الشهرية</h2>
          <p className="text-slate-600 mb-8">حدد المبلغ التقريبي لكل فئة</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {categories.map(({ key, label, icon: Icon, color }) => (
                <div key={key} className={`bg-${color}-50 border-2 border-${color}-200 rounded-xl p-4`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-lg bg-${color}-500 flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-slate-900">{label}</span>
                  </div>
                  <input
                    type="number"
                    value={budget[key as keyof typeof budget]}
                    onChange={(e) => setBudget({...budget, [key]: e.target.value})}
                    placeholder="0"
                    min="0"
                    step="50"
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-primary focus:outline-none text-lg font-semibold"
                  />
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-l from-blue-50 to-green-50 border-2 border-primary/30 rounded-xl p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-slate-700 mb-1">إجمالي الميزانية الشهرية:</p>
                  <p className="text-4xl font-black text-primary">{total.toLocaleString()} <span className="text-xl">ريال</span></p>
                </div>
                <div className="text-left">
                  <p className="text-sm text-slate-700 mb-1">نسبة من الدخل:</p>
                  <p className="text-2xl font-bold text-secondary">~34%</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                className="flex-1 py-4 bg-gradient-to-l from-primary to-secondary text-white rounded-lg font-bold text-lg hover:shadow-lg transition-all"
              >
                التالي
              </button>
              <Link 
                href="/setup/commitments"
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
