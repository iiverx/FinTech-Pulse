import React, { useEffect, useState } from "react";

interface PulseGaugeProps {
  value?: number;
  size?: number;
  label?: string;
  animate?: boolean;
}

export function PulseGauge({ value = 0, size = 180, label, animate = true }: PulseGaugeProps) {
  const [displayed, setDisplayed] = useState(animate ? 0 : value);

  useEffect(() => {
    if (!animate) { setDisplayed(value); return; }
    const start = 0;
    const end = value;
    const dur = 1200;
    const t0 = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplayed(Math.round(start + (end - start) * eased));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value, animate]);

  const radius = size / 2 - 18;
  const circumference = 2 * Math.PI * radius;
  const progress = (displayed / 100) * circumference;
  const color =
    displayed >= 70 ? "#16A34A" :
    displayed >= 45 ? "#F59E0B" :
    "#DC2626";
  const glowId = `glow-${size}`;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <defs>
            <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Track */}
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="#E0EFFE" strokeWidth="14"
          />
          {/* Progress */}
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke={color} strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${progress} ${circumference}`}
            style={{ transition: "stroke-dasharray 1.2s cubic-bezier(0.34,1.56,0.64,1)", filter: `url(#${glowId})` }}
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span
            className="font-black leading-none"
            style={{ fontSize: size * 0.22, color, fontFamily: "Cairo, sans-serif" }}
          >
            {displayed}
          </span>
          <span className="text-slate-400 font-semibold" style={{ fontSize: size * 0.075 }}>
            / 100
          </span>
        </div>
      </div>
      {label && (
        <span
          className="font-bold px-4 py-1 rounded-full text-sm"
          style={{ background: color + "15", color }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
