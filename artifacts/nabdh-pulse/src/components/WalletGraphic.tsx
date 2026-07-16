import React, { useEffect, useRef } from "react";

interface WalletGraphicProps {
  level: 1 | 2 | 3 | 4;
  pulse?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

interface Palette {
  bg0: string; bg1: string; bg2: string;
  accent: string; glow: string; ring: string;
  particle: string; name: string;
}

const PALETTES: Record<1|2|3|4, Palette> = {
  1: { bg0:"#0F172A", bg1:"#1E3A5F", bg2:"#1E40AF",   accent:"#60A5FA", glow:"rgba(96,165,250,0.55)",  ring:"#3B82F6", particle:"#93C5FD", name:"مبتدئة" },
  2: { bg0:"#1A0533", bg1:"#4C1D95", bg2:"#7C3AED",   accent:"#A78BFA", glow:"rgba(167,139,250,0.55)", ring:"#8B5CF6", particle:"#C4B5FD", name:"نشطة"   },
  3: { bg0:"#052E16", bg1:"#065F46", bg2:"#059669",   accent:"#34D399", glow:"rgba(52,211,153,0.55)",  ring:"#10B981", particle:"#6EE7B7", name:"ذهبية"   },
  4: { bg0:"#1C1100", bg1:"#78350F", bg2:"#D97706",   accent:"#FCD34D", glow:"rgba(252,211,77,0.7)",   ring:"#F59E0B", particle:"#FDE68A", name:"فاخرة"   },
};

// Particle type
interface Particle { x:number; y:number; vx:number; vy:number; r:number; a:number; va:number; }

export function WalletGraphic({ level, pulse = true, className = "", style }: WalletGraphicProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);
  const levelRef  = useRef(level);
  const particles = useRef<Particle[]>([]);

