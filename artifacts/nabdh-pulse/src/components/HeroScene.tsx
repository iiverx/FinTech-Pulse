import { useEffect, useRef } from "react";

export function HeroScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx    = canvas.getContext("2d")!;
    let raf: number;
    let t = 0;
    let lastTime = 0;

    const resize = () => {
      canvas.width  = canvas.offsetWidth  * devicePixelRatio;
      canvas.height = canvas.offsetHeight * devicePixelRatio;
    };
    resize();
    window.addEventListener("resize", resize);

    // ─── helpers ─────────────────────────────────────────────────────────────
    // Glow is expensive — use sparingly with lower blur values
    const glow   = (color: string, blur: number) => { ctx.shadowColor = color; ctx.shadowBlur = blur * 0.6; };
    const noGlow = () => { ctx.shadowBlur = 0; };

    // Heart path — tip at BOTTOM, lobes at TOP
    const heartPath = (cx: number, cy: number, size: number) => {
      ctx.beginPath();
      // Use fewer points (every 2°) — same shape, half the math
      for (let i = 0; i <= 360; i += 2) {
        const rad = (i * Math.PI) / 180;
        const x = 16 * Math.pow(Math.sin(rad), 3);
        const y = -(13 * Math.cos(rad) - 5 * Math.cos(2 * rad) - 2 * Math.cos(3 * rad) - Math.cos(4 * rad));
        const px = cx + x * size;
        const py = cy + y * size;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
    };

    // City skyline
    const buildings = [
      { x: 0.03, w: 0.04, h: 0.18 }, { x: 0.07, w: 0.03, h: 0.25 },
      { x: 0.10, w: 0.05, h: 0.35 }, { x: 0.15, w: 0.03, h: 0.22 },
      { x: 0.18, w: 0.04, h: 0.42 }, { x: 0.22, w: 0.03, h: 0.28 },
      { x: 0.25, w: 0.05, h: 0.32 }, { x: 0.30, w: 0.02, h: 0.18 },
      { x: 0.68, w: 0.02, h: 0.18 }, { x: 0.70, w: 0.05, h: 0.32 },
      { x: 0.75, w: 0.03, h: 0.28 }, { x: 0.78, w: 0.04, h: 0.42 },
      { x: 0.82, w: 0.03, h: 0.22 }, { x: 0.85, w: 0.05, h: 0.35 },
      { x: 0.90, w: 0.03, h: 0.25 }, { x: 0.93, w: 0.04, h: 0.18 },
    ];
    const windowSeeds: boolean[][] = buildings.map(b => {
      const rows = Math.floor((b.h * 600 - 16) / 10);
      const cols = Math.floor((b.w * 800 - 8) / 8);
      return Array.from({ length: rows * cols }, () => Math.random() > 0.55);
    });

    const drawSkyline = (W: number, H: number) => {
      buildings.forEach((b, bi) => {
        const bx = b.x * W, bw = b.w * W;
        const bh = b.h * H, by = H * 0.85 - bh;
        const bg = ctx.createLinearGradient(bx, by, bx, by + bh);
        bg.addColorStop(0, "rgba(10,40,20,0.75)");
        bg.addColorStop(1, "rgba(5,20,10,0.9)");
        ctx.fillStyle = bg;
        ctx.fillRect(bx, by, bw, bh);
        const rows = Math.floor((bh - 16) / 10);
        const cols = Math.floor((bw - 8) / 8);
        let idx = 0;
        for (let wy = 0; wy < rows; wy++) {
          for (let wx = 0; wx < cols; wx++, idx++) {
            if (windowSeeds[bi][idx]) {
              ctx.fillStyle = "rgba(0,255,120,0.22)";
              ctx.fillRect(bx + 4 + wx * 8, by + 8 + wy * 10, 4, 4);
            }
          }
        }
      });
    };

    // Data panel — no per-call glow on the border (batch one glow only for the stroke)
    const drawPanel = (
      x: number, y: number, w: number, h: number,
      title: string, value: string, color: string,
      chart: "bar" | "line" | "pie"
    ) => {
      ctx.save();
      ctx.globalAlpha = 0.88;
      const pg = ctx.createLinearGradient(x, y, x, y + h);
      pg.addColorStop(0, "rgba(0,40,20,0.92)");
      pg.addColorStop(1, "rgba(0,15,8,0.96)");
      ctx.fillStyle = pg;
      ctx.beginPath();
      (ctx as any).roundRect(x, y, w, h, 10);
      ctx.fill();
      ctx.strokeStyle = color + "88";
      ctx.lineWidth = 1.5;
      ctx.shadowColor = color; ctx.shadowBlur = 5;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;

      ctx.fillStyle = color;
      ctx.font = `bold ${h * 0.14}px 'Tajawal', Arial`;
      ctx.textAlign = "center";
      ctx.fillText(title, x + w / 2, y + h * 0.22);

      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${h * 0.19}px 'Tajawal', Arial`;
      ctx.fillText(value, x + w / 2, y + h * 0.43);

      const cPad = w * 0.1;
      const cX = x + cPad, cW = w - cPad * 2;
      const cY = y + h * 0.54, cH = h * 0.37;

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
        ctx.lineWidth = 1.5; ctx.stroke();
      } else {
        const slices = [0.45, 0.3, 0.25];
        const cols2 = [color, "#ffd700", "#44aaff"];
        let sa = -Math.PI / 2;
        const pr = Math.min(cW, cH) * 0.4;
        const pcx2 = cX + cW / 2, pcy2 = cY + cH / 2;
        slices.forEach((s, i) => {
          ctx.beginPath(); ctx.moveTo(pcx2, pcy2);
          ctx.arc(pcx2, pcy2, pr, sa, sa + s * Math.PI * 2);
          ctx.closePath(); ctx.fillStyle = cols2[i] + "cc"; ctx.fill();
          sa += s * Math.PI * 2;
        });
      }
      ctx.restore();
    };

    // Tree branch — remove per-branch glow (too many calls)
    const drawBranch = (x1: number, y1: number, x2: number, y2: number, width: number, level: number) => {
      const g = ctx.createLinearGradient(x1, y1, x2, y2);
      g.addColorStop(0, level === 0 ? "#c8860a" : "#a06808");
      g.addColorStop(1, level === 0 ? "#a06808" : "#507020");
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
      ctx.strokeStyle = g; ctx.lineWidth = width; ctx.lineCap = "round";
      ctx.stroke();
    };

    const drawLeafCluster = (cx2: number, cy2: number, r: number) => {
      // Simplified: 3 leaves instead of 5 (visually almost identical)
      for (let l = 0; l < 3; l++) {
        const la = (l / 3) * Math.PI * 2;
        const lx = cx2 + Math.cos(la) * r * 0.55;
        const ly = cy2 + Math.sin(la) * r * 0.55;
        const lg = ctx.createRadialGradient(lx, ly, 0, lx, ly, r * 0.8);
        lg.addColorStop(0, "#00ee6688"); lg.addColorStop(1, "#004422aa");
        ctx.beginPath(); ctx.arc(lx, ly, r * 0.7, 0, Math.PI * 2);
        ctx.fillStyle = lg; ctx.fill();
      }
      const cg = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, r);
      cg.addColorStop(0, "#00ff8866"); cg.addColorStop(1, "#005533cc");
      ctx.beginPath(); ctx.arc(cx2, cy2, r, 0, Math.PI * 2);
      ctx.fillStyle = cg; ctx.fill();
      ctx.beginPath(); ctx.arc(cx2, cy2, r, 0, Math.PI * 2);
      ctx.strokeStyle = "#00ff88aa"; ctx.lineWidth = 1.5;
      // One glow per cluster instead of per-leaf
      ctx.shadowColor = "#00ff88"; ctx.shadowBlur = 6;
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    const drawIconBadge = (cx2: number, cy2: number, r: number, icon: string) => {
      const g = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, r);
      g.addColorStop(0, "rgba(0,180,80,0.9)"); g.addColorStop(1, "rgba(0,60,30,0.95)");
      ctx.beginPath(); ctx.arc(cx2, cy2, r, 0, Math.PI * 2);
      ctx.fillStyle = g; ctx.fill();
      ctx.strokeStyle = "#ffd700cc"; ctx.lineWidth = 2;
      ctx.shadowColor = "#ffd700"; ctx.shadowBlur = 5;
      ctx.stroke();
      ctx.shadowBlur = 0;

      if (icon === "piggybank") {
        ctx.save();
        ctx.translate(cx2, cy2);
        const bw = r * 1.9, bh = r * 0.95;
        const bx = -bw / 2, by = -bh / 2;
        ctx.rotate(-0.12);
        ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 5; ctx.shadowOffsetY = 3;
        ctx.beginPath(); (ctx as any).roundRect(bx + 2, by + 2, bw, bh, 5);
        ctx.fillStyle = "#003300"; ctx.fill();
        ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
        const billG = ctx.createLinearGradient(bx, by, bx, by + bh);
        billG.addColorStop(0, "#2d7a3a");
        billG.addColorStop(0.4, "#1a5c28");
        billG.addColorStop(1, "#0f3d1a");
        ctx.beginPath(); (ctx as any).roundRect(bx, by, bw, bh, 5);
        ctx.fillStyle = billG; ctx.fill();
        ctx.strokeStyle = "#4caf5088"; ctx.lineWidth = 1.5;
        ctx.shadowColor = "#00ff88"; ctx.shadowBlur = 4; ctx.stroke(); ctx.shadowBlur = 0;
        const pad = bw * 0.055;
        ctx.beginPath(); (ctx as any).roundRect(bx + pad, by + pad, bw - pad * 2, bh - pad * 2, 3);
        ctx.strokeStyle = "rgba(100,220,120,0.35)"; ctx.lineWidth = 1; ctx.stroke();
        ctx.beginPath(); ctx.ellipse(bx + bw * 0.18, by + bh * 0.5, bw * 0.1, bh * 0.32, 0, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(150,255,150,0.3)"; ctx.lineWidth = 1; ctx.stroke();
        ctx.beginPath(); ctx.ellipse(bx + bw * 0.82, by + bh * 0.5, bw * 0.1, bh * 0.32, 0, 0, Math.PI * 2);
        ctx.stroke();
        const circleR = bh * 0.31;
        const circleG = ctx.createRadialGradient(0, 0, 0, 0, 0, circleR);
        circleG.addColorStop(0, "rgba(60,160,70,0.6)");
        circleG.addColorStop(1, "rgba(20,80,30,0.2)");
        ctx.beginPath(); ctx.arc(0, 0, circleR, 0, Math.PI * 2);
        ctx.fillStyle = circleG; ctx.fill();
        ctx.strokeStyle = "rgba(150,255,150,0.4)"; ctx.lineWidth = 1; ctx.stroke();
        ctx.font = `bold ${bh * 0.58}px Arial`;
        ctx.fillStyle = "#a5d6a7";
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.shadowColor = "#00ff88"; ctx.shadowBlur = 6; ctx.fillText("$", 0, 1); ctx.shadowBlur = 0;
        ctx.textBaseline = "alphabetic";
        ctx.font = `bold ${bh * 0.22}px Arial`;
        ctx.fillStyle = "#81c784cc";
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("100", bx + bw * 0.18, by + bh * 0.5);
        ctx.fillText("100", bx + bw * 0.82, by + bh * 0.5);
        ctx.font = `${bh * 0.12}px Arial`;
        ctx.fillStyle = "rgba(150,255,150,0.35)";
        ctx.fillText("NABDH  PULSE  FINANCIAL", 0, by + bh * 0.2);
        ctx.fillText("SMART  INVESTMENT  INDEX", 0, by + bh * 0.82);
        ctx.textBaseline = "alphabetic";
        ctx.restore();
      } else {
        ctx.font = `bold ${r * 1.1}px Arial`;
        ctx.fillStyle = "#ffd700";
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(icon, cx2, cy2 + 1);
        ctx.textBaseline = "alphabetic";
      }
    };

    // Reduced: 8 coins instead of 16
    type Coin = { x: number; y: number; phase: number; r: number };
    const coins: Coin[] = Array.from({ length: 8 }, (_, i) => ({
      x: 0.08 + ((i * 0.115) % 0.84),
      y: 0.1  + ((i * 0.166) % 0.75),
      phase: i * 0.7,
      r: 9 + (i % 4) * 3,
    }));

    // Reduced: 4 energy streams instead of 6
    const energyStreams = [
      { angle: -0.4, speed: 0.6 }, { angle: 0.4, speed: 0.5 },
      { angle: Math.PI + 0.3, speed: 0.7 }, { angle: Math.PI - 0.3, speed: 0.55 },
    ];

    // EKG waveform points
    const ekgPts = [
      0, 0, 0, 0, 0,
      0.03, 0.09, 0.15, 0.18, 0.15, 0.09, 0.03,
      0, 0, 0,
      -0.08, -0.14,
      0.15, 0.45, 0.85, 1.0, 0.85, 0.45,
      -0.3, -0.38, -0.28, -0.12,
      0.02, 0.02, 0.02, 0.02,
      0.05, 0.12, 0.22, 0.28, 0.28, 0.22, 0.12, 0.05,
      0, 0, 0, 0, 0, 0,
    ];

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);

      // Pause when tab is hidden
      if (document.hidden) return;

      // Throttle to ~30 fps
      if (now - lastTime < 33) return;
      lastTime = now;

      t += 0.033;
      const W = canvas.width, H = canvas.height;
      const scale = Math.min(W, H);
      const cx = W / 2, cy = H * 0.52;

      // Background
      const bgG = ctx.createRadialGradient(cx, cy * 0.7, 0, cx, cy, W * 0.75);
      bgG.addColorStop(0, "#061408");
      bgG.addColorStop(0.5, "#030c05");
      bgG.addColorStop(1, "#010604");
      ctx.fillStyle = bgG;
      ctx.fillRect(0, 0, W, H);

      // Stars — reduced to 40
      for (let i = 0; i < 40; i++) {
        const sx = (i * 173.3) % W;
        const sy = (i * 97.1)  % (H * 0.7);
        const sa2 = 0.3 + 0.7 * Math.abs(Math.sin(t * 0.5 + i));
        ctx.beginPath(); ctx.arc(sx, sy, 0.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200,255,200,${sa2 * 0.5})`; ctx.fill();
      }

      drawSkyline(W, H);

      // Ground glow
      const groundG = ctx.createRadialGradient(cx, H * 0.85, 0, cx, H * 0.85, W * 0.5);
      groundG.addColorStop(0, "rgba(0,200,80,0.14)");
      groundG.addColorStop(1, "transparent");
      ctx.fillStyle = groundG;
      ctx.fillRect(0, 0, W, H);


      // Energy streams — reduced segments: 10 instead of 20
      const heartR = scale * 0.155;
      energyStreams.forEach((s) => {
        const len = scale * 0.42;
        const streamT = (t * s.speed) % 1;
        for (let seg = 0; seg < 10; seg++) {
          const prog = (streamT + seg * 0.1) % 1;
          const dist = prog * len;
          const wave = Math.sin(prog * Math.PI * 4 + t * 3) * scale * 0.03;
          const sx2 = cx + Math.cos(s.angle) * dist + Math.cos(s.angle + Math.PI / 2) * wave;
          const sy2 = cy + Math.sin(s.angle) * dist + Math.sin(s.angle + Math.PI / 2) * wave;
          const alpha = Math.sin(prog * Math.PI) * 0.7;
          ctx.beginPath(); ctx.arc(sx2, sy2, scale * 0.004 * (1 - prog * 0.5), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0,255,120,${alpha})`; ctx.fill();
        }
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(s.angle) * heartR * 0.8, cy + Math.sin(s.angle) * heartR * 0.8);
        for (let i = 1; i <= 15; i++) {
          const prog2 = i / 15;
          const dist2 = prog2 * len * 0.6;
          const wave2 = Math.sin(prog2 * Math.PI * 4 + t * 3 + s.speed) * scale * 0.025;
          ctx.lineTo(
            cx + Math.cos(s.angle) * dist2 + Math.cos(s.angle + Math.PI / 2) * wave2,
            cy + Math.sin(s.angle) * dist2 + Math.sin(s.angle + Math.PI / 2) * wave2
          );
        }
        ctx.strokeStyle = `rgba(0,255,120,0.1)`;
        ctx.lineWidth = 2; ctx.stroke();
      });

      // ── Crystal heart ─────────────────────────────────────────────────────
      const heartPulse = 1 + Math.sin(t * 1.8) * 0.03;
      const hs = heartR / 16 * heartPulse;

      // Outer glow
      ctx.save();
      heartPath(cx, cy, hs * 1.18);
      const glowG = ctx.createRadialGradient(cx, cy - hs * 4, 0, cx, cy, hs * 22);
      glowG.addColorStop(0, "rgba(0,255,100,0.2)");
      glowG.addColorStop(0.5, "rgba(0,200,80,0.07)");
      glowG.addColorStop(1, "rgba(0,100,40,0)");
      ctx.fillStyle = glowG; ctx.fill();
      ctx.restore();

      // Heart body
      ctx.save();
      heartPath(cx, cy, hs);
      const heartBodyG = ctx.createLinearGradient(cx - heartR, cy - heartR, cx + heartR, cy + heartR);
      heartBodyG.addColorStop(0, "rgba(0,255,120,0.18)");
      heartBodyG.addColorStop(0.3, "rgba(20,220,100,0.28)");
      heartBodyG.addColorStop(0.6, "rgba(0,180,80,0.22)");
      heartBodyG.addColorStop(1, "rgba(0,100,40,0.35)");
      ctx.fillStyle = heartBodyG; ctx.fill();
      heartPath(cx, cy, hs);
      ctx.strokeStyle = "#00ff88";
      ctx.lineWidth = scale * 0.006;
      glow("#00ff88", 22); ctx.stroke(); noGlow();
      ctx.restore();

      // Glass sheen
      ctx.save();
      heartPath(cx - heartR * 0.15, cy - heartR * 0.15, hs * 0.6);
      const sheenG = ctx.createRadialGradient(cx - heartR * 0.2, cy - heartR * 0.35, 0, cx - heartR * 0.1, cy - heartR * 0.1, heartR * 0.7);
      sheenG.addColorStop(0, "rgba(255,255,255,0.32)");
      sheenG.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = sheenG; ctx.globalAlpha = 0.5; ctx.fill(); ctx.globalAlpha = 1;
      ctx.restore();

      // EKG inside heart
      ctx.save();
      heartPath(cx, cy, hs * 0.97);
      ctx.clip();

      const waveW = heartR * 1.55;
      const ekgScroll = (t * 28) % waveW;

      const ekgGrad = ctx.createLinearGradient(cx - heartR, cy, cx + heartR, cy);
      ekgGrad.addColorStop(0,   "#1D4ED8");
      ekgGrad.addColorStop(0.5, "#2563EB");
      ekgGrad.addColorStop(1,   "#16A34A");

      ctx.beginPath();
      let ekgStarted = false;
      for (let tile = -1; tile <= 3; tile++) {
        ekgPts.forEach((v, i) => {
          const ex = cx - heartR + tile * waveW - ekgScroll
                     + (i / (ekgPts.length - 1)) * waveW;
          const ey = cy + v * heartR * 0.5;
          if (!ekgStarted) { ctx.moveTo(ex, ey); ekgStarted = true; }
          else ctx.lineTo(ex, ey);
        });
      }
      ctx.strokeStyle = ekgGrad;
      ctx.lineWidth = scale * 0.007;
      ctx.lineJoin = "round";
      ctx.lineCap  = "round";
      glow("#4f9eff", 16); ctx.stroke(); noGlow();
      ctx.restore();

      // ── Tree ──────────────────────────────────────────────────────────────
      const treeBaseX = cx;
      const treeBaseY = cy - heartR * 0.3;
      const trunkH = scale * 0.28;
      const trunkTop = treeBaseY - trunkH;

      drawBranch(treeBaseX, treeBaseY, treeBaseX, trunkTop, scale * 0.02, 0);

      const l1 = [
        { dx: -0.28, dy: -0.12, label: "$" },
        { dx: -0.16, dy: -0.22, label: "🏦" },
        { dx: 0,     dy: -0.25, label: "$" },
        { dx: 0.16,  dy: -0.22, label: "📊" },
        { dx: 0.28,  dy: -0.12, label: "piggybank" },
      ];

      l1.forEach((b) => {
        const bx = treeBaseX + b.dx * scale;
        const by = trunkTop  + b.dy * scale;
        drawBranch(treeBaseX, trunkTop, bx, by, scale * 0.013, 1);
        for (let sb = 0; sb < 2; sb++) {
          const sAngle = Math.atan2(by - trunkTop, bx - treeBaseX);
          const spread = sb === 0 ? -0.3 : 0.3;
          const s2x = bx + Math.cos(sAngle + spread) * scale * 0.1;
          const s2y = by + Math.sin(sAngle + spread) * scale * 0.08 - scale * 0.05;
          drawBranch(bx, by, s2x, s2y, scale * 0.007, 2);
          drawLeafCluster(s2x, s2y, scale * 0.038);
        }
        drawLeafCluster(bx, by, scale * 0.055);
        drawIconBadge(bx, by, scale * 0.033, b.label);
      });

      [
        { x: cx - 0.22 * scale, y: trunkTop - 0.05 * scale },
        { x: cx + 0.22 * scale, y: trunkTop - 0.05 * scale },
        { x: cx - 0.35 * scale, y: trunkTop + 0.05 * scale },
        { x: cx + 0.35 * scale, y: trunkTop + 0.05 * scale },
      ].forEach(p => drawLeafCluster(p.x, p.y, scale * 0.04));

      // ── Data panels ───────────────────────────────────────────────────────
      const panelW = scale * 0.24, panelH = scale * 0.22;
      const bob = Math.sin(t * 0.7) * 4;
      drawPanel(W * 0.02, H * 0.22 + bob, panelW, panelH, "INCOME",      "+$4,820", "#00ff88", "bar");
      drawPanel(W * 0.02, H * 0.52 - bob, panelW, panelH, "SAVINGS",     "$12,500", "#44aaff", "line");
      drawPanel(W - panelW - W * 0.02, H * 0.22 - bob, panelW, panelH, "INVESTMENTS", "+18.4%", "#00ff88", "line");
      drawPanel(W - panelW - W * 0.02, H * 0.52 + bob, panelW, panelH, "EXPENSES",   "$2,340", "#ff8844", "pie");

      // ── Coins (8) ─────────────────────────────────────────────────────────
      const pZoneW = (panelW + W * 0.04) / W;
      const pZoneH = (panelH + 20) / H;
      const savingsY = (H * 0.52) / H;

      coins.forEach((coin) => {
        const inLeftStrip  = coin.x < pZoneW;
        const inSavingsRow = coin.y > savingsY - pZoneH * 0.65 && coin.y < savingsY + pZoneH * 0.65;
        if (inLeftStrip && inSavingsRow) return;

        const bobY = coin.y * H + Math.sin(t * 1.1 + coin.phase) * 8;
        const tilt = Math.sin(t * 0.8 + coin.phase) * 0.6;
        const rx = coin.r;
        const ry = Math.abs(Math.cos(tilt)) * coin.r * 0.3 + 2;
        ctx.save(); ctx.translate(coin.x * W, bobY);
        const cg = ctx.createRadialGradient(-rx * 0.3, -ry * 0.3, 0, 0, 0, rx);
        cg.addColorStop(0, "#fffacc"); cg.addColorStop(0.4, "#ffd700");
        cg.addColorStop(0.75, "#c87000"); cg.addColorStop(1, "#6b3800");
        ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        ctx.fillStyle = cg; ctx.fill();
        // Single glow for all coins instead of per-coin shadow stroke
        ctx.strokeStyle = "#ffd700"; ctx.lineWidth = 1; ctx.stroke();
        ctx.font = `bold ${rx * 0.85}px Arial`;
        ctx.fillStyle = "rgba(180,100,0,0.85)";
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("$", 0, 0); ctx.textBaseline = "alphabetic";
        ctx.restore();
      });
    };

    requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div style={{ width: "100%", height: "100%", background: "#010604" }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
    </div>
  );
}
