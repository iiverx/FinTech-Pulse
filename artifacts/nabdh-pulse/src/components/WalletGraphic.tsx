import React, { useEffect, useRef } from "react";

interface WalletGraphicProps {
  level: 1 | 2 | 3 | 4;
  pulse?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

interface Palette {
  body1: string; body2: string; body3: string;
  fold1: string; fold2: string;
  hw1: string;   hw2: string;           // hardware (clasp) colors
  stitch: string;
  glow: string | null;
  cardA: string; cardB: string;
  billColor: string;
  name: string;
}

const PALETTES: Record<1|2|3|4, Palette> = {
  // Level 1 — deep navy → primary blue (site primary)
  1: {
    body1:"#1E3A6E", body2:"#122355", body3:"#0A1628",
    fold1:"#1D4ED8", fold2:"#1E3A6E",
    hw1:"#93C5FD",   hw2:"#3B82F6",
    stitch:"#2563EB",
    glow: null,
    cardA:"#1D4ED8", cardB:"#60A5FA",
    billColor:"#1D4ED8",
    name:"كلاسيكية",
  },
  // Level 2 — blue-to-teal (bridge between brand colors)
  2: {
    body1:"#164E63", body2:"#0C3547", body3:"#041D2C",
    fold1:"#0891B2", fold2:"#164E63",
    hw1:"#67E8F9",   hw2:"#0891B2",
    stitch:"#0E7490",
    glow:"rgba(103,232,249,0.35)",
    cardA:"#0891B2", cardB:"#67E8F9",
    billColor:"#0E7490",
    name:"نشطة",
  },
  // Level 3 — site secondary green
  3: {
    body1:"#14532D", body2:"#052E16", body3:"#021A0C",
    fold1:"#16A34A", fold2:"#14532D",
    hw1:"#4ADE80",   hw2:"#16A34A",
    stitch:"#15803D",
    glow:"rgba(74,222,128,0.4)",
    cardA:"#16A34A", cardB:"#4ADE80",
    billColor:"#15803D",
    name:"ذهبية",
  },
  // Level 4 — premium gold anchored to brand green tint
  4: {
    body1:"#78350F", body2:"#5C2A0A", body3:"#3A1800",
    fold1:"#D97706", fold2:"#92400E",
    hw1:"#FCD34D",   hw2:"#F59E0B",
    stitch:"#B45309",
    glow:"rgba(252,211,77,0.6)",
    cardA:"#D97706", cardB:"#FDE68A",
    billColor:"#16A34A",
    name:"فاخرة ✦",
  },
};

interface Particle { x:number; y:number; vx:number; vy:number; r:number; a:number; phase:number; }

export function WalletGraphic({ level, pulse = true, className = "", style }: WalletGraphicProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);
  const levelRef  = useRef(level);
  const coins     = useRef<Particle[]>([]);

