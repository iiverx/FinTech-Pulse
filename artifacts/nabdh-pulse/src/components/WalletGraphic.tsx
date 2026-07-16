import React, { useEffect, useRef } from "react";

interface WalletGraphicProps {
  level: 1 | 2 | 3 | 4;
  pulse?: boolean;           // breathing animation
  className?: string;
  style?: React.CSSProperties;
}

// Palette per level
interface LevelPalette { body: string; shadow: string; stitch: string; clasp: string; glow: string | null; }
const LEVELS: Record<1|2|3|4, LevelPalette> = {
  1: { body: "#7B4F2E", shadow: "#4A2E10", stitch: "#A0724A", clasp: "#8B7355", glow: null },
  2: { body: "#8B5E34", shadow: "#5A3518", stitch: "#B8875A", clasp: "#C8A830", glow: null },
  3: { body: "#5C3318", shadow: "#3A1F0A", stitch: "#8B5E34", clasp: "#FFD700", glow: "rgba(255,215,0,0.25)" },
  4: { body: "#8B6914", shadow: "#5A4008", stitch: "#FFE066", clasp: "#FFD700", glow: "rgba(255,215,0,0.5)" },
};

export function WalletGraphic({ level, pulse = true, className = "" }: WalletGraphicProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const levelRef  = useRef(level);
  const rafRef    = useRef<number>(0);

  useEffect(() => { levelRef.current = level; }, [level]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx    = canvas.getContext("2d")!;
    let t = 0;
    let prevLevel = levelRef.current;
    let transition = 1;          // 0→1 while animating level change

    const resize = () => {
      canvas.width  = canvas.offsetWidth  * devicePixelRatio;
      canvas.height = canvas.offsetHeight * devicePixelRatio;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      t += 0.016;

      const W = canvas.width, H = canvas.height;
      const cx = W / 2, cy = H / 2;
      const sc = Math.min(W, H);

      ctx.clearRect(0, 0, W, H);

      // Animate level transitions
      const curLevel = levelRef.current;
      if (curLevel !== prevLevel) {
        transition = 0;
        prevLevel = curLevel;
      }
      if (transition < 1) transition = Math.min(1, transition + 0.04);

      const pal = LEVELS[curLevel];

      // Breathing scale
      const breathe = pulse ? 1 + Math.sin(t * 1.4) * 0.015 : 1;
      const scale   = sc * 0.55 * breathe;

      ctx.save();
      ctx.translate(cx, cy);

      // ── Level 4: golden outer glow ──────────────────────────────────────
      if (curLevel >= 3 && pal.glow) {
        const glowR = scale * 0.9;
        const grd = ctx.createRadialGradient(0, 0, glowR * 0.2, 0, 0, glowR);
        grd.addColorStop(0, pal.glow);
        grd.addColorStop(1, "transparent");
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(0, 0, glowR, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── Wallet shadow ───────────────────────────────────────────────────
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.35)";
      ctx.shadowBlur  = scale * 0.12;
      ctx.shadowOffsetY = scale * 0.08;
      drawWalletBody(ctx, scale, pal, curLevel, t, transition);
      ctx.restore();

      // ── Wallet body ─────────────────────────────────────────────────────
      drawWalletBody(ctx, scale, pal, curLevel, t, transition);

      // ── Level 3+: floating coins ────────────────────────────────────────
      if (curLevel >= 3) {
        const coinCount = curLevel === 4 ? 6 : 3;
        for (let i = 0; i < coinCount; i++) {
          const angle = (i / coinCount) * Math.PI * 2 + t * 0.4;
          const r = scale * (0.62 + 0.08 * (i % 2));
          const cx2 = Math.cos(angle) * r;
          const cy2 = Math.sin(angle) * r * 0.5;
          drawCoin(ctx, cx2, cy2, scale * 0.09, t + i * 1.5);
        }
      }

      // ── Level 4: sparkles ────────────────────────────────────────────────
      if (curLevel === 4) {
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2 + t * 0.6;
          const d = scale * (0.5 + 0.25 * Math.sin(t * 1.2 + i));
          const sx = Math.cos(a) * d;
          const sy = Math.sin(a) * d * 0.7;
          const alpha = 0.5 + 0.5 * Math.sin(t * 2 + i * 0.8);
          ctx.save();
          ctx.globalAlpha = alpha;
          drawSparkle(ctx, sx, sy, scale * 0.025);
          ctx.restore();
        }
      }

      ctx.restore();
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, []); // eslint-disable-line

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full ${className}`}
      style={{ display: "block" }}
    />
  );
}

// ── Drawing helpers ────────────────────────────────────────────────────────────

function drawWalletBody(
  ctx: CanvasRenderingContext2D,
  scale: number,
  pal: typeof LEVELS[1],
  level: 1 | 2 | 3 | 4,
  t: number,
  _transition: number
) {
  const w = scale * 1.1, h = scale * 0.72;
  const r = scale * 0.1;   // corner radius

  // Body gradient
  const bodyG = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
  if (level === 4) {
    bodyG.addColorStop(0, "#C8A830");
    bodyG.addColorStop(0.35, "#FFD700");
    bodyG.addColorStop(0.65, "#E8C020");
    bodyG.addColorStop(1, "#9A7010");
  } else {
    bodyG.addColorStop(0, lighten(pal.body, 30));
    bodyG.addColorStop(0.5, pal.body);
    bodyG.addColorStop(1, pal.shadow);
  }

  // Main rectangle
  roundRect(ctx, -w / 2, -h / 2, w, h, r);
  ctx.fillStyle = bodyG;
  ctx.fill();

  // Glossy top sheen
  const sheenG = ctx.createLinearGradient(0, -h / 2, 0, 0);
  sheenG.addColorStop(0, "rgba(255,255,255,0.22)");
  sheenG.addColorStop(1, "rgba(255,255,255,0)");
  roundRect(ctx, -w / 2, -h / 2, w, h * 0.5, r);
  ctx.fillStyle = sheenG;
  ctx.fill();

  // Border / outline
  roundRect(ctx, -w / 2, -h / 2, w, h, r);
  ctx.strokeStyle = level >= 2 ? pal.clasp + "cc" : pal.stitch + "88";
  ctx.lineWidth = scale * (level === 4 ? 0.025 : 0.018);
  if (level === 4) {
    ctx.shadowColor = "#FFD700";
    ctx.shadowBlur  = scale * 0.12;
  }
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Stitch lines (decorative border inside)
  const pad = scale * 0.06;
  roundRect(ctx, -w / 2 + pad, -h / 2 + pad, w - pad * 2, h - pad * 2, r * 0.6);
  ctx.strokeStyle = pal.stitch + (level <= 2 ? "55" : "88");
  ctx.lineWidth   = scale * 0.008;
  ctx.setLineDash([scale * 0.03, scale * 0.025]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Fold line (horizontal crease)
  ctx.beginPath();
  ctx.moveTo(-w / 2 + pad, 0);
  ctx.lineTo(w / 2 - pad, 0);
  ctx.strokeStyle = pal.shadow + "88";
  ctx.lineWidth   = scale * 0.01;
  ctx.stroke();

  // ── Card slot on front ──────────────────────────────────────────────────
  const slotW = w * 0.55, slotH = h * 0.28;
  const slotX = w * 0.05, slotY = h * 0.08;
  const slotR = scale * 0.04;

  const slotG = ctx.createLinearGradient(slotX, slotY, slotX, slotY + slotH);
  slotG.addColorStop(0, pal.shadow + "cc");
  slotG.addColorStop(1, pal.shadow + "44");
  roundRect(ctx, slotX, slotY, slotW, slotH, slotR);
  ctx.fillStyle   = slotG; ctx.fill();
  ctx.strokeStyle = pal.clasp + "55";
  ctx.lineWidth   = scale * 0.01; ctx.stroke();

  // Card visible inside slot
  if (level >= 2) {
    const cardH = slotH * 0.55;
    roundRect(ctx, slotX + slotW * 0.06, slotY + slotH - cardH + slotH * 0.1, slotW * 0.88, cardH, slotR * 0.6);
    const cardG = ctx.createLinearGradient(0, 0, slotW, 0);
    cardG.addColorStop(0, level >= 3 ? "#2050b0" : "#2060b0");
    cardG.addColorStop(1, level >= 3 ? "#1040a0cc" : "#1840a0cc");
    ctx.fillStyle   = cardG; ctx.fill();
    ctx.strokeStyle = "#ffffff22";
    ctx.lineWidth   = scale * 0.008; ctx.stroke();
  }

  // ── Clasp / buckle ──────────────────────────────────────────────────────
  const claspW = w * 0.28, claspH = h * 0.19;
  const claspX = -claspW / 2, claspY = -claspH / 2 - h * 0.02;
  const claspR = scale * 0.035;

  const claspG = ctx.createLinearGradient(claspX, claspY, claspX, claspY + claspH);
  if (level === 4) {
    claspG.addColorStop(0, "#FFF0A0");
    claspG.addColorStop(0.5, "#FFD700");
    claspG.addColorStop(1, "#C8A000");
  } else if (level >= 2) {
    claspG.addColorStop(0, lighten(pal.clasp, 20));
    claspG.addColorStop(1, pal.clasp);
  } else {
    claspG.addColorStop(0, "#9E8060");
    claspG.addColorStop(1, "#6B5040");
  }
  roundRect(ctx, claspX, claspY, claspW, claspH, claspR);
  ctx.fillStyle = claspG; ctx.fill();
  ctx.strokeStyle = level >= 2 ? "#FFD70099" : "#70502099";
  ctx.lineWidth   = scale * 0.015;
  if (level === 4) { ctx.shadowColor = "#FFD700"; ctx.shadowBlur = scale * 0.1; }
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Clasp pin hole
  ctx.beginPath();
  ctx.arc(0, 0, scale * 0.035, 0, Math.PI * 2);
  ctx.fillStyle   = pal.shadow + "cc"; ctx.fill();
  ctx.strokeStyle = pal.clasp + "88";
  ctx.lineWidth   = scale * 0.012; ctx.stroke();

  // ── Level 4: animated shimmer ───────────────────────────────────────────
  if (level === 4) {
    const shimX = -w / 2 + (((t * 0.4) % 1.4) - 0.2) * (w + w * 0.4);
    const shimG = ctx.createLinearGradient(shimX - scale * 0.15, 0, shimX + scale * 0.15, 0);
    shimG.addColorStop(0, "transparent");
    shimG.addColorStop(0.5, "rgba(255,255,220,0.35)");
    shimG.addColorStop(1, "transparent");
    roundRect(ctx, -w / 2, -h / 2, w, h, r);
    ctx.fillStyle = shimG; ctx.fill();
  }
}

function drawCoin(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, t: number) {
  const tilt = Math.cos(t * 1.2) * 0.8;  // coin tilt makes it look 3D
  const rx = r, ry = r * Math.abs(tilt);
  if (ry < 1) return;

  const coinG = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 0, cx, cy, r);
  coinG.addColorStop(0, "#FFF0A0");
  coinG.addColorStop(0.5, "#FFD700");
  coinG.addColorStop(1, "#C8A000");
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle   = coinG; ctx.fill();
  ctx.strokeStyle = "#C8A000cc";
  ctx.lineWidth   = r * 0.08; ctx.stroke();

  // $ symbol
  ctx.font        = `bold ${r * 0.9}px Arial`;
  ctx.fillStyle   = "#9A7010";
  ctx.textAlign   = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("$", cx, cy + 1);
  ctx.textBaseline = "alphabetic";
}

function drawSparkle(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r * 2, cy + Math.sin(a) * r * 2);
    ctx.lineTo(cx + Math.cos(a + Math.PI) * r * 2, cy + Math.sin(a + Math.PI) * r * 2);
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth   = r * 0.5;
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.6, 0, Math.PI * 2);
  ctx.fillStyle = "#FFF0A0"; ctx.fill();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function lighten(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, (num >> 16) + amount);
  const g = Math.min(255, ((num >> 8) & 0xff) + amount);
  const b = Math.min(255, (num & 0xff) + amount);
  return `rgb(${r},${g},${b})`;
}
