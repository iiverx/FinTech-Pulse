import { useEffect, useRef } from "react";

export function StellarPulse() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let raf: number;
    let t = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth * devicePixelRatio;
      canvas.height = canvas.offsetHeight * devicePixelRatio;
    };
    resize();
    window.addEventListener("resize", resize);

    // Particles
    type P = { x: number; y: number; vx: number; vy: number; r: number; hue: number; alpha: number };
    const particles: P[] = Array.from({ length: 180 }, () => ({
      x: Math.random(), y: Math.random(),
      vx: (Math.random() - 0.5) * 0.0006,
      vy: -(0.0004 + Math.random() * 0.0008),
      r: 0.8 + Math.random() * 2,
      hue: Math.random() > 0.5 ? 150 : 45,
      alpha: 0.4 + Math.random() * 0.6,
    }));

    // Orbiting investment nodes
    const orbitNodes = [
      { angle: 0,     speed: 0.008, dist: 0.30, label: "أسهم",   color: "#00ff88" },
      { angle: 2.1,   speed: 0.006, dist: 0.38, label: "صناديق", color: "#ffd700" },
      { angle: 4.2,   speed: 0.004, dist: 0.46, label: "عقارات", color: "#44aaff" },
    ];

    // EKG data
    const ekgData = [0, 0, 0.1, 0, 0, 0.3, 0, 0.8, -0.3, 0.15, 0, 0, -0.05, 0, 0, 0, 0.08, 0, 0, 0];

    const draw = () => {
      raf = requestAnimationFrame(draw);
      t += 0.016;
      const W = canvas.width, H = canvas.height;
      const cx = W / 2, cy = H * 0.48;
      const scale = Math.min(W, H);

      // Background
      ctx.fillStyle = "#030d1a";
      ctx.fillRect(0, 0, W, H);

      // Grid
      ctx.strokeStyle = "rgba(0,80,120,0.18)";
      ctx.lineWidth = 1;
      const gs = scale * 0.06;
      for (let x = 0; x < W; x += gs) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += gs) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      // Particles
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.y < -0.02) p.y = 1.05;
        if (p.x < 0) p.x = 1; if (p.x > 1) p.x = 0;
        ctx.beginPath();
        ctx.arc(p.x * W, p.y * H, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue},100%,65%,${p.alpha})`;
        ctx.fill();
      });

      // Orbit rings
      orbitNodes.forEach((node, i) => {
        node.angle += node.speed;
        const r = node.dist * scale;

        // Ring track
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = node.color + "22";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Node position
        const nx = cx + Math.cos(node.angle) * r;
        const ny = cy + Math.sin(node.angle) * r;

        // Glow trail
        for (let k = 1; k <= 8; k++) {
          const ta = node.angle - k * 0.12;
          const tx2 = cx + Math.cos(ta) * r;
          const ty2 = cy + Math.sin(ta) * r;
          ctx.beginPath();
          ctx.arc(tx2, ty2, 3, 0, Math.PI * 2);
          ctx.fillStyle = node.color + Math.floor((8 - k) * 28).toString(16).padStart(2, "0");
          ctx.fill();
        }

        // Node
        const grad = ctx.createRadialGradient(nx, ny, 0, nx, ny, 14);
        grad.addColorStop(0, node.color + "ff");
        grad.addColorStop(1, node.color + "00");
        ctx.beginPath(); ctx.arc(nx, ny, 14, 0, Math.PI * 2);
        ctx.fillStyle = grad; ctx.fill();
        ctx.beginPath(); ctx.arc(nx, ny, 6, 0, Math.PI * 2);
        ctx.fillStyle = node.color; ctx.fill();

        // Label
        ctx.font = `bold ${scale * 0.028}px 'Tajawal', Arial`;
        ctx.fillStyle = node.color;
        ctx.textAlign = "center";
        ctx.fillText(node.label, nx, ny - 18);
      });

      // ── Central orb ──────────────────────────────────────────────────────
      const pulse = 1 + Math.sin(t * 2.2) * 0.08 + Math.pow(Math.max(0, Math.sin(t * 2.2)), 8) * 0.12;
      const OR = scale * 0.13 * pulse;

      // Outer glow rings
      for (let g = 3; g >= 0; g--) {
        const gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, OR * (1.4 + g * 0.35));
        gr.addColorStop(0, `rgba(0,255,136,${0.06 - g * 0.01})`);
        gr.addColorStop(1, "transparent");
        ctx.beginPath(); ctx.arc(cx, cy, OR * (1.4 + g * 0.35), 0, Math.PI * 2);
        ctx.fillStyle = gr; ctx.fill();
      }

      // Orb body
      const orbGrad = ctx.createRadialGradient(cx - OR * 0.3, cy - OR * 0.3, 0, cx, cy, OR);
      orbGrad.addColorStop(0, "#aaffdd");
      orbGrad.addColorStop(0.4, "#00cc88");
      orbGrad.addColorStop(1, "#003322");
      ctx.beginPath(); ctx.arc(cx, cy, OR, 0, Math.PI * 2);
      ctx.fillStyle = orbGrad; ctx.fill();

      // Highlight
      const hl = ctx.createRadialGradient(cx - OR * 0.35, cy - OR * 0.35, 0, cx, cy, OR * 0.8);
      hl.addColorStop(0, "rgba(255,255,255,0.4)");
      hl.addColorStop(1, "transparent");
      ctx.beginPath(); ctx.arc(cx, cy, OR, 0, Math.PI * 2);
      ctx.fillStyle = hl; ctx.fill();

      // EKG line across the orb
      const ekgW = OR * 1.8;
      const ekgOffset = (t * 40) % (ekgData.length * ekgW / ekgData.length);
      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, OR * 0.98, 0, Math.PI * 2); ctx.clip();
      ctx.strokeStyle = "#00ff88";
      ctx.lineWidth = scale * 0.005;
      ctx.shadowColor = "#00ff88"; ctx.shadowBlur = 8;
      ctx.beginPath();
      ekgData.forEach((v, i) => {
        const ex = cx - ekgW / 2 + (i / (ekgData.length - 1)) * ekgW - ekgOffset;
        const ey = cy + v * OR * 0.6;
        i === 0 ? ctx.moveTo(ex, ey) : ctx.lineTo(ex, ey);
      });
      ctx.stroke();
      ctx.restore();
      ctx.shadowBlur = 0;

      // ── Rising price bars (bottom) ───────────────────────────────────────
      const barCount = 14;
      const barData = Array.from({ length: barCount }, (_, i) =>
        0.2 + 0.6 * (0.5 + 0.5 * Math.sin(i * 0.8 + t * 0.3))
      );
      const bW = W * 0.7 / barCount;
      const bX0 = W * 0.15;
      const bY0 = H * 0.88;
      barData.forEach((v, i) => {
        const bh = v * H * 0.12;
        const bx = bX0 + i * bW;
        const col = v > 0.5 ? "#00ff88" : "#ff4466";
        const g = ctx.createLinearGradient(bx, bY0 - bh, bx, bY0);
        g.addColorStop(0, col + "cc");
        g.addColorStop(1, col + "22");
        ctx.fillStyle = g;
        ctx.fillRect(bx + 2, bY0 - bh, bW - 4, bh);
      });

      // ── Trend line ────────────────────────────────────────────────────────
      const trendPts: [number, number][] = [
        [W * 0.08, H * 0.82], [W * 0.2, H * 0.75], [W * 0.32, H * 0.72],
        [W * 0.44, H * 0.68], [W * 0.56, H * 0.6], [W * 0.68, H * 0.55],
        [W * 0.8, H * 0.45], [W * 0.9, H * 0.35 + Math.sin(t) * H * 0.02],
      ];
      ctx.beginPath();
      trendPts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
      ctx.strokeStyle = "#00ff88";
      ctx.lineWidth = scale * 0.006;
      ctx.shadowColor = "#00ff88"; ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Arrow at end of trend
      const [ax, ay] = trendPts[trendPts.length - 1];
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(ax - 14, ay + 10);
      ctx.lineTo(ax - 14, ay - 10);
      ctx.closePath();
      ctx.fillStyle = "#00ff88";
      ctx.fill();

      // ── Title / label ─────────────────────────────────────────────────────
      ctx.textAlign = "center";
      ctx.font = `bold ${scale * 0.045}px 'Tajawal', Arial`;
      ctx.fillStyle = "#ffffff";
      ctx.fillText("نبض | Pulse", W / 2, H * 0.1);
      ctx.font = `${scale * 0.028}px 'Tajawal', Arial`;
      ctx.fillStyle = "#00ff8899";
      ctx.fillText("المؤشر المالي الذكي", W / 2, H * 0.155);

      // Percentage badge
      const pct = (78 + Math.sin(t * 0.5) * 2).toFixed(0);
      ctx.font = `bold ${scale * 0.06}px 'Tajawal', Arial`;
      ctx.fillStyle = "#00ff88";
      ctx.fillText(pct, cx, cy + OR * 0.15);
      ctx.font = `${scale * 0.024}px 'Tajawal', Arial`;
      ctx.fillStyle = "#ffffff99";
      ctx.fillText("من 100", cx, cy + OR * 0.35);
    };

    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  return (
    <div style={{ width: "100%", height: "100vh", background: "#030d1a", position: "relative" }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
    </div>
  );
}
