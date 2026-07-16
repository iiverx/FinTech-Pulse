import React, { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Link, useLocation } from "wouter";
import { User, Mail, Lock, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const { register, isRegistering, registerError } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [validationError, setValidationError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");

    if (formData.password !== formData.confirmPassword) {
      setValidationError("كلمتا المرور غير متطابقتين");
      return;
    }

    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
      setLocation("/setup");
    } catch {
      // error shown via registerError
    }
  };

  const error = validationError || registerError;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50" dir="rtl">
      <Navbar fixed={false} />
      <div className="flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-slate-900 mb-2">إنشاء حساب جديد</h1>
          <p className="text-slate-600">
            انضم إلى نبض وابدأ رحلتك المالية
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                الاسم الكامل
              </label>
              <div className="relative">
                <User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="أحمد محمد"
                  className="w-full pr-12 pl-4 py-3 border-2 border-slate-300 rounded-lg focus:border-primary focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="example@email.com"
                  className="w-full pr-12 pl-4 py-3 border-2 border-slate-300 rounded-lg focus:border-primary focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                كلمة المرور
              </label>
              <div className="relative">
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full pr-12 pl-4 py-3 border-2 border-slate-300 rounded-lg focus:border-primary focus:outline-none"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                تأكيد كلمة المرور
              </label>
              <div className="relative">
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full pr-12 pl-4 py-3 border-2 border-slate-300 rounded-lg focus:border-primary focus:outline-none"
                  required
                />
              </div>
            </div>

            {error && (
              <p className="text-red-600 text-sm font-medium text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={isRegistering}
              className="w-full py-4 bg-gradient-to-l from-primary to-secondary text-white rounded-lg font-bold text-lg hover:shadow-lg transition-all disabled:opacity-60"
            >
              {isRegistering ? "جارٍ إنشاء الحساب..." : "متابعة"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-600">
              لديك حساب بالفعل؟{" "}
              <Link href="/login" className="text-primary hover:underline font-bold">
                سجّل الدخول
              </Link>
            </p>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link href="/auth" className="inline-flex items-center gap-2 text-primary hover:underline font-semibold">
            <ArrowLeft className="w-4 h-4" />
            <span>رجوع</span>
          </Link>
        </div>
      </div>
      </div>
    </div>
  );
}
