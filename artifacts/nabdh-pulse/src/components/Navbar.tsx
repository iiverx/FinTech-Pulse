import React, { useState } from "react";
import { Link } from "wouter";
import { Logo } from "@/components/Logo";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { label: "الرئيسية",       href: "/",           isRoute: true  },
  { label: "المحفظة الذكية", href: "/savings",    isRoute: true  },
  { label: "المشكلة",        href: "#problem",    isRoute: false },
  { label: "الحل",           href: "#solution",   isRoute: false },
  { label: "المميزات",       href: "#features",   isRoute: false },
  { label: "الابتكار",       href: "#innovation", isRoute: false },
  { label: "القيمة للبنك",   href: "#value",      isRoute: false },
  { label: "الرؤية",         href: "#vision",     isRoute: false },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/">
            <Logo imageClassName="h-10" />
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-6 text-sm">
            {NAV_LINKS.map((item) =>
              item.isRoute ? (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`transition-colors ${
                    item.href === "/savings"
                      ? "text-primary font-semibold"
                      : "text-slate-600 hover:text-primary"
                  }`}
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  key={item.href}
                  href={item.href}
                  className="text-slate-600 hover:text-primary transition-colors"
                >
                  {item.label}
                </a>
              )
            )}
          </div>

          {/* CTA + hamburger */}
          <div className="flex items-center gap-3">
            <Link
              href="/auth"
              className="px-5 py-2 bg-gradient-to-l from-primary to-secondary text-white rounded-lg font-semibold text-sm hover:shadow-lg transition-all"
            >
              ابدأ الآن
            </Link>
            <button
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              onClick={() => setOpen((o) => !o)}
              aria-label="القائمة"
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden bg-white border-t border-slate-100 px-4 py-4 space-y-1 shadow-lg">
          {NAV_LINKS.map((item) =>
            item.isRoute ? (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`block w-full text-right px-4 py-3 rounded-lg font-medium transition-colors ${
                  item.href === "/savings"
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                {item.label}
              </Link>
            ) : (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="block w-full text-right px-4 py-3 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                {item.label}
              </a>
            )
          )}
        </div>
      )}
    </nav>
  );
}
