import React, { useState } from "react";
import { Logo } from "@/components/Logo";
import { Link, useLocation } from "wouter";
import { Mail, Lock, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocation("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <Logo imageClassName="h-14" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">تسجيل الدخول</h1>
          <p className="text-slate-600">
            مرحبًا بعودتك إلى نبض
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                البريد الإلكتروني أو رقم الجوال
              </label>
              <div className="relative">
                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pr-12 pl-4 py-3 border-2 border-slate-300 rounded-lg focus:border-primary focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-300" />
                <span className="text-slate-600">تذكرني</span>
              </label>
              <a href="#" className="text-primary hover:underline font-semibold">
                نسيت كلمة المرور؟
              </a>
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-l from-primary to-secondary text-white rounded-lg font-bold text-lg hover:shadow-lg transition-all"
            >
              دخول
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-600">
              ليس لديك حساب؟{" "}
              <Link href="/register" className="text-primary hover:underline font-bold">
                أنشئ حسابًا
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
  );
}