  useEffect(() => { levelRef.current = level; }, [level]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx    = canvas.getContext("2d")!;
    let t = 0;

    const resize = () => {
      canvas.width  = canvas.offsetWidth  * devicePixelRatio;
      canvas.height = canvas.offsetHeight * devicePixelRatio;
      spawnParticles();
    };

    function spawnParticles() {
      const W = canvas.width, H = canvas.height;
      particles.current = Array.from({ length: 28 }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 2.5 + 0.8,
        a: Math.random(),
        va: (Math.random() - 0.5) * 0.012,
      }));
    }

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      t += 0.016;

      const W = canvas.width, H = canvas.height;
      const pal = PALETTES[levelRef.current];

      ctx.clearRect(0, 0, W, H);

      // ── Background mesh gradient ─────────────────────────────────────
      const bgG = ctx.createLinearGradient(0, 0, W, H);
      bgG.addColorStop(0, pal.bg0);
      bgG.addColorStop(0.5, pal.bg1);
      bgG.addColorStop(1, pal.bg2);
      roundRectPath(ctx, 0, 0, W, H, Math.min(W, H) * 0.06);
      ctx.fillStyle = bgG;
      ctx.fill();

      // ── Radial accent orb (top-left) ─────────────────────────────────
      const orbR = W * 0.55 + Math.sin(t * 0.7) * W * 0.04;
      const orbG = ctx.createRadialGradient(W * 0.15, H * 0.2, 0, W * 0.15, H * 0.2, orbR);
      orbG.addColorStop(0, pal.bg2 + "88");
      orbG.addColorStop(1, "transparent");
      ctx.fillStyle = orbG;
      ctx.fillRect(0, 0, W, H);

      // ── Second orb (bottom-right) ────────────────────────────────────
      const orb2G = ctx.createRadialGradient(W * 0.85, H * 0.82, 0, W * 0.85, H * 0.82, W * 0.45);
      orb2G.addColorStop(0, pal.accent + "44");
      orb2G.addColorStop(1, "transparent");
      ctx.fillStyle = orb2G;
      ctx.fillRect(0, 0, W, H);

      // ── Grid / circuit lines ─────────────────────────────────────────
      drawGrid(ctx, W, H, pal, t, levelRef.current);

      // ── Particles ────────────────────────────────────────────────────
      for (const p of particles.current) {
        p.x += p.vx; p.y += p.vy;
        p.a += p.va;
        if (p.a < 0) p.a = 0.8;
        if (p.a > 1) p.a = 0.2;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = pal.particle + Math.round(p.a * 255).toString(16).padStart(2, "0");
        ctx.fill();
      }

      // ── Card body (subtle 3D tilt) ───────────────────────────────────
      const tiltX = pulse ? Math.sin(t * 0.8) * 0.012 : 0;
      const tiltY = pulse ? Math.cos(t * 0.6) * 0.008 : 0;
      ctx.save();
      ctx.transform(1, tiltY, tiltX, 1, 0, 0);

      // Glow border
      ctx.save();
      ctx.shadowColor = pal.glow;
      ctx.shadowBlur  = Math.min(W, H) * (0.06 + Math.sin(t * 1.2) * 0.02);
      roundRectPath(ctx, 0, 0, W, H, Math.min(W, H) * 0.06);
      ctx.strokeStyle = pal.accent + "99";
      ctx.lineWidth   = 1.5 * devicePixelRatio;
      ctx.stroke();
      ctx.restore();

      // ── Holographic shimmer band ──────────────────────────────────────
      const shimPos = ((t * 0.28) % 1.6) - 0.3;
      const shimX   = shimPos * W;
      const shimW   = W * 0.25;
      const shimG   = ctx.createLinearGradient(shimX - shimW, 0, shimX + shimW, 0);
      shimG.addColorStop(0,   "transparent");
      shimG.addColorStop(0.4, pal.accent + "22");
      shimG.addColorStop(0.5, pal.accent + "55");
      shimG.addColorStop(0.6, pal.accent + "22");
      shimG.addColorStop(1,   "transparent");
      roundRectPath(ctx, 0, 0, W, H, Math.min(W, H) * 0.06);
      ctx.fillStyle = shimG;
      ctx.fill();

      // ── Top-left: logo chip area ──────────────────────────────────────
      const chipS = Math.min(W, H) * 0.14;
      const chipX = W * 0.07, chipY = H * 0.12;
      drawChip(ctx, chipX, chipY, chipS, pal);

      // ── Circular progress ring ────────────────────────────────────────
      const ringR  = Math.min(W, H) * 0.16;
      const ringX  = W * 0.78, ringY = H * 0.38;
      const pct    = levelRef.current / 4;
      drawProgressRing(ctx, ringX, ringY, ringR, pct, pal, t);

      // ── Wave line (EKG / pulse) ───────────────────────────────────────
      drawPulseLine(ctx, W, H, pal, t);

      // ── Level badge ───────────────────────────────────────────────────
      const badgeX = W * 0.07, badgeY = H * 0.68;
      ctx.font      = `bold ${H * 0.1}px "Tajawal", Arial`;
      ctx.fillStyle = pal.accent;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.shadowColor  = pal.glow;
      ctx.shadowBlur   = 12;
      ctx.fillText(`المستوى ${levelRef.current}`, badgeX, badgeY);
      ctx.shadowBlur = 0;
      ctx.textBaseline = "alphabetic";

      // ── Dots row (like card number placeholder) ───────────────────────
      drawDotRow(ctx, W * 0.07, H * 0.82, W, H, pal);

      ctx.restore();
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect(); };
  }, []); // eslint-disable-line

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full ${className}`}
      style={{ display: "block", borderRadius: "1rem", ...style }}
    />
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
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

function drawGrid(ctx: CanvasRenderingContext2D, W: number, H: number, pal: Palette, t: number, level: number) {
  if (level < 2) return;
  const step = W * 0.12;
  ctx.save();
  ctx.globalAlpha = 0.12 + 0.04 * Math.sin(t * 0.5);
  ctx.strokeStyle = pal.accent;
  ctx.lineWidth   = 0.5 * devicePixelRatio;

  // Vertical lines
  for (let x = 0; x < W; x += step) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  // Horizontal lines
  for (let y = 0; y < H; y += step) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // Circuit nodes at intersections (level 3+)
  if (level >= 3) {
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = pal.particle;
    for (let x = step; x < W; x += step * 2) {
      for (let y = step; y < H; y += step * 2) {
        ctx.beginPath();
        ctx.arc(x, y, 2 * devicePixelRatio, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.restore();
}

function drawChip(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, pal: Palette) {
  // SIM chip look
  const chipG = ctx.createLinearGradient(x, y, x + s, y + s * 0.7);
  chipG.addColorStop(0, pal.accent + "cc");
  chipG.addColorStop(1, pal.ring + "66");
  roundRectPath(ctx, x, y, s, s * 0.7, s * 0.1);
  ctx.fillStyle = chipG;
  ctx.fill();

  // Chip grooves
  ctx.strokeStyle = pal.bg0 + "99";
  ctx.lineWidth   = s * 0.07;
  // Vertical center
  ctx.beginPath(); ctx.moveTo(x + s * 0.5, y + s * 0.08); ctx.lineTo(x + s * 0.5, y + s * 0.62); ctx.stroke();
  // Horizontal middle
  ctx.beginPath(); ctx.moveTo(x + s * 0.1, y + s * 0.35); ctx.lineTo(x + s * 0.9, y + s * 0.35); ctx.stroke();
}

function drawProgressRing(
  ctx: CanvasRenderingContext2D, cx: number, cy: number,
  r: number, pct: number, pal: Palette, t: number
) {
  const start = -Math.PI / 2;
  const end   = start + Math.PI * 2 * pct;

  // Track
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = pal.accent + "22";
  ctx.lineWidth   = r * 0.18;
  ctx.stroke();

  // Fill
  ctx.save();
  ctx.shadowColor = pal.glow;
  ctx.shadowBlur  = r * 0.5;
  ctx.beginPath();
  ctx.arc(cx, cy, r, start, end);
  ctx.strokeStyle = pal.ring;
  ctx.lineWidth   = r * 0.18;
  ctx.lineCap     = "round";
  ctx.stroke();
  ctx.restore();

  // Dot at tip
  const tipX = cx + Math.cos(end) * r;
  const tipY = cy + Math.sin(end) * r;
  ctx.beginPath();
  ctx.arc(tipX, tipY, r * 0.14, 0, Math.PI * 2);
  ctx.fillStyle = pal.accent;
  ctx.fill();

  // Center icon
  const pulse = 1 + Math.sin(t * 2) * 0.08;
  ctx.font      = `bold ${r * 0.55 * pulse}px Arial`;
  ctx.fillStyle = pal.accent;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor  = pal.glow;
  ctx.shadowBlur   = 10;
  ctx.fillText("◈", cx, cy);
  ctx.shadowBlur = 0;
  ctx.textBaseline = "alphabetic";
}

function drawPulseLine(ctx: CanvasRenderingContext2D, W: number, H: number, pal: Palette, t: number) {
  const y0 = H * 0.55;
  const amp = H * 0.06;
  const freq = W * 0.018;

  ctx.save();
  ctx.shadowColor = pal.glow;
  ctx.shadowBlur  = 8;
  ctx.strokeStyle = pal.accent + "bb";
  ctx.lineWidth   = 1.2 * devicePixelRatio;
  ctx.beginPath();

  for (let x = 0; x <= W * 0.65; x += 2) {
    const phase = x / freq - t * 3;
    // EKG-style: mostly flat with sharp spike
    let dy = 0;
    const mod = ((phase % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    if (mod > 1.5 && mod < 2.5) {
      dy = -amp * 2.5 * Math.sin((mod - 1.5) * Math.PI);
    } else if (mod > 2.5 && mod < 3.2) {
      dy = amp * 1.2 * Math.sin((mod - 2.5) * Math.PI / 0.7);
    } else {
      dy = amp * 0.15 * Math.sin(phase * 0.5);
    }
    if (x === 0) ctx.moveTo(x, y0 + dy);
    else ctx.lineTo(x, y0 + dy);
  }
  ctx.stroke();
  ctx.restore();
}

function drawDotRow(ctx: CanvasRenderingContext2D, x: number, y: number, W: number, H: number, pal: Palette) {
  const r = H * 0.022, gap = H * 0.065;
  for (let i = 0; i < 12; i++) {
    ctx.beginPath();
    ctx.arc(x + i * gap, y, r, 0, Math.PI * 2);
    ctx.fillStyle = i < 4 ? pal.accent + "dd" : pal.accent + "44";
    ctx.fill();
  }
}
