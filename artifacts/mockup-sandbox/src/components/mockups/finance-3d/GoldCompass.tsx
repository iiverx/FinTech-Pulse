import { useEffect, useRef } from "react";

export function GoldCompass() {
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

    const drawRing = (
      cx: number, cy: number, r: number,
      angle: number, tilt: number,
      color: string, lineW: number,
      label?: string, labelColor?: string
    ) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      ctx.scale(1, Math.sin(tilt + Math.PI / 2) * 0.6 + 0.15);

      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = lineW;
      ctx.shadowColor = color;
      ctx.shadowBlur = lineW * 4;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Tick marks on ring
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const x1 = Math.cos(a) * (r - lineW * 2);
        const y1 = Math.sin(a) * (r - lineW * 2);
        const x2 = Math.cos(a) * (r + lineW * 2);
        const y2 = Math.sin(a) * (r + lineW * 2);
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
        ctx.strokeStyle = color + "88";
        ctx.lineWidth = lineW * 0.6;
        ctx.stroke();
      }

      if (label) {
        ctx.rotate(-angle);
        ctx.scale(1, 1 / (Math.sin(tilt + Math.PI / 2) * 0.6 + 0.15));
        ctx.font = `bold ${r * 0.14}px 'Tajawal', Arial`;
        ctx.fillStyle = labelColor || color;
        ctx.textAlign = "center";
        ctx.fillText(label, r * 0.62, 0);
      }
      ctx.restore();
    };

    const drawSpoke = (cx: number, cy: number, r: number, angle: number, color: string) => {
      const x1 = cx + Math.cos(angle) * r * 0.08;
      const y1 = cy + Math.sin(angle) * r * 0.08;
      const x2 = cx + Math.cos(angle) * r * 0.88;
      const y2 = cy + Math.sin(angle) * r * 0.88;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.shadowColor = color; ctx.shadowBlur = 6;
      ctx.stroke(); ctx.shadowBlur = 0;
    };

    const draw = () => {
      raf = requestAnimationFrame(draw);
      t += 0.014;
      const W = canvas.width, H = canvas.height;
      const cx = W / 2, cy = H * 0.5;
      const scale = Math.min(W, H);
      const R = scale * 0.34;

      // Background gradient
      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.7);
      bg.addColorStop(0, "#0d1428");
      bg.addColorStop(0.5, "#080e1e");
      bg.addColorStop(1, "#020610");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Subtle star field
      ctx.fillStyle = "rgba(255,220,100,0.6)";
      for (let i = 0; i < 60; i++) {
        const sx = ((i * 137.5 + 20) % W);
        const sy = ((i * 97.3 + 50) % H);
        const sr = 0.6 + (i % 3) * 0.4;
        ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fill();
      }

      // ── Gyroscope rings ──────────────────────────────────────────────────
      // Outer ring — gold
      drawRing(cx, cy, R, t * 0.3, Math.PI * 0.12, "#ffd700", 3, "أسهم النمو", "#ffd700");
      // Mid ring — rose gold
      drawRing(cx, cy, R * 0.76, t * -0.45 + 1, Math.PI * 0.45, "#e8a060", 2.5, "السندات", "#e8a060");
      // Inner ring — silver-blue
      drawRing(cx, cy, R * 0.55, t * 0.6 + 2, Math.PI * 0.7, "#88ccff", 2, "العقارات", "#88ccff");

      // Cross spokes
      for (let s = 0; s < 4; s++) {
        drawSpoke(cx, cy, R, t * 0.3 + (s * Math.PI) / 2, "rgba(255,215,0,0.25)");
      }

      // ── Outer glow ───────────────────────────────────────────────────────
      const glow = ctx.createRadialGradient(cx, cy, R * 0.4, cx, cy, R * 1.2);
      glow.addColorStop(0, "rgba(255,215,0,0.0)");
      glow.addColorStop(0.5, "rgba(255,215,0,0.04)");
      glow.addColorStop(1, "rgba(255,215,0,0.0)");
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(cx, cy, R * 1.2, 0, Math.PI * 2); ctx.fill();

      // ── Central gem / orb ────────────────────────────────────────────────
      const pulse = 1 + Math.sin(t * 1.8) * 0.05;
      const OR = R * 0.18 * pulse;

      const orbG = ctx.createRadialGradient(cx - OR * 0.3, cy - OR * 0.3, 0, cx, cy, OR);
      orbG.addColorStop(0, "#fffacc");
      orbG.addColorStop(0.4, "#ffd700");
      orbG.addColorStop(0.75, "#c87000");
      orbG.addColorStop(1, "#3a1a00");
      ctx.beginPath(); ctx.arc(cx, cy, OR, 0, Math.PI * 2);
      ctx.fillStyle = orbG; ctx.fill();

      // Facets
      for (let f = 0; f < 8; f++) {
        const fa = (f / 8) * Math.PI * 2 + t * 0.5;
        const fx1 = cx + Math.cos(fa) * OR * 0.1;
        const fy1 = cy + Math.sin(fa) * OR * 0.1;
        const fx2 = cx + Math.cos(fa) * OR * 0.9;
        const fy2 = cy + Math.sin(fa) * OR * 0.9;
        ctx.beginPath(); ctx.moveTo(fx1, fy1); ctx.lineTo(fx2, fy2);
        ctx.strokeStyle = "rgba(255,255,200,0.25)"; ctx.lineWidth = 1.5; ctx.stroke();
      }

      ctx.beginPath(); ctx.arc(cx, cy, OR, 0, Math.PI * 2);
      ctx.strokeStyle = "#ffd700"; ctx.lineWidth = 2;
      ctx.shadowColor = "#ffd700"; ctx.shadowBlur = 16;
      ctx.stroke(); ctx.shadowBlur = 0;

      // ── Rising arrow ─────────────────────────────────────────────────────
      const arrowH = R * 0.5;
      const arrowY = cy - OR - arrowH;
      const arrowX = cx;
      const arrowPulse = Math.sin(t * 1.8) * 8;
      ctx.beginPath();
      ctx.moveTo(arrowX, arrowY - arrowPulse);
      ctx.lineTo(arrowX - R * 0.08, arrowY + arrowH * 0.35 - arrowPulse);
      ctx.lineTo(arrowX - R * 0.03, arrowY + arrowH * 0.35 - arrowPulse);
      ctx.lineTo(arrowX - R * 0.03, cy - OR);
      ctx.lineTo(arrowX + R * 0.03, cy - OR);
      ctx.lineTo(arrowX + R * 0.03, arrowY + arrowH * 0.35 - arrowPulse);
      ctx.lineTo(arrowX + R * 0.08, arrowY + arrowH * 0.35 - arrowPulse);
      ctx.closePath();
      const arrowGrad = ctx.createLinearGradient(arrowX, arrowY, arrowX, cy);
      arrowGrad.addColorStop(0, "#ffd700");
      arrowGrad.addColorStop(1, "#ffd70044");
      ctx.fillStyle = arrowGrad;
      ctx.shadowColor = "#ffd700"; ctx.shadowBlur = 20;
      ctx.fill(); ctx.shadowBlur = 0;

      // ── Return % badge ───────────────────────────────────────────────────
      const ret = (12.4 + Math.sin(t * 0.6) * 0.8).toFixed(1);
      ctx.textAlign = "center";
      ctx.font = `bold ${scale * 0.055}px 'Tajawal', Arial`;
      ctx.fillStyle = "#ffd700";
      ctx.shadowColor = "#ffd700"; ctx.shadowBlur = 10;
      ctx.fillText(`+${ret}%`, cx, cy + R * 0.65);
      ctx.shadowBlur = 0;
      ctx.font = `${scale * 0.026}px 'Tajawal', Arial`;
      ctx.fillStyle = "#e8a06099";
      ctx.fillText("عائد المحفظة", cx, cy + R * 0.82);

      // ── Title ─────────────────────────────────────────────────────────────
      ctx.font = `bold ${scale * 0.046}px 'Tajawal', Arial`;
      ctx.fillStyle = "#ffd700";
      ctx.shadowColor = "#ffd700"; ctx.shadowBlur = 8;
      ctx.fillText("بوصلة الاستثمار", W / 2, H * 0.1);
      ctx.shadowBlur = 0;
      ctx.font = `${scale * 0.027}px 'Tajawal', Arial`;
      ctx.fillStyle = "#e8a06088";
      ctx.fillText("ثلاث محاور، رؤية واحدة", W / 2, H * 0.153);

      // Corner stats
      const stats = [
        { label: "أسهم", val: "45%", x: W * 0.14, y: H * 0.3 },
        { label: "صناديق", val: "35%", x: W * 0.86, y: H * 0.3 },
        { label: "عقارات", val: "20%", x: W * 0.86, y: H * 0.68 },
      ];
      stats.forEach(({ label, val, x, y }) => {
        ctx.font = `bold ${scale * 0.038}px 'Tajawal', Arial`;
        ctx.fillStyle = "#ffd700cc";
        ctx.textAlign = "center";
        ctx.fillText(val, x, y);
        ctx.font = `${scale * 0.024}px 'Tajawal', Arial`;
        ctx.fillStyle = "#ffffff66";
        ctx.fillText(label, x, y + scale * 0.032);
      });
    };

    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  return (
    <div style={{ width: "100%", height: "100vh", background: "#020610" }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
    </div>
  );
}
