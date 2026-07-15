import React from "react";
import { Logo } from "@/components/Logo";
import { Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-slate-50 border-t border-slate-200 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1 md:col-span-2">
            <Logo imageClassName="h-12" />
            <p className="mt-4 text-slate-600 max-w-md">
              صحتك المالية تبدأ من نبضة. نبض هو مؤشرك الذكي لصحة مالية أفضل، مدعوم بالذكاء الاصطناعي.
            </p>
          </div>
          
          <div>
            <h3 className="font-bold text-slate-900 mb-4">روابط سريعة</h3>
            <ul className="space-y-2 text-slate-600">
              <li><a href="/" className="hover:text-primary transition-colors">الرئيسية</a></li>
              <li><a href="#features" className="hover:text-primary transition-colors">المميزات</a></li>
              <li><a href="#innovation" className="hover:text-primary transition-colors">الابتكار</a></li>
              <li><a href="/auth" className="hover:text-primary transition-colors">ابدأ الآن</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold text-slate-900 mb-4">تواصل معنا</h3>
            <div className="flex gap-4">
              <a href="#" className="text-slate-600 hover:text-primary transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-slate-600 hover:text-primary transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-slate-600 hover:text-primary transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-slate-600 hover:text-primary transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-slate-300 pt-8 text-center text-slate-600 text-sm">
          <p>© 2024 نبض | Pulse. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  );
}
