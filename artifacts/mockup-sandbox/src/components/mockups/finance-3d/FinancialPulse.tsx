import { useEffect, useRef } from "react";

export function FinancialPulse() {
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

    // ─── helpers ─────────────────────────────────────────────────────────────
    const glow = (color: string, blur: number) => {
      ctx.shadowColor = color;
      ctx.shadowBlur = blur;
    };
    const noGlow = () => { ctx.shadowBlur = 0; };

    // Heart path using parametric equations — tip at BOTTOM, lobes at TOP
    const heartPath = (cx: number, cy: number, size: number) => {
      ctx.beginPath();
      for (let i = 0; i <= 360; i++) {
        const rad = (i * Math.PI) / 180;
        const x = 16 * Math.pow(Math.sin(rad), 3);
        // negate y so tip is at bottom in canvas coords
        const y = -(13 * Math.cos(rad) - 5 * Math.cos(2 * rad) - 2 * Math.cos(3 * rad) - Math.cos(4 * rad));
        const px = cx + x * size;
        const py = cy + y * size;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
    };

    // City skyline silhouette
    const drawSkyline = (W: number, H: number) => {
      const buildings = [
        { x: 0.03, w: 0.04, h: 0.18 }, { x: 0.07, w: 0.03, h: 0.25 },
        { x: 0.10, w: 0.05, h: 0.35 }, { x: 0.15, w: 0.03, h: 0.22 },
        { x: 0.18, w: 0.04, h: 0.42 }, { x: 0.22, w: 0.03, h: 0.28 },
        { x: 0.25, w: 0.05, h: 0.32 }, { x: 0.30, w: 0.02, h: 0.18 },
        // right side (mirrored)
        { x: 0.68, w: 0.02, h: 0.18 }, { x: 0.70, w: 0.05, h: 0.32 },
        { x: 0.75, w: 0.03, h: 0.28 }, { x: 0.78, w: 0.04, h: 0.42 },
        { x: 0.82, w: 0.03, h: 0.22 }, { x: 0.85, w: 0.05, h: 0.35 },
        { x: 0.90, w: 0.03, h: 0.25 }, { x: 0.93, w: 0.04, h: 0.18 },
      ];
      buildings.forEach(b => {
        const bx = b.x * W, bw = b.w * W;
        const bh = b.h * H, by = H * 0.82 - bh;
        const bg = ctx.createLinearGradient(bx, by, bx, by + bh);
        bg.addColorStop(0, "rgba(10,40,20,0.7)");
        bg.addColorStop(1, "rgba(5,20,10,0.9)");
        ctx.fillStyle = bg;
        ctx.fillRect(bx, by, bw, bh);
        // Windows
        for (let wy = by + 8; wy < by + bh - 8; wy += 10) {
          for (let wx = bx + 4; wx < bx + bw - 4; wx += 8) {
            if (Math.random() > 0.55) {
              ctx.fillStyle = "rgba(0,255,120,0.25)";
              ctx.fillRect(wx, wy, 4, 4);
            }
          }
        }
      });
    };

    // Data panel helper
    const drawPanel = (
      x: number, y: number, w: number, h: number,
      title: string, value: string, color: string,
      chart: "bar" | "line" | "pie"
    ) => {
      // Panel background
      ctx.save();
      ctx.globalAlpha = 0.82;
      const pg = ctx.createLinearGradient(x, y, x, y + h);
      pg.addColorStop(0, "rgba(0,40,20,0.9)");
      pg.addColorStop(1, "rgba(0,15,8,0.95)");
      ctx.fillStyle = pg;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 10);
      ctx.fill();
      ctx.strokeStyle = color + "88";
      ctx.lineWidth = 1.5;
      glow(color, 8);
      ctx.stroke();
      noGlow();
      ctx.globalAlpha = 1;

      // Title
      ctx.fillStyle = color;
      ctx.font = `bold ${h * 0.14}px 'Tajawal', Arial`;
      ctx.textAlign = "center";
      ctx.fillText(title, x + w / 2, y + h * 0.2);

      // Value
      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${h * 0.18}px 'Tajawal', Arial`;
      ctx.fillText(value, x + w / 2, y + h * 0.42);

      // Mini chart
      const cPad = w * 0.1;
      const cX = x + cPad, cW = w - cPad * 2;
      const cY = y + h * 0.55, cH = h * 0.35;

      if (chart === "bar") {
        const bars = [0.4, 0.65, 0.5, 0.8, 0.6, 0.9];
        const bw2 = cW / (bars.length * 1.5);
        bars.forEach((v, i) => {
          const bx2 = cX + i * (cW / bars.length);
          const bh2 = v * cH;
          const g2 = ctx.createLinearGradient(bx2, cY + cH - bh2, bx2, cY + cH);
          g2.addColorStop(0, color + "cc"); g2.addColorStop(1, color + "22");
          ctx.fillStyle = g2;
          ctx.fillRect(bx2, cY + cH - bh2, bw2, bh2);
        });
      } else if (chart === "line") {
        const pts = [0.3, 0.5, 0.35, 0.7, 0.6, 0.85, 0.75, 0.95];
        ctx.beginPath();
        pts.forEach((v, i) => {
          const lx = cX + (i / (pts.length - 1)) * cW;
          const ly = cY + cH - v * cH;
          i === 0 ? ctx.moveTo(lx, ly) : ctx.lineTo(lx, ly);
        });
        ctx.strokeStyle = color + "cc";
        ctx.lineWidth = 1.5; glow(color, 4); ctx.stroke(); noGlow();
      } else {
        // Pie
        const slices = [0.45, 0.3, 0.25];
        const cols2 = [color, "#ffd700", "#44aaff"];
        let sa = -Math.PI / 2;
        const pr = Math.min(cW, cH) * 0.4;
        const pcx = cX + cW / 2, pcy = cY + cH / 2;
        slices.forEach((s, i) => {
          ctx.beginPath(); ctx.moveTo(pcx, pcy);
          ctx.arc(pcx, pcy, pr, sa, sa + s * Math.PI * 2);
          ctx.closePath();
          ctx.fillStyle = cols2[i] + "cc"; ctx.fill();
          sa += s * Math.PI * 2;
        });
      }

      ctx.restore();
    };

    // Tree branch helper
    const drawBranch = (
      x1: number, y1: number, x2: number, y2: number,
      width: number, level: number
    ) => {
      const g = ctx.createLinearGradient(x1, y1, x2, y2);
      g.addColorStop(0, level === 0 ? "#c8860a" : "#a06808");
      g.addColorStop(1, level === 0 ? "#a06808" : "#507020");
      ctx.beginPath();
      ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
      ctx.strokeStyle = g;
      ctx.lineWidth = width;
      ctx.lineCap = "round";
      glow("#c8860a", 6); ctx.stroke(); noGlow();
    };

    // Leaf cluster
    const drawLeafCluster = (cx2: number, cy2: number, r: number) => {
      for (let l = 0; l < 5; l++) {
        const la = (l / 5) * Math.PI * 2;
        const lx = cx2 + Math.cos(la) * r * 0.55;
        const ly = cy2 + Math.sin(la) * r * 0.55;
        const lg = ctx.createRadialGradient(lx, ly, 0, lx, ly, r * 0.8);
        lg.addColorStop(0, "#00ee6688");
        lg.addColorStop(1, "#004422aa");
        ctx.beginPath(); ctx.arc(lx, ly, r * 0.7, 0, Math.PI * 2);
        ctx.fillStyle = lg; ctx.fill();
      }
      const cg = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, r);
      cg.addColorStop(0, "#00ff8866"); cg.addColorStop(1, "#005533cc");
      ctx.beginPath(); ctx.arc(cx2, cy2, r, 0, Math.PI * 2);
      ctx.fillStyle = cg; ctx.fill();
      // Leaf border
      ctx.beginPath(); ctx.arc(cx2, cy2, r, 0, Math.PI * 2);
      ctx.strokeStyle = "#00ff88aa"; ctx.lineWidth = 1.5;
      glow("#00ff88", 10); ctx.stroke(); noGlow();
    };

    // Icon badge (circle with label)
    const drawIconBadge = (cx2: number, cy2: number, r: number, icon: string) => {
      const g = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, r);
      g.addColorStop(0, "rgba(0,180,80,0.9)");
      g.addColorStop(1, "rgba(0,60,30,0.95)");
      ctx.beginPath(); ctx.arc(cx2, cy2, r, 0, Math.PI * 2);
      ctx.fillStyle = g; ctx.fill();
      ctx.strokeStyle = "#ffd700cc"; ctx.lineWidth = 2;
      glow("#ffd700", 8); ctx.stroke(); noGlow();
      ctx.font = `bold ${r * 1.1}px Arial`;
      ctx.fillStyle = "#ffd700";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(icon, cx2, cy2 + 1);
      ctx.textBaseline = "alphabetic";
    };

    // Coins
    type Coin = { x: number; y: number; vy: number; phase: number; r: number };
    const coins: Coin[] = Array.from({ length: 16 }, (_, i) => ({
      x: 0.08 + Math.random() * 0.84,
      y: 0.1 + Math.random() * 0.75,
      vy: 0,
      phase: i * 0.7,
      r: 10 + Math.random() * 8,
    }));

    // Energy stream points (from heart outward)
    const energyStreams = [
      { angle: -0.4, speed: 0.6 },
      { angle: 0.4, speed: 0.5 },
      { angle: Math.PI + 0.3, speed: 0.7 },
      { angle: Math.PI - 0.3, speed: 0.55 },
      { angle: -0.8, speed: 0.65 },
      { angle: 0.8, speed: 0.6 },
    ];

    // EKG data
    const ekgPts = [0, 0, 0.05, 0, 0, 0.12, 0, 1, -0.4, 0.2, 0, 0, -0.06, 0, 0, 0, 0.07, 0, 0, 0, 0, 0.05, 0, 0];

    // ─── main draw loop ───────────────────────────────────────────────────────
    const draw = () => {
      raf = requestAnimationFrame(draw);
      t += 0.016;
      const W = canvas.width, H = canvas.height;
      const scale = Math.min(W, H);
      const cx = W / 2, cy = H * 0.52;

      // ── Background ──────────────────────────────────────────────────────────
      const bgG = ctx.createRadialGradient(cx, cy * 0.7, 0, cx, cy, W * 0.75);
      bgG.addColorStop(0, "#061408");
      bgG.addColorStop(0.5, "#030c05");
      bgG.addColorStop(1, "#010604");
      ctx.fillStyle = bgG;
      ctx.fillRect(0, 0, W, H);

      // Stars
      for (let i = 0; i < 80; i++) {
        const sx = (i * 173.3) % W;
        const sy = (i * 97.1) % (H * 0.7);
        const sa2 = 0.3 + 0.7 * Math.abs(Math.sin(t * 0.5 + i));
        ctx.beginPath(); ctx.arc(sx, sy, 0.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200,255,200,${sa2 * 0.5})`; ctx.fill();
      }

      // Skyline
      ctx.save();
      // randomness seed is deterministic via buildings array
      drawSkyline(W, H);
      ctx.restore();

      // Ground glow
      const groundG = ctx.createRadialGradient(cx, H * 0.82, 0, cx, H * 0.82, W * 0.5);
      groundG.addColorStop(0, "rgba(0,200,80,0.15)");
      groundG.addColorStop(1, "transparent");
      ctx.fillStyle = groundG;
      ctx.fillRect(0, 0, W, H);

      // ── Circular platform ────────────────────────────────────────────────────
      const platR = scale * 0.14;
      const platY = cy + scale * 0.22;
      for (let p = 3; p >= 0; p--) {
        const pr = platR * (1 + p * 0.15);
        const pg2 = ctx.createLinearGradient(cx - pr, platY, cx + pr, platY + 12);
        pg2.addColorStop(0, `rgba(0,180,80,${0.15 - p * 0.03})`);
        pg2.addColorStop(1, `rgba(0,60,30,${0.25 - p * 0.04})`);
        ctx.beginPath();
        ctx.ellipse(cx, platY, pr, pr * 0.25, 0, 0, Math.PI * 2);
        ctx.fillStyle = pg2; ctx.fill();
        ctx.strokeStyle = `rgba(0,255,100,${0.25 - p * 0.05})`;
        ctx.lineWidth = 1; ctx.stroke();
      }

      // ── Energy streams ───────────────────────────────────────────────────────
      const heartR = scale * 0.155;
      energyStreams.forEach((s) => {
        const len = scale * 0.42;
        const streamT = (t * s.speed) % 1;
        for (let seg = 0; seg < 20; seg++) {
          const prog = (streamT + seg * 0.05) % 1;
          const dist = prog * len;
          const wave = Math.sin(prog * Math.PI * 4 + t * 3) * scale * 0.03;
          const sx2 = cx + Math.cos(s.angle) * dist + Math.cos(s.angle + Math.PI / 2) * wave;
          const sy2 = cy + Math.sin(s.angle) * dist + Math.sin(s.angle + Math.PI / 2) * wave;
          const alpha = Math.sin(prog * Math.PI) * 0.7;
          ctx.beginPath(); ctx.arc(sx2, sy2, scale * 0.004 * (1 - prog * 0.5), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0,255,120,${alpha})`; ctx.fill();
        }
        // Glowing trail line
        ctx.beginPath();
        ctx.moveTo(
          cx + Math.cos(s.angle) * heartR * 0.8,
          cy + Math.sin(s.angle) * heartR * 0.8
        );
        for (let i = 1; i <= 30; i++) {
          const prog2 = i / 30;
          const dist2 = prog2 * len * 0.6;
          const wave2 = Math.sin(prog2 * Math.PI * 4 + t * 3 + s.speed) * scale * 0.025;
          ctx.lineTo(
            cx + Math.cos(s.angle) * dist2 + Math.cos(s.angle + Math.PI / 2) * wave2,
            cy + Math.sin(s.angle) * dist2 + Math.sin(s.angle + Math.PI / 2) * wave2
          );
        }
        ctx.strokeStyle = `rgba(0,255,120,0.12)`;
        ctx.lineWidth = 2; ctx.stroke();
      });

      // ── Crystal heart ────────────────────────────────────────────────────────
      const heartPulse = 1 + Math.sin(t * 1.8) * 0.03;
      const hs = heartR / 16 * heartPulse;

      // Outer glow
      ctx.save();
      heartPath(cx, cy, hs * 1.18);
      const glowG = ctx.createRadialGradient(cx, cy - hs * 4, 0, cx, cy, hs * 22);
      glowG.addColorStop(0, "rgba(0,255,100,0.22)");
      glowG.addColorStop(0.5, "rgba(0,200,80,0.08)");
      glowG.addColorStop(1, "rgba(0,100,40,0)");
      ctx.fillStyle = glowG; ctx.fill();
      ctx.restore();

      // Heart body — glass crystal
      ctx.save();
      heartPath(cx, cy, hs);
      const heartBodyG = ctx.createLinearGradient(cx - heartR, cy - heartR, cx + heartR, cy + heartR);
      heartBodyG.addColorStop(0, "rgba(0,255,120,0.18)");
      heartBodyG.addColorStop(0.3, "rgba(20,220,100,0.28)");
      heartBodyG.addColorStop(0.6, "rgba(0,180,80,0.22)");
      heartBodyG.addColorStop(1, "rgba(0,100,40,0.35)");
      ctx.fillStyle = heartBodyG; ctx.fill();

      // Heart border glow
      heartPath(cx, cy, hs);
      ctx.strokeStyle = "#00ff88";
      ctx.lineWidth = scale * 0.006;
      glow("#00ff88", 20); ctx.stroke(); noGlow();
      ctx.restore();

      // Heart inner highlight (glass sheen top-left)
      ctx.save();
      heartPath(cx - heartR * 0.15, cy - heartR * 0.15, hs * 0.6);
      const sheenG = ctx.createRadialGradient(
        cx - heartR * 0.2, cy - heartR * 0.35, 0,
        cx - heartR * 0.1, cy - heartR * 0.1, heartR * 0.7
      );
      sheenG.addColorStop(0, "rgba(255,255,255,0.35)");
      sheenG.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = sheenG;
      ctx.globalAlpha = 0.5; ctx.fill();
      ctx.globalAlpha = 1;
      ctx.restore();

      // ── EKG line across heart ────────────────────────────────────────────────
      ctx.save();
      heartPath(cx, cy, hs * 0.97);
      ctx.clip();
      const ekgProgress = (t * 35) % (W * 0.9);
      const ekgX0 = cx - heartR * 1.1;
      const ekgW2 = heartR * 2.2;
      ctx.beginPath();
      ekgPts.forEach((v, i) => {
        const ex = ekgX0 + (i / (ekgPts.length - 1)) * ekgW2 + ekgProgress * 0.5 - heartR;
        const ey = cy + v * heartR * 0.55;
        i === 0 ? ctx.moveTo(ex, ey) : ctx.lineTo(ex, ey);
      });
      // Second copy for seamless loop
      ekgPts.forEach((v, i) => {
        const ex = ekgX0 + (i / (ekgPts.length - 1)) * ekgW2 + ekgProgress * 0.5;
        const ey = cy + v * heartR * 0.55;
        ctx.lineTo(ex, ey);
      });
      ctx.strokeStyle = "#00ff44";
      ctx.lineWidth = scale * 0.006;
      glow("#00ff44", 14); ctx.stroke(); noGlow();
      ctx.restore();

      // ── Tree ─────────────────────────────────────────────────────────────────
      const treeBaseX = cx;
      const treeBaseY = cy - heartR * 0.3; // grows from inside heart
      const trunkH = scale * 0.28;
      const trunkTop = treeBaseY - trunkH;

      // Trunk
      drawBranch(treeBaseX, treeBaseY, treeBaseX, trunkTop, scale * 0.02, 0);

      // Level 1 branches — 5 main branches
      const l1 = [
        { dx: -0.28, dy: -0.12, label: "$" },
        { dx: -0.16, dy: -0.22, label: "🏦" },
        { dx: 0, dy: -0.25, label: "$" },
        { dx: 0.16, dy: -0.22, label: "📊" },
        { dx: 0.28, dy: -0.12, label: "🐷" },
      ];

      l1.forEach((b) => {
        const bx = treeBaseX + b.dx * scale;
        const by = trunkTop + b.dy * scale;
        drawBranch(treeBaseX, trunkTop, bx, by, scale * 0.013, 1);

        // Level 2 sub-branches
        const subCount = 2;
        for (let sb = 0; sb < subCount; sb++) {
          const sAngle = Math.atan2(by - trunkTop, bx - treeBaseX);
          const spread = (sb === 0 ? -0.3 : 0.3);
          const s2x = bx + Math.cos(sAngle + spread) * scale * 0.1;
          const s2y = by + Math.sin(sAngle + spread) * scale * 0.08 - scale * 0.05;
          drawBranch(bx, by, s2x, s2y, scale * 0.007, 2);
          // Leaf cluster at sub-branch tip
          drawLeafCluster(s2x, s2y, scale * 0.038);
        }

        // Leaf cluster at branch tip
        drawLeafCluster(bx, by, scale * 0.055);

        // Icon badge
        const badgeR = scale * 0.033;
        drawIconBadge(bx, by, badgeR, b.label);
      });

      // Extra small leaf clusters along canopy
      [
        { x: cx - 0.22 * scale, y: trunkTop - 0.05 * scale },
        { x: cx + 0.22 * scale, y: trunkTop - 0.05 * scale },
        { x: cx - 0.35 * scale, y: trunkTop + 0.05 * scale },
        { x: cx + 0.35 * scale, y: trunkTop + 0.05 * scale },
      ].forEach(p => drawLeafCluster(p.x, p.y, scale * 0.04));

      // ── Floating data panels ─────────────────────────────────────────────────
      const panelW = scale * 0.24, panelH = scale * 0.22;
      const panelBob = Math.sin(t * 0.7) * 4;

      // Left panels
      drawPanel(
        W * 0.02, H * 0.22 + panelBob, panelW, panelH,
        "INCOME", "+$4,820", "#00ff88", "bar"
      );
      drawPanel(
        W * 0.02, H * 0.52 - panelBob, panelW, panelH,
        "SAVINGS", "$12,500", "#44aaff", "line"
      );

      // Right panels
      drawPanel(
        W - panelW - W * 0.02, H * 0.22 - panelBob, panelW, panelH,
        "INVESTMENTS", "+18.4%", "#00ff88", "line"
      );
      drawPanel(
        W - panelW - W * 0.02, H * 0.52 + panelBob, panelW, panelH,
        "EXPENSES", "$2,340", "#ff8844", "pie"
      );

      // ── Gold coins ────────────────────────────────────────────────────────────
      coins.forEach((coin) => {
        const bobY = coin.y * H + Math.sin(t * 1.1 + coin.phase) * 8;
        const tilt = Math.sin(t * 0.8 + coin.phase) * 0.6;
        const rx = coin.r;
        const ry = Math.abs(Math.cos(tilt)) * coin.r * 0.3 + 2;

        ctx.save();
        ctx.translate(coin.x * W, bobY);

        const cg = ctx.createRadialGradient(-rx * 0.3, -ry * 0.3, 0, 0, 0, rx);
        cg.addColorStop(0, "#fffacc");
        cg.addColorStop(0.4, "#ffd700");
        cg.addColorStop(0.75, "#c87000");
        cg.addColorStop(1, "#6b3800");
        ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        ctx.fillStyle = cg; ctx.fill();
        glow("#ffd700", 6);
        ctx.strokeStyle = "#ffd700"; ctx.lineWidth = 1;
        ctx.stroke(); noGlow();

        // $ on coin
        ctx.font = `bold ${rx * 0.85}px Arial`;
        ctx.fillStyle = "rgba(180,100,0,0.85)";
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("$", 0, 0);
        ctx.textBaseline = "alphabetic";
        ctx.restore();
      });

      // ── Title ─────────────────────────────────────────────────────────────────
      ctx.textAlign = "center";
      ctx.font = `bold ${scale * 0.056}px 'Tajawal', Arial`;
      ctx.fillStyle = "#ffffff";
      glow("#00ff88", 12);
      ctx.fillText("نبض | Pulse", W / 2, H * 0.075);
      noGlow();
      ctx.font = `${scale * 0.028}px 'Tajawal', Arial`;
      ctx.fillStyle = "#00ff8899";
      ctx.fillText("المؤشر المالي الذكي للاستثمار", W / 2, H * 0.122);
    };

    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div style={{ width: "100%", height: "100vh", background: "#010604" }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
    </div>
  );
}
