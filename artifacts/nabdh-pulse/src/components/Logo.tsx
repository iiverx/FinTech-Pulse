import React from "react";

interface LogoProps {
  className?: string;
  imageClassName?: string;
  showText?: boolean;
  size?: number;
}

export function Logo({ className = "", imageClassName = "h-10", size }: LogoProps) {
  const pxH = size ?? (() => {
    const m = imageClassName.match(/h-(\d+)/);
    return m ? parseInt(m[1]) * 4 : 40;
  })();

  const fontSize    = pxH * 0.6;
  const subFontSize = pxH * 0.22;

  return (
    <div className={`flex items-center gap-1 ${className}`} style={{ direction: "ltr" }}>

      {/* ── EKG waveform + upward arrow (SVG, no text) ── */}
      <svg
        width={pxH * 2.2}
        height={pxH}
        viewBox="0 0 88 40"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        <defs>
          <linearGradient id="ekgGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#00c4b4" />
            <stop offset="60%"  stopColor="#1a7fc4" />
            <stop offset="100%" stopColor="#1a3a8a" />
          </linearGradient>
        </defs>
        {/* EKG heartbeat */}
        <polyline
          points="2,23 12,23 14,13 18,33 20,6 24,36 27,23 42,23"
          fill="none"
          stroke="url(#ekgGrad)"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Upward trend arrow */}
        <line
          x1="42" y1="23" x2="80" y2="5"
          stroke="#1a5aaa"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <polygon points="80,5 71,10 74,16" fill="#1a3a8a" />
      </svg>

      {/* ── Arabic text + pulse label (HTML, no clipping) ── */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", lineHeight: 1 }}>
        <span
          style={{
            fontFamily: "'Tajawal', 'Cairo', Arial, sans-serif",
            fontWeight: 800,
            fontSize,
            background: "linear-gradient(to left, #00c4b4, #1a7fc4, #1a3a8a)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            whiteSpace: "nowrap",
          }}
        >
          نبض
        </span>
        <span
          style={{
            fontFamily: "Arial, sans-serif",
            fontWeight: 600,
            fontSize: subFontSize,
            letterSpacing: "0.18em",
            color: "#1a5a9a",
            opacity: 0.85,
            marginTop: 1,
          }}
        >
          pulse
        </span>
      </div>

    </div>
  );
}