  useEffect(() => { levelRef.current = level; }, [level]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx    = canvas.getContext("2d")!;
    let t = 0;

    const resize = () => {
      canvas.width  = canvas.offsetWidth  * devicePixelRatio;
      canvas.height = canvas.offsetHeight * devicePixelRatio;
      spawnCoins();
    };

    function spawnCoins() {
      const W = canvas.width, H = canvas.height;
      coins.current = Array.from({ length: 10 }, (_, i) => ({
        x: W * (0.1 + Math.random() * 0.8),
        y: H * (0.1 + Math.random() * 0.8),
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        r: Math.min(W, H) * (0.025 + Math.random() * 0.02),
        a: Math.random() * Math.PI * 2,
        phase: Math.random() * Math.PI * 2,
      }));
    }

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      t += 0.016;

      const W = canvas.width, H = canvas.height;
      const lv  = levelRef.current;
      const pal = PALETTES[lv];

      ctx.clearRect(0, 0, W, H);

      const cx = W * 0.5;
      const cy = H * 0.5;
      const sc = Math.min(W, H);

      // Breathe
      const breathe = pulse ? 1 + Math.sin(t * 1.1) * 0.012 : 1;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(breathe, breathe);

      // Outer glow (level 2+)
      if (pal.glow) {
        const glowG = ctx.createRadialGradient(0, 0, sc * 0.1, 0, 0, sc * 0.7);
        glowG.addColorStop(0, pal.glow);
        glowG.addColorStop(1, "transparent");
        ctx.fillStyle = glowG;
        ctx.fillRect(-W / 2, -H / 2, W, H);
      }

      // ── Draw the wallet ───────────────────────────────────────────────
      drawWallet(ctx, W, H, sc, pal, lv, t);

      // ── Floating coins (level 3+) ─────────────────────────────────────
      if (lv >= 3) {
        for (const c of coins.current) {
          c.x += c.vx;
          c.y += c.vy;
          const hw = W / 2, hh = H / 2;
          if (c.x - hw < -sc * 0.55 || c.x - hw > sc * 0.55) c.vx *= -1;
          if (c.y - hh < -sc * 0.55 || c.y - hh > sc * 0.55) c.vy *= -1;
          c.a += 0.025;
          const flip = Math.cos(c.a);
          const visR = Math.abs(flip);
          if (visR > 0.05) {
            drawCoin(ctx, c.x - hw, c.y - hh, c.r, visR, pal, t + c.phase, lv);
          }
        }
      }

      // Sparkles (level 4)
      if (lv === 4) {
        for (let i = 0; i < 6; i++) {
          const ang  = (i / 6) * Math.PI * 2 + t * 0.5;
          const dist = sc * (0.38 + 0.08 * Math.sin(t * 1.5 + i));
          const sx   = Math.cos(ang) * dist;
          const sy   = Math.sin(ang) * dist * 0.6;
          const alpha = 0.4 + 0.5 * Math.sin(t * 2.5 + i);
          ctx.save();
          ctx.globalAlpha = alpha;
          drawSparkle(ctx, sx, sy, sc * 0.022, pal.hw1);
          ctx.restore();
        }
      }

      ctx.restore();
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect(); };
  }, []); // eslint-disable-line

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full ${className}`}
      style={{ display: "block", ...style }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  WALLET DRAWING
// ─────────────────────────────────────────────────────────────────────────────

function drawWallet(
  ctx: CanvasRenderingContext2D,
  W: number, H: number, sc: number,
  pal: Palette, level: number, t: number,
) {
  // Wallet dimensions (centered at 0,0)
  const wW = sc * 0.88;
  const wH = sc * 0.60;
  const rr = sc * 0.065;       // corner radius
  const thick = sc * 0.038;    // 3D thickness offset

  // ── Shadow ──────────────────────────────────────────────────────────────
  ctx.save();
  ctx.shadowColor   = "rgba(0,0,0,0.45)";
  ctx.shadowBlur    = sc * 0.09;
  ctx.shadowOffsetX = thick * 0.6;
  ctx.shadowOffsetY = sc * 0.06;
  rRect(ctx, -wW / 2, -wH / 2, wW, wH, rr);
  ctx.fillStyle = "#000";
  ctx.fill();
  ctx.restore();

  // ── Back panel (slightly offset to give 3D depth) ──────────────────────
  const bOff = thick;  // how much the back shifts
  ctx.save();
  rRect(ctx, -wW / 2 + bOff, -wH / 2 - bOff, wW, wH, rr);
  const backG = ctx.createLinearGradient(-wW / 2, -wH / 2, wW / 2, wH / 2);
  backG.addColorStop(0, pal.body2);
  backG.addColorStop(1, pal.body3);
  ctx.fillStyle = backG;
  ctx.fill();

  // Back panel edge stroke
  ctx.strokeStyle = pal.stitch + "88";
  ctx.lineWidth   = sc * 0.008;
  ctx.stroke();

  // Bills peeking from the top of back panel
  drawBills(ctx, -wW / 2 + bOff, -wH / 2 - bOff - sc * 0.06, wW, sc, pal, t);

  ctx.restore();

  // ── Front panel (main face) ─────────────────────────────────────────────
  rRect(ctx, -wW / 2, -wH / 2, wW, wH, rr);
  const frontG = ctx.createLinearGradient(-wW / 2, -wH / 2, wW * 0.4, wH * 0.6);
  frontG.addColorStop(0, pal.body1);
  frontG.addColorStop(0.55, pal.body2);
  frontG.addColorStop(1, pal.body3);
  ctx.fillStyle = frontG;
  ctx.fill();

  // Front edge highlight (top-left rim light)
  ctx.save();
  const rimG = ctx.createLinearGradient(-wW / 2, -wH / 2, -wW / 2 + wW * 0.3, -wH / 2 + wH * 0.25);
  rimG.addColorStop(0, "rgba(255,255,255,0.18)");
  rimG.addColorStop(1, "rgba(255,255,255,0)");
  rRect(ctx, -wW / 2, -wH / 2, wW, wH, rr);
  ctx.fillStyle = rimG;
  ctx.fill();
  ctx.restore();

  // Leather texture (crosshatch)
  drawLeatherTexture(ctx, -wW / 2, -wH / 2, wW, wH, rr, sc, pal);

  // Stitch border
  ctx.save();
  const sp = sc * 0.038;
  rRect(ctx, -wW / 2 + sp, -wH / 2 + sp, wW - sp * 2, wH - sp * 2, rr * 0.55);
  ctx.strokeStyle = pal.stitch + "55";
  ctx.lineWidth   = sc * 0.007;
  ctx.setLineDash([sc * 0.025, sc * 0.02]);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // Outer border
  rRect(ctx, -wW / 2, -wH / 2, wW, wH, rr);
  ctx.strokeStyle = pal.stitch + "66";
  ctx.lineWidth   = sc * 0.009;
  if (level === 4) {
    ctx.shadowColor = pal.hw1;
    ctx.shadowBlur  = sc * 0.06;
  }
  ctx.stroke();
  ctx.shadowBlur = 0;

  // ── Fold crease (horizontal center line) ──────────────────────────────
  ctx.beginPath();
  ctx.moveTo(-wW / 2 + sc * 0.05, 0);
  ctx.lineTo(wW / 2 - sc * 0.05, 0);
  ctx.strokeStyle = pal.body3 + "cc";
  ctx.lineWidth   = sc * 0.012;
  ctx.stroke();

  // ── Cards peeking from top ────────────────────────────────────────────
  drawCards(ctx, -wW / 2, -wH / 2, wW, wH, sc, pal, level, rr);

  // ── Card slot panels on lower half ───────────────────────────────────
  drawCardSlots(ctx, -wW / 2, 0, wW, wH / 2, sc, pal, level, rr);

  // ── Snap clasp (center) ───────────────────────────────────────────────
  drawClasp(ctx, 0, 0, sc, pal, level, t);

  // ── Level shimmer sweep (level 4) ────────────────────────────────────
  if (level === 4) {
    const sx = ((t * 0.35 % 2) - 0.5) * wW;
    const sgW = wW * 0.22;
    const shimG = ctx.createLinearGradient(sx - sgW, 0, sx + sgW, 0);
    shimG.addColorStop(0, "transparent");
    shimG.addColorStop(0.5, "rgba(255,235,150,0.22)");
    shimG.addColorStop(1, "transparent");
    rRect(ctx, -wW / 2, -wH / 2, wW, wH, rr);
    ctx.fillStyle = shimG;
    ctx.fill();
  }
}

// ── Bills peeking from top of back panel ──────────────────────────────────────
function drawBills(
  ctx: CanvasRenderingContext2D,
  bx: number, by: number, bw: number,
  sc: number, pal: Palette, t: number
) {
  const billH = sc * 0.072;
  const billW = bw * 0.55;
  const startX = bx + bw * 0.22;
  const colors = [pal.billColor + "cc", pal.billColor + "99", pal.billColor + "66"];
  const offsets = [sc * 0.01 * Math.sin(t * 0.9), 0, sc * 0.008 * Math.cos(t * 1.1)];

  for (let i = colors.length - 1; i >= 0; i--) {
    const xOff = (i - 1) * sc * 0.018 + offsets[i];
    rRect(ctx, startX + xOff, by - billH + sc * 0.012 * i, billW, billH, sc * 0.015);
    ctx.fillStyle = colors[i];
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth   = sc * 0.006;
    ctx.stroke();
    // Bill line details
    ctx.beginPath();
    ctx.moveTo(startX + xOff + billW * 0.12, by - billH * 0.45 + sc * 0.012 * i);
    ctx.lineTo(startX + xOff + billW * 0.85, by - billH * 0.45 + sc * 0.012 * i);
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth   = sc * 0.005;
    ctx.stroke();
  }
}

// ── Cards peeking from top of front panel ────────────────────────────────────
function drawCards(
  ctx: CanvasRenderingContext2D,
  bx: number, by: number, bw: number, _bh: number,
  sc: number, pal: Palette, level: number, rr: number
) {
  if (level < 1) return;
  const cW = bw * 0.42;
  const cH = sc * 0.055;
  const cY = by - cH * 0.5;
  const cX = bx + bw * 0.08;

  // Card 2 (behind)
  if (level >= 2) {
    rRect(ctx, cX + sc * 0.025, cY + sc * 0.008, cW, cH, rr * 0.35);
    const c2G = ctx.createLinearGradient(cX, 0, cX + cW, 0);
    c2G.addColorStop(0, "#334155");
    c2G.addColorStop(1, "#1E293B");
    ctx.fillStyle = c2G;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.lineWidth   = sc * 0.005;
    ctx.stroke();
  }

  // Card 1 (front)
  rRect(ctx, cX, cY, cW, cH, rr * 0.35);
  const c1G = ctx.createLinearGradient(cX, cY, cX + cW, cY + cH);
  c1G.addColorStop(0, pal.cardA);
  c1G.addColorStop(1, pal.cardB);
  ctx.fillStyle = c1G;
  ctx.fill();
  // Card chip
  rRect(ctx, cX + cW * 0.1, cY + cH * 0.22, cW * 0.2, cH * 0.5, sc * 0.008);
  ctx.fillStyle = "rgba(255,220,100,0.6)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.lineWidth   = sc * 0.005;
  ctx.stroke();
}

// ── Card slot panels on lower half ───────────────────────────────────────────
function drawCardSlots(
  ctx: CanvasRenderingContext2D,
  bx: number, by: number, bw: number, bh: number,
  sc: number, pal: Palette, _level: number, rr: number
) {
  const pad  = sc * 0.05;
  const sH   = bh * 0.48;
  const sW   = bw * 0.42;

  // Left slot
  rRect(ctx, bx + pad, by + pad, sW, sH, rr * 0.4);
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.fill();
  ctx.strokeStyle = pal.stitch + "44";
  ctx.lineWidth   = sc * 0.007;
  ctx.stroke();

  // Right slot
  rRect(ctx, bx + bw - pad - sW, by + pad, sW, sH, rr * 0.4);
  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.fill();
  ctx.stroke();
}

// ── Leather texture ───────────────────────────────────────────────────────────
function drawLeatherTexture(
  ctx: CanvasRenderingContext2D,
  bx: number, by: number, bw: number, bh: number,
  rr: number, sc: number, pal: Palette
) {
  ctx.save();
  rRect(ctx, bx, by, bw, bh, rr);
  ctx.clip();
  ctx.globalAlpha = 0.045;
  ctx.strokeStyle = pal.stitch;
  ctx.lineWidth   = sc * 0.005;
  const step = sc * 0.055;
  for (let x = bx; x < bx + bw + step; x += step) {
    ctx.beginPath(); ctx.moveTo(x, by); ctx.lineTo(x - bh * 0.5, by + bh); ctx.stroke();
  }
  ctx.restore();
}

// ── Snap clasp ────────────────────────────────────────────────────────────────
function drawClasp(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, sc: number,
  pal: Palette, level: number, t: number
) {
  const outerR = sc * 0.042;
  const innerR = sc * 0.025;

  // Outer ring
  ctx.beginPath();
  ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
  const oG = ctx.createRadialGradient(cx - outerR * 0.3, cy - outerR * 0.3, 0, cx, cy, outerR);
  oG.addColorStop(0, pal.hw1);
  oG.addColorStop(1, pal.hw2);
  ctx.fillStyle = oG;
  if (level >= 3) {
    ctx.shadowColor = pal.hw1;
    ctx.shadowBlur  = sc * 0.04 + Math.sin(t * 2) * sc * 0.015;
  }
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = pal.hw1 + "88";
  ctx.lineWidth   = sc * 0.01;
  ctx.stroke();

  // Inner button
  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
  const iG = ctx.createRadialGradient(cx - innerR * 0.35, cy - innerR * 0.35, 0, cx, cy, innerR);
  iG.addColorStop(0, "rgba(255,255,255,0.5)");
  iG.addColorStop(1, pal.hw2 + "dd");
  ctx.fillStyle = iG;
  ctx.fill();
}

// ── Coin ─────────────────────────────────────────────────────────────────────
function drawCoin(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  r: number, flipFactor: number,
  pal: Palette, t: number, _level: number
) {
  const ry = r * flipFactor;
  const coinG = ctx.createRadialGradient(cx - r * 0.25, cy - r * 0.25, 0, cx, cy, r);
  coinG.addColorStop(0, "#FFF8D0");
  coinG.addColorStop(0.4, "#FFD700");
  coinG.addColorStop(1, "#A07800");
  ctx.beginPath();
  ctx.ellipse(cx, cy, r, Math.max(ry, 1), 0, 0, Math.PI * 2);
  ctx.fillStyle = coinG;
  ctx.shadowColor = "rgba(0,0,0,0.3)";
  ctx.shadowBlur  = r * 0.4;
  ctx.fill();
  ctx.shadowBlur  = 0;
  ctx.strokeStyle = "#C8A000cc";
  ctx.lineWidth   = r * 0.07;
  ctx.stroke();
  // ر symbol (riyal sign area)
  if (ry > r * 0.3) {
    ctx.font         = `bold ${r * 0.85}px "Tajawal", Arial`;
    ctx.fillStyle    = "#8A6800";
    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("ر", cx, cy + r * 0.05);
    ctx.textBaseline = "alphabetic";
  }
}

// ── Sparkle ───────────────────────────────────────────────────────────────────
function drawSparkle(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) {
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r * 2.5, cy + Math.sin(a) * r * 2.5);
    ctx.lineTo(cx + Math.cos(a + Math.PI) * r * 2.5, cy + Math.sin(a + Math.PI) * r * 2.5);
    ctx.strokeStyle = color;
    ctx.lineWidth   = r * 0.5;
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.7, 0, Math.PI * 2);
  ctx.fillStyle = "#FFF8D0";
  ctx.fill();
}

// ── Utilities ─────────────────────────────────────────────────────────────────
function rRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
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
