import React from "react";
import nabdhLogo from "@assets/نبض_1784109334228.jpg";

interface LogoProps {
  className?: string;
  imageClassName?: string;
  showText?: boolean;
}

export function Logo({ className = "", imageClassName = "h-10", showText = true }: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="bg-black rounded-lg overflow-hidden flex items-center justify-center">
        <img 
          src={nabdhLogo} 
          alt="نبض | Pulse" 
          className={`object-contain ${imageClassName}`} 
        />
      </div>
      {showText && (
        <span className="font-bold text-xl tracking-tight">
          <span className="bg-gradient-to-l from-primary to-secondary bg-clip-text text-transparent">نبض</span>
          <span className="text-slate-400 font-light mx-1">|</span>
          <span className="text-primary font-semibold">Pulse</span>
        </span>
      )}
    </div>
  );
}
