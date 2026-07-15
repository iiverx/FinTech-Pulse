import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

function FallbackScene() {
  return (
    <div
      className="w-full h-full relative overflow-hidden"
      style={{
        background: "radial-gradient(ellipse at 60% 40%, #0a2a1a 0%, #020b18 60%)",
      }}
    >
      {/* City silhouette */}
      <svg viewBox="0 0 600 200" className="absolute bottom-0 left-0 w-full opacity-30" preserveAspectRatio="none">
        <rect x="0"   y="80"  width="40"  height="120" fill="#0d2a4a"/>
        <rect x="45"  y="50"  width="55"  height="150" fill="#0d2a4a"/>
        <rect x="105" y="90"  width="35"  height="110" fill="#0d2a4a"/>
        <rect x="145" y="40"  width="60"  height="160" fill="#0d2a4a"/>
        <rect x="210" y="70"  width="45"  height="130" fill="#0d2a4a"/>
        <rect x="260" y="20"  width="70"  height="180" fill="#0d2a4a"/>
        <rect x="335" y="60"  width="50"  height="140" fill="#0d2a4a"/>
        <rect x="390" y="35"  width="65"  height="165" fill="#0d2a4a"/>
        <rect x="460" y="75"  width="40"  height="125" fill="#0d2a4a"/>
        <rect x="505" y="55"  width="55"  height="145" fill="#0d2a4a"/>
        <rect x="560" y="85"  width="40"  height="115" fill="#0d2a4a"/>
      </svg>

      {/* Glow rings */}
      {[120, 90, 60].map((r, i) => (
        <div
          key={i}
          className="absolute rounded-full border"
          style={{
            width: r * 2, height: r * 2,
            top: "50%", left: "50%",
            transform: "translate(-50%,-50%)",
            borderColor: `rgba(0,255,136,${0.15 - i * 0.04})`,
            boxShadow: `0 0 ${20 + i * 10}px rgba(0,255,136,${0.08 - i * 0.02})`,
            animation: `pulse ${2 + i * 0.5}s ease-in-out infinite alternate`,
          }}
        />
      ))}

      {/* Heart SVG with glow */}
      <div className="absolute inset-0 flex items-center justify-center">
        <svg
          viewBox="0 0 100 90"
          className="w-44 h-44 drop-shadow-2xl"
          style={{ filter: "drop-shadow(0 0 20px #00ff88) drop-shadow(0 0 40px #00aa55)" }}
        >
          <defs>
            <linearGradient id="hg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00ff88" stopOpacity="0.9"/>
              <stop offset="50%" stopColor="#00ccaa" stopOpacity="0.7"/>
              <stop offset="100%" stopColor="#0044ff" stopOpacity="0.5"/>
            </linearGradient>
          </defs>
          <path
            d="M50 85 C50 85 10 55 10 30 C10 15 22 5 35 5 C42 5 48 9 50 12 C52 9 58 5 65 5 C78 5 90 15 90 30 C90 55 50 85 50 85Z"
            fill="url(#hg)"
            stroke="#00ff88"
            strokeWidth="1"
            opacity="0.85"
          />
          {/* EKG line */}
          <polyline
            points="18,48 28,48 32,38 36,58 40,30 44,60 48,48 58,48 62,42 66,54 70,48 82,48"
            fill="none"
            stroke="#00ff88"
            strokeWidth="1.5"
            opacity="0.9"
            style={{ filter: "drop-shadow(0 0 3px #00ff88)" }}
          />
        </svg>
      </div>

      {/* Tree trunk emerging from heart */}
      <div
        className="absolute"
        style={{
          bottom: "55%", left: "50%",
          transform: "translateX(-50%)",
          width: 6, height: 60,
          background: "linear-gradient(to top, #c8902a, #6a4000)",
          borderRadius: 3,
          boxShadow: "0 0 8px rgba(200,144,42,0.6)",
        }}
      />

      {/* Floating coins */}
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 18, height: 18,
            background: "radial-gradient(circle, #ffd700, #b8860b)",
            boxShadow: "0 0 8px rgba(255,215,0,0.7)",
            left: `${15 + (i % 4) * 22}%`,
            top: `${20 + Math.floor(i / 4) * 40}%`,
            animation: `float ${2 + (i * 0.3)}s ease-in-out infinite alternate`,
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}

      {/* Data panels */}
      {[{ l: "5%", t: "25%", label: "الدخل" }, { l: "72%", t: "25%", label: "المدخرات" }, { l: "10%", t: "60%", label: "الإنفاق" }].map((p, i) => (
        <div
          key={i}
          className="absolute rounded-lg px-3 py-2 text-xs font-bold border"
          style={{
            left: p.l, top: p.t,
            background: "rgba(0,20,40,0.8)",
            borderColor: "#00ff8844",
            color: "#00ff88",
            boxShadow: "0 0 12px rgba(0,255,136,0.2)",
            animation: `float ${2.5 + i * 0.4}s ease-in-out infinite alternate`,
          }}
        >
          {p.label} ↑
        </div>
      ))}

      <style>{`
        @keyframes float { from { transform: translateY(0); } to { transform: translateY(-10px); } }
        @keyframes pulse { from { opacity: 0.6; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}

export function HeroScene() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [webglFailed, setWebglFailed] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // ── Renderer ──────────────────────────────────────────────────────────
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setWebglFailed(true);
      return;
    }
    if (!renderer.getContext()) {
      renderer.dispose();
      setWebglFailed(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020b18);
    scene.fog = new THREE.FogExp2(0x020b18, 0.035);

    // ── Camera ────────────────────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 200);
    camera.position.set(0, 1.5, 8);
    camera.lookAt(0, 0.5, 0);

    // ── Resize handler ────────────────────────────────────────────────────
    const resize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(mount);
    resize();

    // ── Mouse parallax ────────────────────────────────────────────────────
    let mouseX = 0;
    let mouseY = 0;
    const onMouseMove = (e: MouseEvent) => {
      const rect = mount.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      mouseY = -((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };
    mount.addEventListener("mousemove", onMouseMove);

    // ══════════════════════════════════════════════════════════════════════
    // LIGHTING
    // ══════════════════════════════════════════════════════════════════════
    const ambient = new THREE.AmbientLight(0x0a1a2a, 3);
    scene.add(ambient);

    const sunLight = new THREE.DirectionalLight(0x4499ff, 2.5);
    sunLight.position.set(5, 10, 5);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(1024, 1024);
    scene.add(sunLight);

    // Emerald inner glow
    const emeraldGlow = new THREE.PointLight(0x00ff88, 8, 6);
    emeraldGlow.position.set(0, 0.3, 0);
    scene.add(emeraldGlow);

    const goldLight = new THREE.PointLight(0xffcc44, 3, 8);
    goldLight.position.set(2, 2, 1);
    scene.add(goldLight);

    const blueLight = new THREE.PointLight(0x0066ff, 2, 8);
    blueLight.position.set(-2, 1, -1);
    scene.add(blueLight);

    // ══════════════════════════════════════════════════════════════════════
    // HEART SHAPE
    // ══════════════════════════════════════════════════════════════════════
    const heartShape = new THREE.Shape();
    const x = 0, y = 0;
    heartShape.moveTo(x + 0.5, y + 0.5);
    heartShape.bezierCurveTo(x + 0.5, y + 0.5, x + 0.4, y, x, y);
    heartShape.bezierCurveTo(x - 0.6, y, x - 0.6, y + 0.7, x - 0.6, y + 0.7);
    heartShape.bezierCurveTo(x - 0.6, y + 1.1, x - 0.3, y + 1.54, x + 0.5, y + 1.9);
    heartShape.bezierCurveTo(x + 1.2, y + 1.54, x + 1.6, y + 1.1, x + 1.6, y + 0.7);
    heartShape.bezierCurveTo(x + 1.6, y + 0.7, x + 1.6, y, x + 1.0, y);
    heartShape.bezierCurveTo(x + 0.7, y, x + 0.5, y + 0.5, x + 0.5, y + 0.5);

    const extrudeSettings = {
      depth: 0.6,
      bevelEnabled: true,
      bevelSegments: 8,
      steps: 2,
      bevelSize: 0.12,
      bevelThickness: 0.1,
    };

    const heartGeo = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
    heartGeo.center();

    // Glass / crystal material
    const heartMat = new THREE.MeshPhysicalMaterial({
      color: 0x88ffcc,
      metalness: 0.0,
      roughness: 0.02,
      transmission: 0.85,
      thickness: 0.8,
      ior: 1.6,
      reflectivity: 1.0,
      envMapIntensity: 2.0,
      transparent: true,
      opacity: 0.92,
      side: THREE.DoubleSide,
      attenuationColor: new THREE.Color(0x00ff88),
      attenuationDistance: 0.8,
    });

    const heartMesh = new THREE.Mesh(heartGeo, heartMat);
    heartMesh.scale.setScalar(0.9);
    heartMesh.castShadow = true;
    scene.add(heartMesh);

    // Inner glowing heart (smaller, emissive)
    const innerHeartMat = new THREE.MeshPhysicalMaterial({
      color: 0x00ff88,
      emissive: new THREE.Color(0x00ff88),
      emissiveIntensity: 1.5,
      transparent: true,
      opacity: 0.35,
      side: THREE.BackSide,
    });
    const innerHeart = new THREE.Mesh(heartGeo, innerHeartMat);
    innerHeart.scale.setScalar(0.82);
    scene.add(innerHeart);

    // Heartbeat EKG line inside heart
    const ekgPoints: THREE.Vector3[] = [];
    const ekgSegments = 120;
    for (let i = 0; i <= ekgSegments; i++) {
      const t = (i / ekgSegments) * Math.PI * 2 - Math.PI;
      const xp = t / Math.PI;
      let yp = 0;
      // EKG shape
      if (Math.abs(t + 1.8) < 0.15) yp = 0.5;
      else if (Math.abs(t + 1.6) < 0.05) yp = -0.2;
      else if (Math.abs(t + 1.5) < 0.08) yp = 1.2;
      else if (Math.abs(t + 1.3) < 0.05) yp = -0.4;
      else if (Math.abs(t + 1.1) < 0.15) yp = 0.3;
      ekgPoints.push(new THREE.Vector3(xp * 0.7, yp * 0.25 - 0.2, 0.35));
    }
    const ekgGeo = new THREE.BufferGeometry().setFromPoints(ekgPoints);
    const ekgMat = new THREE.LineBasicMaterial({
      color: 0x00ff88,
      linewidth: 2,
      transparent: true,
      opacity: 0.9,
    });
    const ekgLine = new THREE.Line(ekgGeo, ekgMat);
    heartMesh.add(ekgLine);

    // ══════════════════════════════════════════════════════════════════════
    // FINANCIAL TREE
    // ══════════════════════════════════════════════════════════════════════
    const treeGroup = new THREE.Group();
    treeGroup.position.set(0, 0.9, 0);

    // Trunk
    const trunkGeo = new THREE.CylinderGeometry(0.06, 0.1, 1.2, 8);
    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0xc8902a,
      metalness: 0.6,
      roughness: 0.3,
      emissive: new THREE.Color(0x6a4000),
      emissiveIntensity: 0.3,
    });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 0.6;
    trunk.castShadow = true;
    treeGroup.add(trunk);

    // Branches
    const branchMat = new THREE.MeshStandardMaterial({
      color: 0xd4a030,
      metalness: 0.5,
      roughness: 0.4,
      emissive: new THREE.Color(0x5a3500),
      emissiveIntensity: 0.3,
    });
    const branchAngles = [
      { x: 0.6, z: 0, y: 0.9, rx: 0.5 },
      { x: -0.6, z: 0, y: 0.9, rx: -0.5 },
      { x: 0.4, z: 0.4, y: 1.0, rx: 0.4 },
      { x: -0.4, z: -0.4, y: 1.0, rx: -0.4 },
      { x: 0.2, z: 0.6, y: 1.1, rx: 0.3 },
      { x: -0.2, z: -0.6, y: 1.1, rx: -0.3 },
    ];
    branchAngles.forEach((b) => {
      const bGeo = new THREE.CylinderGeometry(0.025, 0.04, 0.55, 6);
      const bMesh = new THREE.Mesh(bGeo, branchMat);
      bMesh.position.set(b.x, b.y, b.z);
      bMesh.rotation.z = b.rx;
      bMesh.rotation.x = b.rx * 0.3;
      treeGroup.add(bMesh);
    });

    // Canopy spheres (glowing green leaves clusters)
    const leafMat = new THREE.MeshStandardMaterial({
      color: 0x00dd66,
      emissive: new THREE.Color(0x004422),
      emissiveIntensity: 0.8,
      roughness: 0.8,
      transparent: true,
      opacity: 0.9,
    });
    const canopyPositions = [
      [0, 1.8, 0], [0.55, 1.6, 0], [-0.55, 1.6, 0],
      [0.35, 1.7, 0.4], [-0.35, 1.7, -0.4],
      [0, 2.1, 0.3], [0, 2.1, -0.3],
    ];
    canopyPositions.forEach(([cx, cy, cz], i) => {
      const r = 0.18 + Math.random() * 0.12;
      const leafGeo = new THREE.SphereGeometry(r, 8, 8);
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.position.set(cx as number, cy as number, cz as number);
      leaf.castShadow = true;
      treeGroup.add(leaf);
      // Floating icon on each leaf cluster
      if (i < 5) {
        const iconGeo = new THREE.TorusGeometry(0.12, 0.025, 8, 16);
        const iconMat = new THREE.MeshStandardMaterial({
          color: 0xffcc00,
          emissive: new THREE.Color(0xffaa00),
          emissiveIntensity: 1.2,
          metalness: 0.9,
          roughness: 0.1,
        });
        const icon = new THREE.Mesh(iconGeo, iconMat);
        icon.position.set(cx as number, (cy as number) + r + 0.15, cz as number);
        treeGroup.add(icon);
      }
    });

    scene.add(treeGroup);

    // ══════════════════════════════════════════════════════════════════════
    // FLOATING GOLD COINS
    // ══════════════════════════════════════════════════════════════════════
    const coinCount = 22;
    const coinGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.04, 16);
    const coinMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 1.0,
      roughness: 0.15,
      emissive: new THREE.Color(0x886600),
      emissiveIntensity: 0.4,
    });
    const coins = new THREE.InstancedMesh(coinGeo, coinMat, coinCount);
    coins.castShadow = true;

    const coinData: { pos: THREE.Vector3; vel: THREE.Vector3; rot: THREE.Euler; phase: number }[] = [];
    const dummy = new THREE.Object3D();
    for (let i = 0; i < coinCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 1.5 + Math.random() * 2.5;
      const posY = -1.5 + Math.random() * 4;
      const pos = new THREE.Vector3(
        Math.cos(angle) * radius,
        posY,
        Math.sin(angle) * radius - 0.5
      );
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 0.008,
        0.005 + Math.random() * 0.01,
        (Math.random() - 0.5) * 0.005
      );
      const rot = new THREE.Euler(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      const phase = Math.random() * Math.PI * 2;
      coinData.push({ pos, vel, rot, phase });

      dummy.position.copy(pos);
      dummy.rotation.copy(rot);
      dummy.updateMatrix();
      coins.setMatrixAt(i, dummy.matrix);
    }
    coins.instanceMatrix.needsUpdate = true;
    scene.add(coins);

    // ══════════════════════════════════════════════════════════════════════
    // GLOWING PARTICLES
    // ══════════════════════════════════════════════════════════════════════
    const particleCount = 500;
    const pPositions = new Float32Array(particleCount * 3);
    const pColors = new Float32Array(particleCount * 3);
    const pSizes = new Float32Array(particleCount);
    const pVelocities: { vx: number; vy: number; vz: number; phase: number }[] = [];

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.5 + Math.random() * 4.5;
      pPositions[i * 3] = Math.cos(angle) * radius;
      pPositions[i * 3 + 1] = -2 + Math.random() * 6;
      pPositions[i * 3 + 2] = Math.sin(angle) * radius - 1;

      // Mix emerald green and gold
      const isGold = Math.random() > 0.6;
      pColors[i * 3] = isGold ? 1.0 : 0.0;
      pColors[i * 3 + 1] = isGold ? 0.85 : 1.0;
      pColors[i * 3 + 2] = isGold ? 0.0 : 0.55;

      pSizes[i] = 1.5 + Math.random() * 3.5;
      pVelocities.push({
        vx: (Math.random() - 0.5) * 0.003,
        vy: 0.003 + Math.random() * 0.007,
        vz: (Math.random() - 0.5) * 0.003,
        phase: Math.random() * Math.PI * 2,
      });
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.BufferAttribute(pPositions, 3));
    particleGeo.setAttribute("color", new THREE.BufferAttribute(pColors, 3));
    particleGeo.setAttribute("size", new THREE.BufferAttribute(pSizes, 1));

    const particleMat = new THREE.PointsMaterial({
      size: 0.06,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // ══════════════════════════════════════════════════════════════════════
    // CITY SKYLINE
    // ══════════════════════════════════════════════════════════════════════
    const cityGroup = new THREE.Group();
    cityGroup.position.set(0, -2.5, -5);
    const buildingMat = new THREE.MeshStandardMaterial({
      color: 0x0a1a35,
      metalness: 0.3,
      roughness: 0.7,
      emissive: new THREE.Color(0x001133),
      emissiveIntensity: 0.5,
    });
    const windowMat = new THREE.MeshStandardMaterial({
      color: 0x88ccff,
      emissive: new THREE.Color(0x4488ff),
      emissiveIntensity: 1.2,
      transparent: true,
      opacity: 0.9,
    });
    const buildingDefs = [
      { x: -7, w: 0.8, h: 3.5, d: 0.6 },
      { x: -5.5, w: 1.0, h: 5.0, d: 0.7 },
      { x: -4.0, w: 0.7, h: 2.8, d: 0.5 },
      { x: -2.8, w: 0.9, h: 4.2, d: 0.6 },
      { x: -1.8, w: 1.2, h: 6.5, d: 0.8 },
      { x: -0.4, w: 0.8, h: 3.0, d: 0.5 },
      { x: 0.6, w: 1.1, h: 5.8, d: 0.7 },
      { x: 2.0, w: 0.9, h: 4.0, d: 0.6 },
      { x: 3.1, w: 1.3, h: 7.0, d: 0.9 },
      { x: 4.6, w: 0.8, h: 3.5, d: 0.6 },
      { x: 5.6, w: 1.0, h: 4.8, d: 0.7 },
      { x: 7.0, w: 0.9, h: 3.2, d: 0.6 },
    ];
    buildingDefs.forEach(({ x, w, h, d }) => {
      const bGeo = new THREE.BoxGeometry(w, h, d);
      const b = new THREE.Mesh(bGeo, buildingMat);
      b.position.set(x, h / 2, 0);
      cityGroup.add(b);
      // windows
      for (let floor = 0; floor < Math.floor(h / 0.6); floor++) {
        for (let col = 0; col < Math.floor(w / 0.25); col++) {
          if (Math.random() > 0.4) {
            const wGeo = new THREE.PlaneGeometry(0.12, 0.12);
            const win = new THREE.Mesh(wGeo, windowMat);
            win.position.set(
              x - w / 2 + 0.18 + col * 0.25,
              0.4 + floor * 0.6,
              d / 2 + 0.01
            );
            cityGroup.add(win);
          }
        }
      }
    });
    scene.add(cityGroup);

    // ══════════════════════════════════════════════════════════════════════
    // DATA PANELS (floating holographic charts)
    // ══════════════════════════════════════════════════════════════════════
    function makeChartTexture(label: string, color: string) {
      const c = document.createElement("canvas");
      c.width = 256;
      c.height = 160;
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = "rgba(0,20,40,0.85)";
      ctx.roundRect(0, 0, 256, 160, 12);
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(1, 1, 254, 158);
      ctx.fillStyle = color;
      ctx.font = "bold 18px Arial";
      ctx.fillText(label, 14, 28);
      // Bar chart
      const bars = [0.3, 0.55, 0.4, 0.7, 0.5, 0.8, 0.65];
      bars.forEach((v, i) => {
        const bh = v * 90;
        const bx = 14 + i * 33;
        const by = 140 - bh;
        ctx.fillStyle = color + "cc";
        ctx.fillRect(bx, by, 26, bh);
      });
      // Line
      ctx.strokeStyle = "#00ffaa";
      ctx.lineWidth = 2;
      ctx.beginPath();
      [0.4, 0.5, 0.35, 0.6, 0.5, 0.75, 0.65].forEach((v, i) => {
        const px = 27 + i * 33;
        const py = 140 - v * 90;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      });
      ctx.stroke();
      return new THREE.CanvasTexture(c);
    }

    const panels = [
      { pos: [-3.2, 0.8, -1.5], rot: [0, 0.5, 0], label: "الدخل", color: "#00ff88" },
      { pos: [3.2, 0.8, -1.5], rot: [0, -0.5, 0], label: "المدخرات", color: "#4499ff" },
      { pos: [-2.8, -0.8, -1.0], rot: [0, 0.4, 0], label: "الإنفاق", color: "#ffcc00" },
    ];

    const panelGroup = new THREE.Group();
    panels.forEach(({ pos, rot, label, color }) => {
      const tex = makeChartTexture(label, color);
      const pGeo = new THREE.PlaneGeometry(1.6, 1.0);
      const pMat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        opacity: 0.88,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const panel = new THREE.Mesh(pGeo, pMat);
      panel.position.set(...(pos as [number, number, number]));
      panel.rotation.set(...(rot as [number, number, number]));
      panelGroup.add(panel);
    });
    scene.add(panelGroup);

    // ══════════════════════════════════════════════════════════════════════
    // ENERGY BEAMS (lines from heart to panels)
    // ══════════════════════════════════════════════════════════════════════
    const beamMat = new THREE.LineBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
    });
    [[-3.2, 0.8, -1.5], [3.2, 0.8, -1.5], [-2.8, -0.8, -1.0]].forEach(([tx, ty, tz]) => {
      const pts = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(tx as number, ty as number, tz as number),
      ];
      const beamGeo = new THREE.BufferGeometry().setFromPoints(pts);
      scene.add(new THREE.Line(beamGeo, beamMat));
    });

    // ══════════════════════════════════════════════════════════════════════
    // PLATFORM / BASE
    // ══════════════════════════════════════════════════════════════════════
    const platformGeo = new THREE.CylinderGeometry(1.8, 2.0, 0.12, 32);
    const platformMat = new THREE.MeshPhysicalMaterial({
      color: 0x0a2a4a,
      metalness: 0.8,
      roughness: 0.1,
      reflectivity: 0.9,
      transparent: true,
      opacity: 0.85,
    });
    const platform = new THREE.Mesh(platformGeo, platformMat);
    platform.position.set(0, -1.55, 0);
    platform.receiveShadow = true;
    scene.add(platform);

    // Rings around platform
    for (let r = 0; r < 3; r++) {
      const ringGeo = new THREE.TorusGeometry(1.9 + r * 0.3, 0.015, 8, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x00ff88,
        transparent: true,
        opacity: 0.25 - r * 0.07,
        blending: THREE.AdditiveBlending,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = -1.5;
      scene.add(ring);
    }

    // ══════════════════════════════════════════════════════════════════════
    // ANIMATION LOOP
    // ══════════════════════════════════════════════════════════════════════
    let frameId: number;
    let time = 0;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      time += 0.016;

      // Heartbeat pulse
      const beat = 1 + Math.sin(time * 2.5) * 0.04 + Math.pow(Math.max(0, Math.sin(time * 2.5)), 8) * 0.08;
      heartMesh.scale.setScalar(beat * 0.9);
      innerHeart.scale.setScalar(beat * 0.82);
      emeraldGlow.intensity = 8 + Math.sin(time * 2.5) * 3 + Math.pow(Math.max(0, Math.sin(time * 2.5)), 8) * 5;

      // Heart float
      heartMesh.position.y = Math.sin(time * 0.6) * 0.08;
      heartMesh.rotation.y = Math.sin(time * 0.3) * 0.15;
      innerHeart.position.y = heartMesh.position.y;
      innerHeart.rotation.y = heartMesh.rotation.y;

      // Tree sway
      treeGroup.rotation.z = Math.sin(time * 0.4) * 0.02;
      treeGroup.position.y = 0.9 + heartMesh.position.y;

      // Coins
      for (let i = 0; i < coinCount; i++) {
        const cd = coinData[i];
        cd.pos.x += cd.vel.x + Math.sin(time + cd.phase) * 0.002;
        cd.pos.y += cd.vel.y;
        cd.pos.z += cd.vel.z;
        cd.rot.x += 0.025;
        cd.rot.z += 0.015;
        // reset if too high
        if (cd.pos.y > 3.5) {
          const angle = Math.random() * Math.PI * 2;
          const radius = 1.5 + Math.random() * 2.5;
          cd.pos.set(Math.cos(angle) * radius, -1.5, Math.sin(angle) * radius - 0.5);
        }
        dummy.position.copy(cd.pos);
        dummy.rotation.copy(cd.rot);
        dummy.updateMatrix();
        coins.setMatrixAt(i, dummy.matrix);
      }
      coins.instanceMatrix.needsUpdate = true;

      // Particles
      const pos = particleGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        const pv = pVelocities[i];
        pos[i * 3] += pv.vx + Math.sin(time * 0.5 + pv.phase) * 0.001;
        pos[i * 3 + 1] += pv.vy;
        pos[i * 3 + 2] += pv.vz;
        if (pos[i * 3 + 1] > 4) pos[i * 3 + 1] = -2;
      }
      particleGeo.attributes.position.needsUpdate = true;

      // Panels gentle float
      panelGroup.children.forEach((p, i) => {
        p.position.y += Math.sin(time * 0.5 + i * 1.2) * 0.001;
      });

      // Mouse parallax
      const tx = mouseX * 0.4;
      const ty = mouseY * 0.2;
      camera.position.x += (tx - camera.position.x) * 0.05;
      camera.position.y += (ty + 1.5 - camera.position.y) * 0.05;
      camera.lookAt(0, 0.5, 0);

      // Gold light flicker
      goldLight.intensity = 3 + Math.sin(time * 1.3) * 0.5;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(frameId);
      ro.disconnect();
      mount.removeEventListener("mousemove", onMouseMove);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  if (webglFailed) {
    return <FallbackScene />;
  }

  return (
    <div
      ref={mountRef}
      className="w-full h-full"
      style={{ minHeight: "500px", cursor: "default" }}
    />
  );
}
