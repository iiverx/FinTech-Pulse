import React from "react";

interface HeartbeatLineProps {
  color?: string;
  className?: string;
  animated?: boolean;
}

export function HeartbeatLine({ color = "#1D4ED8", className = "", animated = true }: HeartbeatLineProps) {
  return (
    <svg
      viewBox="0 0 200 50"
      className={`w-full h-8 ${className}`}
      preserveAspectRatio="none"
    >
      {animated && (
        <defs>
          <linearGradient id="hb-fade" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} stopOpacity="0" />
            <stop offset="30%" stopColor={color} stopOpacity="0.8" />
            <stop offset="70%" stopColor={color} stopOpacity="0.8" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
      )}
      <polyline
        points="0,25 30,25 40,10 50,40 60,15 70,30 80,25 110,25 120,5 130,45 140,20 150,28 200,25"
        fill="none"
        stroke={animated ? `url(#hb-fade)` : color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ opacity: 0.75 }}
      />
    </svg>
  );
}
