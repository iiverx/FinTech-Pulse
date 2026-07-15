import React from "react";

interface CircularIndicatorProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  className?: string;
}

export function CircularIndicator({ 
  value, 
  size = 200, 
  strokeWidth = 16, 
  label = "مستقر ماليًا",
  className = "" 
}: CircularIndicatorProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  
  const getColor = (val: number) => {
    if (val >= 80) return "#16A34A";
    if (val >= 60) return "#1D4ED8";
    return "#EF4444";
  };

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={getColor(value)}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ 
              transition: "stroke-dashoffset 1s ease-in-out",
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-bold" style={{ color: getColor(value) }}>
            {value}
          </span>
          <span className="text-sm text-muted-foreground">/100</span>
        </div>
      </div>
      <span className="text-lg font-semibold text-slate-700">{label}</span>
    </div>
  );
}
