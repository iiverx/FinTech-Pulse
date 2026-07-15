import React, { useState } from "react";
import { Logo } from "@/components/Logo";
import { Link, useLocation } from "wouter";
import { ArrowLeft, User, Calendar, MapPin, Users, Home } from "lucide-react";

export default function SetupBasicsPage() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    city: "",
    maritalStatus: "",
    dependents: "",
    housingType: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocation("/setup/income");
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
          {/* Progress */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-slate-600">خطوة 1 من 7</span>
              <span className="text-sm font-semibold text-primary">14%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div className="bg-gradient-to-l from-primary to-secondary h-2 rounded-full" style={{ width: '14%' }}></div>
            </div>
          </div>

          <h2 className="text-2xl font-black text-slate-900 mb-2">معلوماتك الأساسية</h2>
          <p className="text-slate-600 mb-8">دعنا نتعرف عليك أكثر</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">الاسم</label>
              <div className="relative">
                <User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="أحمد محمد"
                  className="w-full pr-12 pl-4 py-3 border-2 border-slate-300 rounded-lg focus:border-primary focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">العمر</label>
                <div className="relative">
                  <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({...formData, age: e.target.value})}
                    placeholder="30"
                    className="w-full pr-12 pl-4 py-3 border-2 border-slate-300 rounded-lg focus:border-primary focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">المدينة</label>
                <div className="relative">
                  <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <select
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    className="w-full pr-12 pl-4 py-3 border-2 border-slate-300 rounded-lg focus:border-primary focus:outline-none"
                    required
                  >
                    <option value="">اختر المدينة</option>
                    <option value="riyadh">الرياض</option>
                    <option value="jeddah">جدة</option>
                    <option value="dammam">الدمام</option>
                    <option value="mecca">مكة</option>
                    <option value="medina">المدينة</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">الحالة الاجتماعية</label>
              <div className="grid grid-cols-2 gap-3">
                {["أعزب", "متزوج", "مطلق", "أرمل"].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setFormData({...formData, maritalStatus: status})}
                    className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                      formData.maritalStatus === status
                        ? 'bg-gradient-to-l from-primary to-secondary text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">عدد المعالين</label>
              <div className="relative">
                <Users className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="number"
                  value={formData.dependents}
                  onChange={(e) => setFormData({...formData, dependents: e.target.value})}
                  placeholder="0"
                  min="0"
                  className="w-full pr-12 pl-4 py-3 border-2 border-slate-300 rounded-lg focus:border-primary focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">نوع السكن</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {["ملك", "إيجار", "مع العائلة"].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData({...formData, housingType: type})}
                    className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                      formData.housingType === type
                        ? 'bg-gradient-to-l from-primary to-secondary text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
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
                href="/setup"
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
