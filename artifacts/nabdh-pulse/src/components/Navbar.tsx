import React from "react";
import { Link } from "wouter";
import { Logo } from "@/components/Logo";

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/">
            <Logo imageClassName="h-10" />
          </Link>
          
          <div className="hidden md:flex items-center gap-8 text-sm">
            <Link href="/" className="text-slate-600 hover:text-primary transition-colors">
              الرئيسية
            </Link>
            <a href="#problem" className="text-slate-600 hover:text-primary transition-colors">
              المشكلة
            </a>
            <a href="#solution" className="text-slate-600 hover:text-primary transition-colors">
              الحل
            </a>
            <a href="#features" className="text-slate-600 hover:text-primary transition-colors">
              المميزات
            </a>
            <a href="#innovation" className="text-slate-600 hover:text-primary transition-colors">
              الابتكار
            </a>
            <a href="#value" className="text-slate-600 hover:text-primary transition-colors">
              القيمة للبنك
            </a>
            <a href="#vision" className="text-slate-600 hover:text-primary transition-colors">
              الرؤية
            </a>
          </div>

          <Link 
            href="/auth" 
            className="px-6 py-2.5 bg-gradient-to-l from-primary to-secondary text-white rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            ابدأ الآن
          </Link>
        </div>
      </div>
    </nav>
  );
}
