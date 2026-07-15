import React, { useState } from "react";
import { Logo } from "@/components/Logo";
import { Link, useLocation } from "wouter";
import { ArrowLeft, PiggyBank, Shield, Car, Home, TrendingUp, CreditCard, TrendingDown, Check } from "lucide-react";

export default function SetupGoalsPage() {
  const [, setLocation] = useLocation();
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocation("/link-bank");
  };

  const toggleGoal = (goal: string) => {
    setSelectedGoals(prev => 
      prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]
    );
  };

  const goals = [
    { id: "savings", label: "بناء مدخرات شهرية", icon: PiggyBank, color: "blue" },
    { id: "emergency", label: "صندوق طوارئ", icon: Shield, color: "green" },
    { id: "car", label: "شراء سيارة", icon: Car, color: "purple" },
    { id: "house", label: "شراء منزل", icon: Home, color: "amber" },
    { id: "investment", label: "بدء استثمار", icon: TrendingUp, color: "teal" },
    { id: "payoff", label: "سداد التزامات", icon: CreditCard, color: "red" },
    { id: "reduce", label: "تقليل المصاريف", icon: TrendingDown, color: "slate" }
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
              <span className="text-sm font-semibold text-slate-600">خطوة 5 من 7</span>
              <span className="text-sm font-semibold text-primary">71%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div className="bg-gradient-to-l from-primary to-secondary h-2 rounded-full" style={{ width: '71%' }}></div>
            </div>
          </div>

          <h2 className="text-2xl font-black text-slate-900 mb-2">أهدافك المالية</h2>
          <p className="text-slate-600 mb-8">ما الذي تطمح لتحقيقه؟ (يمكنك اختيار أكثر من هدف)</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {goals.map(({ id, label, icon: Icon, color }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleGoal(id)}
                  className={`relative p-6 rounded-xl border-2 transition-all text-right ${
                    selectedGoals.includes(id)
                      ? `bg-gradient-to-br from-${color}-50 to-${color}-100 border-${color}-500 shadow-lg`
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {selectedGoals.includes(id) && (
                    <div className="absolute top-3 left-3 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <Icon className={`w-10 h-10 mb-3 ${selectedGoals.includes(id) ? `text-${color}-600` : 'text-slate-400'}`} />
                  <h3 className={`font-bold text-lg ${selectedGoals.includes(id) ? 'text-slate-900' : 'text-slate-600'}`}>
                    {label}
                  </h3>
                </button>
              ))}
            </div>

            {selectedGoals.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <span className="font-bold">اخترت {selectedGoals.length} {selectedGoals.length === 1 ? 'هدف' : 'أهداف'}</span>
                  <span className="mr-2">— سنساعدك على تتبعها وتحقيقها</span>
                </p>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                className="flex-1 py-4 bg-gradient-to-l from-primary to-secondary text-white rounded-lg font-bold text-lg hover:shadow-lg transition-all"
              >
                التالي
              </button>
              <Link 
                href="/setup/budget"
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
