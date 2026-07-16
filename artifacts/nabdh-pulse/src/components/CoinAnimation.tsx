import { useEffect, useRef, useState } from "react";

interface CoinAnimationProps {
  active: boolean;
  amount: number;
  onDone: () => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  alpha: number;
  r: number;
  type: "coin" | "spark";
  color: string;
  rot: number; rotV: number;
}

export function CoinAnimation({ active, amount, onDone, containerRef }: CoinAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (!active) return;

    const canvas  = canvasRef.current!;
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    canvas.width  = rect.width  * devicePixelRatio;
    canvas.height = rect.height * devicePixelRatio;
    canvas.style.width  = rect.width  + "px";
    canvas.style.height = rect.height + "px";

    const ctx = canvas.getContext("2d")!;
    const W = canvas.width, H = canvas.height;

    // Spawn particles
    const particles: Particle[] = [];
    const cx = W / 2, cy = H * 0.45;
    const COIN_COLORS = ["#FFD700", "#FFC500", "#FFAA00", "#FFE066"];
    const SPARK_COLORS = ["#FFD700", "#FFF0A0", "#16A34A", "#1D4ED8"];

    for (let i = 0; i < 18; i++) {
      const isCoin = i < 10;
      const angle  = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.2;
      const speed  = 3 + Math.random() * 5;
      particles.push({
        x: cx + (Math.random() - 0.5) * 60 * devicePixelRatio,
        y: cy - 40 * devicePixelRatio,
        vx: Math.cos(angle) * speed * devicePixelRatio,
        vy: Math.sin(angle) * speed * devicePixelRatio - 2 * devicePixelRatio,
        alpha: 1,
        r: isCoin ? (10 + Math.random() * 8) * devicePixelRatio : (3 + Math.random() * 4) * devicePixelRatio,
        type: isCoin ? "coin" : "spark",
        color: isCoin ? COIN_COLORS[i % COIN_COLORS.length] : SPARK_COLORS[i % SPARK_COLORS.length],
        rot: Math.random() * Math.PI * 2,
        rotV: (Math.random() - 0.5) * 0.2,
      });
    }

    setShowToast(true);

    let frame = 0;
    const animate = () => {
      ctx.clearRect(0, 0, W, H);
      let alive = false;

      for (const p of particles) {
        if (p.alpha <= 0) continue;
        alive = true;

        p.x  += p.vx;
        p.y  += p.vy;
        p.vy += 0.35 * devicePixelRatio; // gravity
        p.vx *= 0.98;
        p.alpha -= 0.018;
        p.rot += p.rotV;

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);

        if (p.type === "coin") {
          // Coin face
          const g = ctx.createRadialGradient(-p.r * 0.3, -p.r * 0.3, 0, 0, 0, p.r);
          g.addColorStop(0, "#FFF0A0");
          g.addColorStop(0.5, p.color);
          g.addColorStop(1, "#9A7010");
          ctx.beginPath();
          ctx.arc(0, 0, p.r, 0, Math.PI * 2);
          ctx.fillStyle = g; ctx.fill();
          ctx.strokeStyle = "#C8A000"; ctx.lineWidth = p.r * 0.12; ctx.stroke();
          ctx.font = `bold ${p.r * 1.1}px Arial`;
          ctx.fillStyle = "#9A7010";
          ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText("$", 0, 1);
        } else {
          // Spark / star
          ctx.beginPath();
          for (let j = 0; j < 5; j++) {
            const a1 = (j * 2 * Math.PI) / 5 - Math.PI / 2;
            const a2 = a1 + Math.PI / 5;
            const x1 = Math.cos(a1) * p.r * 2;
            const y1 = Math.sin(a1) * p.r * 2;
            const x2 = Math.cos(a2) * p.r;
            const y2 = Math.sin(a2) * p.r;
            j === 0 ? ctx.moveTo(x1, y1) : ctx.lineTo(x1, y1);
            ctx.lineTo(x2, y2);
          }
          ctx.closePath();
          ctx.fillStyle = p.color; ctx.fill();
        }
        ctx.restore();
      }

      frame++;
      if (!alive || frame > 120) {
        cancelAnimationFrame(rafRef.current);
        ctx.clearRect(0, 0, W, H);
        setTimeout(() => { setShowToast(false); onDone(); }, 300);
        return;
      }
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => { cancelAnimationFrame(rafRef.current); };
  }, [active]); // eslint-disable-line

  if (!active) return null;

  const formattedAmount = new Intl.NumberFormat("ar-SA", { maximumFractionDigits: 0 }).format(amount);

  return (
    <>
      {/* Canvas overlay */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-30"
        style={{ position: "absolute", top: 0, left: 0 }}
      />

      {/* Floating success toast */}
      {showToast && (
        <div
          className="absolute inset-x-0 z-40 flex justify-center pointer-events-none"
          style={{ top: "50%", transform: "translateY(-50%)" }}
        >
          <div
            className="bg-gradient-to-l from-secondary to-primary text-white px-6 py-3 rounded-2xl shadow-2xl font-bold text-base flex items-center gap-2"
            style={{
              animation: "fadeInUp 0.4s ease-out",
              boxShadow: "0 0 30px rgba(22,163,74,0.5)",
            }}
          >
            <span className="text-xl">🪙</span>
            <span>تمت إضافة {formattedAmount} ر.س إلى محفظتك!</span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
