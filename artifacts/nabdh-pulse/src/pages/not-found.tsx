import React from "react";
import { Link } from "wouter";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-9xl font-black text-primary mb-4">404</h1>
        <h2 className="text-3xl font-bold text-slate-900 mb-4">الصفحة غير موجودة</h2>
        <p className="text-xl text-slate-600 mb-8">
          عذرًا، الصفحة التي تبحث عنها غير موجودة
        </p>
        <Link 
          href="/"
          className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-l from-primary to-secondary text-white rounded-lg font-bold text-lg hover:shadow-xl transition-all"
        >
          <Home className="w-5 h-5" />
          <span>العودة إلى الرئيسية</span>
        </Link>
      </div>
    </div>
  );
}
