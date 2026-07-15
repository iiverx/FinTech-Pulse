import { useEffect, useRef } from "react";

export function AscentWave() {
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

    // Candlestick data (static but animated reveal)
    const candles = Array.from({ length: 28 }, (_, i) => {
      const base = 0.28 + (i / 28) * 0.5 + Math.sin(i * 0.7) * 0.1;
      const h = 0.04 + Math.random() * 0.1;
      return { open: base, close: base + (Math.random() - 0.35) * h, high: base + h * 0.6, low: base - h * 0.4 };
    });

    // Floating data nodes
    const nodes = Array.from({ length: 12 }, (_, i) => ({
      x: 0.1 + (i / 12) * 0.8,
      y: 0.7 - (i / 12) * 0.45,
      phase: i * 0.5,
      size: 5 + (i % 3) * 3,
      val: `+${(8 + i * 1.4).toFixed(1)}%`,
    }));

    const draw = () => {
      raf = requestAnimationFrame(draw);
      t += 0.016;
      const W = canvas.width, H = canvas.height;
      const scale = Math.min(W, H);

      // Deep dark background
      ctx.fillStyle = "#040f0f";
      ctx.fillRect(0, 0, W, H);

      // Hex grid background
      ctx.strokeStyle = "rgba(0,200,150,0.07)";
      ctx.lineWidth = 1;
      const hs = scale * 0.07;
      const hr = hs / Math.sqrt(3);
      for (let row = -1; row < H / (hs * 1.5) + 1; row++) {
        for (let col = -1; col < W / hs + 1; col++) {
          const hx = col * hs + (row % 2) * hs * 0.5;
          const hy = row * hs * 1.5 * 0.577;
          ctx.beginPath();
          for (let k = 0; k < 6; k++) {
            const a = (k / 6) * Math.PI * 2 - Math.PI / 6;
            const px = hx + Math.cos(a) * hr;
            const py = hy + Math.sin(a) * hr;
            k === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
          }
          ctx.closePath(); ctx.stroke();
        }
      }

      // ── Candlestick chart ─────────────────────────────────────────────────
      const chartX = W * 0.08;
      const chartW = W * 0.84;
      const chartY = H * 0.82;
      const chartH = H * 0.48;
      const cw = chartW / candles.length;

      candles.forEach((c, i) => {
        const reveal = Math.min(1, (t * 1.4 - i * 0.08));
        if (reveal <= 0) return;

        const x = chartX + i * cw + cw * 0.2;
        const bodyH = Math.abs(c.close - c.open) * chartH * reveal;
        const bullish = c.close > c.open;
        const col = bullish ? "#00ff88" : "#ff4466";

        const openY = chartY - c.open * chartH;
        const closeY = chartY - c.close * chartH;
        const highY = chartY - c.high * chartH * reveal;
        const lowY = chartY - c.low * chartH * reveal;

        // Wick
        ctx.beginPath();
        ctx.moveTo(x + cw * 0.3, highY); ctx.lineTo(x + cw * 0.3, lowY);
        ctx.strokeStyle = col + "88"; ctx.lineWidth = 1.5; ctx.stroke();

        // Body
        const g = ctx.createLinearGradient(x, Math.min(openY, closeY), x, Math.max(openY, closeY));
        g.addColorStop(0, col + "ee");
        g.addColorStop(1, col + "44");
        ctx.fillStyle = g;
        ctx.fillRect(x, Math.min(openY, closeY), cw * 0.6, Math.max(bodyH, 2));
      });

      // ── Mountain / area chart ─────────────────────────────────────────────
      const areaPts: [number, number][] = Array.from({ length: 60 }, (_, i) => {
        const prog = i / 59;
        const noise = Math.sin(i * 0.4 + t * 0.5) * 0.04 + Math.sin(i * 0.9 + t * 0.3) * 0.02;
        return [
          W * 0.06 + prog * W * 0.88,
          H * 0.78 - (prog * 0.52 + noise) * H * 0.65,
        ];
      });

      // Fill area
      ctx.beginPath();
      ctx.moveTo(areaPts[0][0], H * 0.92);
      areaPts.forEach(([x, y]) => ctx.lineTo(x, y));
      ctx.lineTo(areaPts[areaPts.length - 1][0], H * 0.92);
      ctx.closePath();
      const areaGrad = ctx.createLinearGradient(0, H * 0.2, 0, H * 0.92);
      areaGrad.addColorStop(0, "rgba(0,255,160,0.22)");
      areaGrad.addColorStop(0.6, "rgba(0,180,120,0.1)");
      areaGrad.addColorStop(1, "rgba(0,100,80,0.02)");
      ctx.fillStyle = areaGrad; ctx.fill();

      // Line
      ctx.beginPath();
      areaPts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
      ctx.strokeStyle = "#00ffaa";
      ctx.lineWidth = scale * 0.007;
      ctx.shadowColor = "#00ffaa"; ctx.shadowBlur = 18;
      ctx.stroke(); ctx.shadowBlur = 0;

      // Animated dot at end of line
      const [ex, ey] = areaPts[areaPts.length - 1];
      const dotPulse = 1 + Math.sin(t * 3) * 0.3;
      for (let r = 3; r >= 0; r--) {
        ctx.beginPath(); ctx.arc(ex, ey, (r + 1) * 7 * dotPulse, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,255,170,${0.08 - r * 0.02})`; ctx.fill();
      }
      ctx.beginPath(); ctx.arc(ex, ey, 6, 0, Math.PI * 2);
      ctx.fillStyle = "#00ffaa"; ctx.fill();

      // ── Floating data nodes ───────────────────────────────────────────────
      nodes.forEach((node, i) => {
        const nx = node.x * W;
        const ny = node.y * H + Math.sin(t * 0.7 + node.phase) * H * 0.015;
        const s = node.size;

        // Connection lines to next node
        if (i < nodes.length - 1) {
          const nx2 = nodes[i + 1].x * W;
          const ny2 = nodes[i + 1].y * H + Math.sin(t * 0.7 + nodes[i + 1].phase) * H * 0.015;
          const g = ctx.createLinearGradient(nx, ny, nx2, ny2);
          g.addColorStop(0, "#00ff8844"); g.addColorStop(1, "#00ff88aa");
          ctx.beginPath(); ctx.moveTo(nx, ny); ctx.lineTo(nx2, ny2);
          ctx.strokeStyle = g; ctx.lineWidth = 1.5;
          ctx.shadowColor = "#00ff88"; ctx.shadowBlur = 6;
          ctx.stroke(); ctx.shadowBlur = 0;
        }

        // Node glow
        const ng = ctx.createRadialGradient(nx, ny, 0, nx, ny, s * 3);
        ng.addColorStop(0, "#00ffaa66"); ng.addColorStop(1, "transparent");
        ctx.fillStyle = ng; ctx.beginPath(); ctx.arc(nx, ny, s * 3, 0, Math.PI * 2); ctx.fill();

        // Node dot
        ctx.beginPath(); ctx.arc(nx, ny, s, 0, Math.PI * 2);
        ctx.fillStyle = "#00ffaa"; ctx.fill();

        // Value label
        ctx.font = `bold ${scale * 0.022}px 'Tajawal', Arial`;
        ctx.fillStyle = "#00ffaacc";
        ctx.textAlign = "center";
        ctx.fillText(node.val, nx, ny - s - 6);
      });

      // ── Shooting particles along trend ────────────────────────────────────
      for (let p = 0; p < 5; p++) {
        const prog = ((t * 0.25 + p * 0.2) % 1);
        const pidx = Math.floor(prog * (areaPts.length - 1));
        if (pidx < areaPts.length - 1) {
          const [px, py] = areaPts[pidx];
          ctx.beginPath(); ctx.arc(px, py, 3 + Math.sin(t * 3 + p) * 1.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0,255,170,${0.8 - prog * 0.3})`;
          ctx.fill();
        }
      }

      // ── Title ─────────────────────────────────────────────────────────────
      ctx.textAlign = "center";
      ctx.font = `bold ${scale * 0.046}px 'Tajawal', Arial`;
      ctx.fillStyle = "#ffffff";
      ctx.fillText("خارطة النمو", W / 2, H * 0.095);
      ctx.font = `${scale * 0.027}px 'Tajawal', Arial`;
      ctx.fillStyle = "#00ffaa88";
      ctx.fillText("تتبع استثماراتك لحظةً بلحظة", W / 2, H * 0.148);

      // Big number top right
      const idx = (78 + Math.sin(t * 0.4) * 3).toFixed(0);
      ctx.textAlign = "right";
      ctx.font = `bold ${scale * 0.085}px 'Tajawal', Arial`;
      ctx.fillStyle = "#00ffaa";
      ctx.shadowColor = "#00ffaa"; ctx.shadowBlur = 16;
      ctx.fillText(idx, W * 0.94, H * 0.23);
      ctx.shadowBlur = 0;
      ctx.font = `${scale * 0.025}px 'Tajawal', Arial`;
      ctx.fillStyle = "#ffffff66";
      ctx.fillText("مؤشر النبض", W * 0.94, H * 0.27);

      // Grid lines subtle
      ctx.strokeStyle = "rgba(0,255,136,0.08)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 8]);
      for (let g = 1; g <= 4; g++) {
        const gy = H * (0.88 - g * 0.16);
        ctx.beginPath(); ctx.moveTo(W * 0.06, gy); ctx.lineTo(W * 0.94, gy); ctx.stroke();
      }
      ctx.setLineDash([]);
    };

    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  return (
    <div style={{ width: "100%", height: "100vh", background: "#040f0f" }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
    </div>
  );
}
