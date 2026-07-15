import React from "react";
import { Logo } from "@/components/Logo";
import { Link } from "wouter";
import { CreditCard, UserPlus, LogIn, PlayCircle } from "lucide-react";

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <Logo imageClassName="h-16" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-3">مرحبًا بك في نبض</h1>
          <p className="text-slate-600 text-lg">
            اختر طريقة الدخول المناسبة لك
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 space-y-4">
          <Link 
            href="/login"
            className="flex items-center gap-4 w-full p-5 bg-gradient-to-l from-primary to-secondary text-white rounded-xl font-bold text-lg hover:shadow-lg transition-all"
          >
            <LogIn className="w-6 h-6" />
            <span>تسجيل الدخول</span>
          </Link>

          <Link 
            href="/register"
            className="flex items-center gap-4 w-full p-5 bg-white border-2 border-primary text-primary rounded-xl font-bold text-lg hover:bg-blue-50 transition-all"
          >
            <UserPlus className="w-6 h-6" />
            <span>إنشاء حساب جديد</span>
          </Link>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-slate-500 font-semibold">أو</span>
            </div>
          </div>

          <Link 
            href="/link-bank"
            className="flex items-center gap-4 w-full p-5 bg-gradient-to-l from-green-600 to-green-500 text-white rounded-xl font-bold text-lg hover:shadow-lg transition-all"
          >
            <CreditCard className="w-6 h-6" />
            <span>الدخول عبر بنك الإنماء</span>
          </Link>

          <Link 
            href="/analyzing"
            className="flex items-center gap-4 w-full p-5 bg-slate-100 text-slate-700 rounded-xl font-semibold text-base hover:bg-slate-200 transition-all"
          >
            <PlayCircle className="w-5 h-5" />
            <span>تجربة ببيانات تجريبية</span>
          </Link>
        </div>

        <div className="text-center mt-6">
          <Link href="/" className="text-primary hover:underline font-semibold">
            العودة إلى الرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}
