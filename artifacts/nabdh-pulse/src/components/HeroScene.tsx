import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

// ─────────────────────────────────────────────────────────────────────────────
// CSS Fallback (no WebGL)
// ─────────────────────────────────────────────────────────────────────────────
function FallbackScene() {
  return (
    <div
      className="w-full h-full relative overflow-hidden"
      style={{ background: "radial-gradient(ellipse at 50% 40%, #051e10 0%, #020b18 70%)" }}
    >
      {/* City silhouette */}
      <svg viewBox="0 0 640 200" className="absolute bottom-0 left-0 w-full opacity-25" preserveAspectRatio="none">
        {[
          [0,100,44,100],[48,60,56,140],[108,95,38,105],[150,45,62,155],
          [216,68,48,132],[268,18,72,182],[344,58,52,142],[400,32,68,168],
          [472,72,42,128],[518,52,58,148],[580,82,44,118],
        ].map(([x,y,w,h],i)=>(
          <rect key={i} x={x} y={y} width={w} height={h} fill="#0d2a4a"/>
        ))}
      </svg>
      {/* Glow rings */}
      {[160,120,80].map((r,i)=>(
        <div key={i} className="absolute rounded-full border" style={{
          width:r*2,height:r*2,top:"46%",left:"50%",
          transform:"translate(-50%,-50%)",
          borderColor:`rgba(0,255,136,${0.12-i*0.035})`,
          boxShadow:`0 0 ${24+i*12}px rgba(0,255,136,${0.07-i*0.02})`,
          animation:`rpulse ${2+i*0.5}s ease-in-out infinite alternate`,
        }}/>
      ))}
      {/* Heart SVG */}
      <div className="absolute inset-0 flex items-center justify-center" style={{paddingBottom:"6%"}}>
        <svg viewBox="-1.2 -1.2 2.4 2.4" className="w-52 h-52" style={{filter:"drop-shadow(0 0 18px #00ff88) drop-shadow(0 0 38px #00884455)"}}>
          <defs>
            <linearGradient id="hgr" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00ffaa" stopOpacity="0.95"/>
              <stop offset="50%" stopColor="#00ccdd" stopOpacity="0.75"/>
              <stop offset="100%" stopColor="#0066ff" stopOpacity="0.55"/>
            </linearGradient>
          </defs>
          {/* Heart path: tip at bottom, lobes at top */}
          <path d="M0,-0.9 C0.2,-1.1 1.05,-0.9 1.05,-0.15 C1.05,0.5 0.55,0.85 0,0.55 C-0.55,0.85 -1.05,0.5 -1.05,-0.15 C-1.05,-0.9 -0.2,-1.1 0,-0.9Z"
            fill="url(#hgr)" stroke="#00ffaa" strokeWidth="0.05" opacity="0.9"/>
          {/* EKG line */}
          <polyline points="-0.75,-0.2 -0.5,-0.2 -0.38,-0.5 -0.28,0.15 -0.16,-0.65 -0.06,0.22 0.04,-0.2 0.22,-0.2 0.32,-0.38 0.44,-0.05 0.56,-0.2 0.75,-0.2"
            fill="none" stroke="#00ff88" strokeWidth="0.04" opacity="0.85"
            style={{filter:"drop-shadow(0 0 2px #00ff88)"}}/>
        </svg>
      </div>
      {/* Tree trunk */}
      <div className="absolute" style={{bottom:"46%",left:"50%",transform:"translateX(-50%)",
        width:8,height:70,background:"linear-gradient(to top,#a06010,#c8902a)",borderRadius:4,
        boxShadow:"0 0 10px rgba(200,144,42,0.5)"}}>
        {/* Branch left */}
        <div style={{position:"absolute",top:10,left:4,width:55,height:6,
          background:"linear-gradient(to right,#c8902a,#a06010)",borderRadius:3,transformOrigin:"left center",
          transform:"rotate(-30deg)",boxShadow:"0 0 6px rgba(200,144,42,0.4)"}}/>
        {/* Branch right */}
        <div style={{position:"absolute",top:20,right:4,width:55,height:6,
          background:"linear-gradient(to left,#c8902a,#a06010)",borderRadius:3,transformOrigin:"right center",
          transform:"rotate(30deg)",boxShadow:"0 0 6px rgba(200,144,42,0.4)"}}/>
      </div>
      {/* Floating coins */}
      {[...Array(9)].map((_,i)=>(
        <div key={i} className="absolute rounded-full" style={{
          width:16,height:16,
          background:"radial-gradient(circle at 35% 35%,#ffe066,#b8860b)",
          boxShadow:"0 0 8px rgba(255,215,0,0.7)",
          left:`${10+(i%3)*28}%`,top:`${15+Math.floor(i/3)*25}%`,
          animation:`rfloat ${1.8+(i*0.25)}s ease-in-out infinite alternate`,
          animationDelay:`${i*0.15}s`,
        }}/>
      ))}
      {/* Data tags */}
      {[{l:"4%",t:"28%",lbl:"الدخل",c:"#00ff88"},{l:"74%",t:"28%",lbl:"المدخرات",c:"#44aaff"},{l:"8%",t:"64%",lbl:"الإنفاق",c:"#ffcc00"}].map((p,i)=>(
        <div key={i} className="absolute rounded-lg px-3 py-1.5 text-xs font-bold border" style={{
          left:p.l,top:p.t,background:"rgba(0,16,36,0.82)",borderColor:p.c+"55",color:p.c,
          boxShadow:`0 0 14px ${p.c}22`,animation:`rfloat ${2.2+i*0.4}s ease-in-out infinite alternate`,
          animationDelay:`${i*0.3}s`,whiteSpace:"nowrap",
        }}>
          {p.lbl} ↑
        </div>
      ))}
      <style>{`
        @keyframes rfloat{from{transform:translateY(0)}to{transform:translateY(-10px)}}
        @keyframes rpulse{from{opacity:0.5}to{opacity:1}}
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function makeTube(
  points: THREE.Vector3[],
  radius: number,
  segs = 8,
  radialSegs = 6
): THREE.TubeGeometry {
  const curve = new THREE.CatmullRomCurve3(points);
  return new THREE.TubeGeometry(curve, segs, radius, radialSegs, false);
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
export function HeroScene() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [webglFailed, setWebglFailed] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // ── Renderer ─────────────────────────────────────────────────────────────
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
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
    renderer.toneMappingExposure = 1.4;
    mount.appendChild(renderer.domElement);

    // ── Scene & camera ───────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030d1a);
    scene.fog = new THREE.FogExp2(0x030d1a, 0.028);

    const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 200);
    camera.position.set(0, 1.8, 9);
    camera.lookAt(0, 0.4, 0);

    // ── Resize ───────────────────────────────────────────────────────────────
    const resize = () => {
      const w = mount.clientWidth, h = mount.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(mount);
    resize();

    // ── Mouse parallax ───────────────────────────────────────────────────────
    let mouseX = 0, mouseY = 0;
    const onMouseMove = (e: MouseEvent) => {
      const r = mount.getBoundingClientRect();
      mouseX = ((e.clientX - r.left) / r.width - 0.5) * 2;
      mouseY = -((e.clientY - r.top) / r.height - 0.5) * 2;
    };
    mount.addEventListener("mousemove", onMouseMove);

    // ═══════════════════════════════════════════════════════════════════════
    // LIGHTING — cinematic multi-light rig
    // ═══════════════════════════════════════════════════════════════════════
    scene.add(new THREE.AmbientLight(0x061628, 4));

    // Key light — cool blue from upper-left
    const keyLight = new THREE.DirectionalLight(0x88bbff, 3.5);
    keyLight.position.set(-4, 10, 6);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    keyLight.shadow.camera.near = 0.1;
    keyLight.shadow.camera.far = 30;
    keyLight.shadow.camera.left = -8;
    keyLight.shadow.camera.right = 8;
    keyLight.shadow.camera.top = 8;
    keyLight.shadow.camera.bottom = -8;
    scene.add(keyLight);

    // Heart core glow — emerald
    const coreGlow = new THREE.PointLight(0x00ff88, 14, 7);
    coreGlow.position.set(0, 0.5, 0.6);
    scene.add(coreGlow);

    // Rim light — warm gold from right
    const rimLight = new THREE.PointLight(0xffcc44, 5, 10);
    rimLight.position.set(4, 3, 3);
    scene.add(rimLight);

    // Blue fill from left
    const fillLight = new THREE.PointLight(0x0055ff, 2.5, 12);
    fillLight.position.set(-5, 1, -2);
    scene.add(fillLight);

    // Tree warm glow from below
    const treeGlow = new THREE.PointLight(0xffaa22, 3, 7);
    treeGlow.position.set(0, -1.5, -0.5);
    scene.add(treeGlow);

    // ═══════════════════════════════════════════════════════════════════════
    // HEART — correctly oriented crystal glass
    // ═══════════════════════════════════════════════════════════════════════
    // Shape: tip at bottom (y = -1), lobes curve up (y ≈ +0.55), dip at (0, +0.45)
    const heartShape = new THREE.Shape();
    heartShape.moveTo(0, -0.95);                                // tip at bottom
    heartShape.bezierCurveTo( 0.18,-1.15,  1.0,-0.85,  1.0,-0.12); // right lobe lower
    heartShape.bezierCurveTo( 1.0,  0.48,  0.52, 0.82,  0,  0.46); // right lobe upper → dip
    heartShape.bezierCurveTo(-0.52, 0.82, -1.0,  0.48, -1.0,-0.12); // left lobe upper
    heartShape.bezierCurveTo(-1.0, -0.85, -0.18,-1.15,  0, -0.95); // left lobe lower → tip

    const heartGeo = new THREE.ExtrudeGeometry(heartShape, {
      depth: 0.55,
      bevelEnabled: true,
      bevelSegments: 10,
      steps: 2,
      bevelSize: 0.1,
      bevelThickness: 0.09,
    });
    heartGeo.center();

    // Premium crystal glass material
    const heartMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0xaaffee),
      metalness: 0.0,
      roughness: 0.01,
      transmission: 0.92,
      thickness: 1.4,
      ior: 1.75,
      reflectivity: 1.0,
      envMapIntensity: 3.5,
      transparent: true,
      opacity: 0.94,
      side: THREE.DoubleSide,
      attenuationColor: new THREE.Color(0x00ff88),
      attenuationDistance: 1.0,
    });

    const heartMesh = new THREE.Mesh(heartGeo, heartMat);
    heartMesh.scale.setScalar(1.25);
    heartMesh.castShadow = true;
    scene.add(heartMesh);

    // Inner crystal shell — darker, slightly smaller, back-face only
    const innerMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0x00ff88),
      emissive: new THREE.Color(0x00ff88),
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.22,
      side: THREE.BackSide,
      transmission: 0.7,
      roughness: 0.02,
    });
    const innerHeart = new THREE.Mesh(heartGeo, innerMat);
    innerHeart.scale.setScalar(1.18);
    scene.add(innerHeart);

    // Outer glow shell
    const glowMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0x00ff88),
      transparent: true,
      opacity: 0.06,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const glowShell = new THREE.Mesh(heartGeo, glowMat);
    glowShell.scale.setScalar(1.38);
    scene.add(glowShell);

    // EKG line on heart face
    const ekgPts: THREE.Vector3[] = [];
    const ekgSegs = 80;
    for (let i = 0; i <= ekgSegs; i++) {
      const t = i / ekgSegs;
      const xp = (t - 0.5) * 1.4;
      let yp = 0;
      const tc = t;
      if (tc > 0.25 && tc < 0.32) yp = 0.25;
      else if (tc > 0.32 && tc < 0.36) yp = -0.12;
      else if (tc > 0.36 && tc < 0.41) yp = 0.75;
      else if (tc > 0.41 && tc < 0.46) yp = -0.28;
      else if (tc > 0.46 && tc < 0.53) yp = 0.2;
      ekgPts.push(new THREE.Vector3(xp, yp * 0.3 - 0.18, 0.34));
    }
    const ekgLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(ekgPts),
      new THREE.LineBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.95,
        blending: THREE.AdditiveBlending })
    );
    heartMesh.add(ekgLine);

    // ═══════════════════════════════════════════════════════════════════════
    // FINANCIAL TREE — trunk + branches (TubeGeometry) + crystal leaves + coins
    // ═══════════════════════════════════════════════════════════════════════
    const treeRoot = new THREE.Group();
    scene.add(treeRoot);

    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0xc8902a, metalness: 0.65, roughness: 0.25,
      emissive: new THREE.Color(0x6a4000), emissiveIntensity: 0.25,
    });
    const branchMat = new THREE.MeshStandardMaterial({
      color: 0xd4a030, metalness: 0.55, roughness: 0.3,
      emissive: new THREE.Color(0x5a3800), emissiveIntensity: 0.2,
    });

    // Trunk — emerges from below and behind the heart
    const trunkPts = [
      new THREE.Vector3(0, -3.2, -0.6),
      new THREE.Vector3(0, -2.4, -0.5),
      new THREE.Vector3(0, -1.6, -0.35),
      new THREE.Vector3(0, -1.0, -0.2),
    ];
    treeRoot.add(new THREE.Mesh(makeTube(trunkPts, 0.15, 12, 8), trunkMat));

    // Branch definitions: [start, mid1, mid2, end, radius]
    // Branches frame the heart — go behind and to the sides
    type BranchDef = [THREE.Vector3, THREE.Vector3, THREE.Vector3, THREE.Vector3, number];
    const branchDefs: BranchDef[] = [
      // Left main arm
      [new THREE.Vector3(0,-1.2,-0.25), new THREE.Vector3(-0.6,-0.8,-0.5), new THREE.Vector3(-1.3,-0.2,-0.8), new THREE.Vector3(-2.0, 0.5,-1.0), 0.075],
      // Right main arm
      [new THREE.Vector3(0,-1.2,-0.25), new THREE.Vector3( 0.6,-0.8,-0.5), new THREE.Vector3( 1.3,-0.2,-0.8), new THREE.Vector3( 2.0, 0.5,-1.0), 0.075],
      // Left upper arm — frames top-left of heart
      [new THREE.Vector3(-1.1,-0.0,-0.7), new THREE.Vector3(-1.5, 0.6,-0.8), new THREE.Vector3(-1.6, 1.2,-0.6), new THREE.Vector3(-1.2, 1.9,-0.4), 0.052],
      // Right upper arm — frames top-right
      [new THREE.Vector3( 1.1,-0.0,-0.7), new THREE.Vector3( 1.5, 0.6,-0.8), new THREE.Vector3( 1.6, 1.2,-0.6), new THREE.Vector3( 1.2, 1.9,-0.4), 0.052],
      // Crown left — arcs over top of heart
      [new THREE.Vector3(-1.2, 1.9,-0.4), new THREE.Vector3(-0.7, 2.4,-0.3), new THREE.Vector3(-0.2, 2.6,-0.2), new THREE.Vector3( 0.0, 2.7,-0.15), 0.035],
      // Crown right
      [new THREE.Vector3( 1.2, 1.9,-0.4), new THREE.Vector3( 0.7, 2.4,-0.3), new THREE.Vector3( 0.2, 2.6,-0.2), new THREE.Vector3( 0.0, 2.7,-0.15), 0.035],
      // Left lower sub-branch
      [new THREE.Vector3(-1.5,-0.2,-0.85), new THREE.Vector3(-1.9,-0.5,-0.7), new THREE.Vector3(-2.3,-0.6,-0.5), new THREE.Vector3(-2.5,-0.4,-0.3), 0.04],
      // Right lower sub-branch
      [new THREE.Vector3( 1.5,-0.2,-0.85), new THREE.Vector3( 1.9,-0.5,-0.7), new THREE.Vector3( 2.3,-0.6,-0.5), new THREE.Vector3( 2.5,-0.4,-0.3), 0.04],
      // Left inner sub — close to heart edge
      [new THREE.Vector3(-0.6,-0.8,-0.5), new THREE.Vector3(-0.8,-0.3,-0.3), new THREE.Vector3(-1.0, 0.2,-0.25), new THREE.Vector3(-1.1, 0.6,-0.2), 0.035],
      // Right inner sub
      [new THREE.Vector3( 0.6,-0.8,-0.5), new THREE.Vector3( 0.8,-0.3,-0.3), new THREE.Vector3( 1.0, 0.2,-0.25), new THREE.Vector3( 1.1, 0.6,-0.2), 0.035],
    ];

    branchDefs.forEach(([s, m1, m2, e, r]) => {
      const curve = new THREE.CubicBezierCurve3(s, m1, m2, e);
      const geo = new THREE.TubeGeometry(curve, 10, r, 6, false);
      treeRoot.add(new THREE.Mesh(geo, branchMat));
    });

    // ── Crystal leaves ────────────────────────────────────────────────────
    const crystalLeafMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0x44ffaa),
      metalness: 0.0, roughness: 0.04,
      transmission: 0.82, thickness: 0.3, ior: 1.55,
      transparent: true, opacity: 0.88,
      emissive: new THREE.Color(0x003322), emissiveIntensity: 0.4,
      side: THREE.DoubleSide,
    });
    const leafGeo = new THREE.OctahedronGeometry(0.13, 0);

    // Leaf cluster positions (at branch tips and nodes)
    const leafPositions = [
      // Left arm
      [-2.0, 0.5,-1.0], [-2.25,-0.3,-0.25], [-2.5,-0.4,-0.3],
      // Right arm
      [ 2.0, 0.5,-1.0], [ 2.25,-0.3,-0.25], [ 2.5,-0.4,-0.3],
      // Upper arms
      [-1.2, 1.9,-0.4], [ 1.2, 1.9,-0.4],
      // Crown
      [ 0.0, 2.7,-0.15], [-0.5, 2.55,-0.18], [ 0.5, 2.55,-0.18],
      [-1.0, 2.2,-0.3],  [ 1.0, 2.2,-0.3],
      // Inner subs
      [-1.1, 0.6,-0.2],  [ 1.1, 0.6,-0.2],
    ];
    leafPositions.forEach(([lx,ly,lz]) => {
      // Cluster of 3–5 leaves per point
      for (let k = 0; k < 4; k++) {
        const leaf = new THREE.Mesh(leafGeo, crystalLeafMat);
        leaf.position.set(
          lx + (Math.random()-0.5)*0.28,
          ly + (Math.random()-0.5)*0.28,
          lz + (Math.random()-0.5)*0.18
        );
        leaf.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);
        leaf.scale.setScalar(0.7 + Math.random()*0.7);
        leaf.castShadow = true;
        treeRoot.add(leaf);
      }
    });

    // ── Gold coins on branches ─────────────────────────────────────────────
    const coinGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.035, 18);
    const coinMat = new THREE.MeshStandardMaterial({
      color: 0xffd700, metalness: 1.0, roughness: 0.08,
      emissive: new THREE.Color(0x885500), emissiveIntensity: 0.35,
    });
    // Edge ring on coin
    const coinRingGeo = new THREE.TorusGeometry(0.15, 0.018, 6, 18);
    const coinRingMat = new THREE.MeshStandardMaterial({
      color: 0xffa500, metalness: 1.0, roughness: 0.05,
      emissive: new THREE.Color(0x663300), emissiveIntensity: 0.4,
    });

    const coinBranchPoints = [
      [-1.5, 0.1,-0.9], [ 1.5, 0.1,-0.9],
      [-1.8, 0.4,-0.95],[ 1.8, 0.4,-0.95],
      [-0.9,-0.5,-0.4], [ 0.9,-0.5,-0.4],
      [ 0.0, 2.7,-0.15],[-1.0, 2.2,-0.3],[ 1.0, 2.2,-0.3],
      [-2.1,-0.1,-0.6], [ 2.1,-0.1,-0.6],
    ];
    coinBranchPoints.forEach(([cx,cy,cz]) => {
      const coin = new THREE.Mesh(coinGeo, coinMat);
      coin.position.set(cx as number, cy as number, cz as number);
      coin.rotation.set(Math.PI/2 + (Math.random()-0.5)*0.4, Math.random()*Math.PI*2, 0);
      coin.castShadow = true;
      treeRoot.add(coin);
      const ring = new THREE.Mesh(coinRingGeo, coinRingMat);
      ring.position.copy(coin.position);
      ring.rotation.copy(coin.rotation);
      treeRoot.add(ring);
    });

    // ═══════════════════════════════════════════════════════════════════════
    // GLOWING PARTICLES
    // ═══════════════════════════════════════════════════════════════════════
    const PCOUNT = 420;
    const pPos = new Float32Array(PCOUNT * 3);
    const pCol = new Float32Array(PCOUNT * 3);
    type PVel = {vx:number;vy:number;vz:number;phase:number};
    const pVels: PVel[] = [];

    for (let i = 0; i < PCOUNT; i++) {
      const a = Math.random() * Math.PI * 2;
      const rad = 0.6 + Math.random() * 4;
      pPos[i*3]   = Math.cos(a)*rad;
      pPos[i*3+1] = -2.5 + Math.random()*6.5;
      pPos[i*3+2] = Math.sin(a)*rad - 0.5;
      const isGold = Math.random() > 0.55;
      pCol[i*3]   = isGold ? 1.0 : 0.05;
      pCol[i*3+1] = isGold ? 0.82: 1.0;
      pCol[i*3+2] = isGold ? 0.02: 0.52;
      pVels.push({ vx:(Math.random()-0.5)*0.003, vy:0.003+Math.random()*0.008,
                   vz:(Math.random()-0.5)*0.003, phase:Math.random()*Math.PI*2 });
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos,3));
    pGeo.setAttribute("color",    new THREE.BufferAttribute(pCol,3));
    const pMat = new THREE.PointsMaterial({
      size:0.055, vertexColors:true, transparent:true, opacity:0.88,
      blending:THREE.AdditiveBlending, depthWrite:false, sizeAttenuation:true,
    });
    scene.add(new THREE.Points(pGeo, pMat));

    // ═══════════════════════════════════════════════════════════════════════
    // GROUND PLATFORM
    // ═══════════════════════════════════════════════════════════════════════
    const platform = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 2.5, 0.1, 48),
      new THREE.MeshStandardMaterial({
        color:0x0a1e38, metalness:0.85, roughness:0.08,
        emissive:new THREE.Color(0x001122), emissiveIntensity:0.4,
      })
    );
    platform.position.set(0, -2.8, -0.3);
    platform.receiveShadow = true;
    scene.add(platform);

    // Glow rings on platform
    for (let ri = 0; ri < 4; ri++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(2.2 + ri*0.28, 0.012, 6, 64),
        new THREE.MeshBasicMaterial({
          color:0x00ff88, transparent:true,
          opacity:0.18 - ri*0.04,
          blending:THREE.AdditiveBlending,
        })
      );
      ring.rotation.x = Math.PI/2;
      ring.position.set(0, -2.74, -0.3);
      scene.add(ring);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CITY SKYLINE (distant background)
    // ═══════════════════════════════════════════════════════════════════════
    const cityGroup = new THREE.Group();
    cityGroup.position.set(0, -3.5, -7);
    const bldMat = new THREE.MeshStandardMaterial({
      color:0x0a1a30, metalness:0.2, roughness:0.8,
      emissive:new THREE.Color(0x000d22), emissiveIntensity:0.5,
    });
    const winMat = new THREE.MeshBasicMaterial({
      color:0x88ccff, transparent:true, opacity:0.75,
      blending:THREE.AdditiveBlending,
    });
    [
      {x:-6.5,h:4,w:0.9,d:0.6},{x:-5.0,h:6,w:1.1,d:0.7},{x:-3.5,h:3.5,w:0.8,d:0.5},
      {x:-2.2,h:5,w:1.0,d:0.6},{x:-1.0,h:7.5,w:1.2,d:0.8},{x: 0.4,h:4,w:0.8,d:0.5},
      {x: 1.5,h:6.5,w:1.1,d:0.7},{x: 3.0,h:4.5,w:0.9,d:0.6},{x: 4.2,h:8,w:1.3,d:0.9},
      {x: 5.7,h:3.5,w:0.8,d:0.5},{x: 7.0,h:5.5,w:1.0,d:0.7},
    ].forEach(({x,h,w,d}) => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), bldMat);
      b.position.set(x, h/2, 0);
      cityGroup.add(b);
      for (let f=0;f<Math.floor(h/0.65);f++) {
        for (let c=0;c<Math.floor(w/0.28);c++) {
          if (Math.random()<0.45) {
            const wm = new THREE.Mesh(new THREE.PlaneGeometry(0.12,0.12), winMat);
            wm.position.set(x - w/2+0.18+c*0.28, 0.4+f*0.65, d/2+0.01);
            cityGroup.add(wm);
          }
        }
      }
    });
    scene.add(cityGroup);

    // ═══════════════════════════════════════════════════════════════════════
    // HOLOGRAPHIC DATA PANELS
    // ═══════════════════════════════════════════════════════════════════════
    function makePanel(label: string, col: string, bars: number[]) {
      const c = document.createElement("canvas");
      c.width=240; c.height=144;
      const ctx = c.getContext("2d")!;
      ctx.clearRect(0,0,240,144);
      ctx.fillStyle="rgba(2,12,28,0.88)";
      ctx.beginPath(); ctx.roundRect(0,0,240,144,10); ctx.fill();
      ctx.strokeStyle=col; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.roundRect(1,1,238,142,10); ctx.stroke();
      ctx.fillStyle=col; ctx.font="bold 16px Arial"; ctx.fillText(label,12,24);
      bars.forEach((v,i)=>{
        const bh=v*72, bx=12+i*31, by=126-bh;
        ctx.fillStyle=col+"bb"; ctx.fillRect(bx,by,22,bh);
      });
      // sparkline
      ctx.strokeStyle="#00ffaa"; ctx.lineWidth=1.8; ctx.beginPath();
      bars.forEach((v,i)=>{ const px=23+i*31, py=126-v*72; i===0?ctx.moveTo(px,py):ctx.lineTo(px,py); });
      ctx.stroke();
      return new THREE.CanvasTexture(c);
    }
    const panelDefs = [
      {pos:[-3.0, 0.6,-1.8] as [number,number,number], rot:[0, 0.55,0] as [number,number,number], label:"الدخل",     col:"#00ff88", bars:[0.4,0.55,0.38,0.7,0.5,0.82,0.65]},
      {pos:[ 3.0, 0.6,-1.8] as [number,number,number], rot:[0,-0.55,0] as [number,number,number], label:"المدخرات",  col:"#44aaff", bars:[0.3,0.45,0.42,0.6,0.55,0.7,0.72]},
      {pos:[-2.7,-0.9,-1.2] as [number,number,number], rot:[0, 0.42,0] as [number,number,number], label:"الإنفاق",   col:"#ffcc00", bars:[0.55,0.4,0.62,0.5,0.45,0.58,0.44]},
    ];
    const panelGroup = new THREE.Group();
    panelDefs.forEach(({pos,rot,label,col,bars})=>{
      const tex = makePanel(label,col,bars);
      const pm = new THREE.Mesh(
        new THREE.PlaneGeometry(1.55,0.92),
        new THREE.MeshBasicMaterial({ map:tex, transparent:true, opacity:0.9,
          side:THREE.DoubleSide, blending:THREE.AdditiveBlending, depthWrite:false })
      );
      pm.position.set(...pos); pm.rotation.set(...rot);
      panelGroup.add(pm);
    });
    scene.add(panelGroup);

    // Energy lines heart → panels
    panelDefs.forEach(({pos})=>{
      const pts=[new THREE.Vector3(0,0.4,0.5), new THREE.Vector3(...pos)];
      scene.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color:0x00ff88, transparent:true, opacity:0.25,
          blending:THREE.AdditiveBlending })
      ));
    });

    // ═══════════════════════════════════════════════════════════════════════
    // ANIMATION LOOP
    // ═══════════════════════════════════════════════════════════════════════
    const dummy = new THREE.Object3D();
    let frameId: number;
    let t = 0;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      t += 0.016;

      // ── Heartbeat ────────────────────────────────────────────────────────
      const beatPhase = Math.sin(t * 2.4);
      const beatSpike = Math.pow(Math.max(0, Math.sin(t * 2.4)), 10);
      const beat = 1 + beatPhase * 0.035 + beatSpike * 0.07;
      const heartScale = beat * 1.25;
      heartMesh.scale.setScalar(heartScale);
      innerHeart.scale.setScalar(heartScale * 0.945);
      glowShell.scale.setScalar(heartScale * 1.1);

      // Float
      const floatY = Math.sin(t * 0.55) * 0.1;
      heartMesh.position.y = floatY;
      innerHeart.position.y = floatY;
      glowShell.position.y = floatY;
      heartMesh.rotation.y = Math.sin(t * 0.28) * 0.12;
      innerHeart.rotation.y = heartMesh.rotation.y;
      glowShell.rotation.y = heartMesh.rotation.y;

      // Core glow pulse
      coreGlow.intensity = 14 + beatPhase * 5 + beatSpike * 12;
      coreGlow.position.z = 0.6 + floatY * 0.3;
      coreGlow.position.y = 0.5 + floatY;

      // ── Tree gentle sway ─────────────────────────────────────────────────
      treeRoot.rotation.z = Math.sin(t * 0.35) * 0.018;
      treeRoot.rotation.x = Math.sin(t * 0.22) * 0.008;

      // ── Particles ────────────────────────────────────────────────────────
      const pa = pGeo.attributes.position.array as Float32Array;
      for (let i=0;i<PCOUNT;i++) {
        const pv = pVels[i];
        pa[i*3]   += pv.vx + Math.sin(t*0.4+pv.phase)*0.0012;
        pa[i*3+1] += pv.vy;
        pa[i*3+2] += pv.vz;
        if (pa[i*3+1]>4.2) pa[i*3+1]=-2.5;
      }
      pGeo.attributes.position.needsUpdate=true;

      // ── Panel float ───────────────────────────────────────────────────────
      panelGroup.children.forEach((p,i)=>{
        p.position.y += Math.sin(t*0.48+i*1.3)*0.0008;
      });

      // ── Lights animation ─────────────────────────────────────────────────
      rimLight.intensity = 5 + Math.sin(t*1.1)*0.8;
      treeGlow.intensity = 3 + Math.sin(t*0.8+1)*0.7;

      // ── Mouse parallax ───────────────────────────────────────────────────
      camera.position.x += (mouseX*0.45 - camera.position.x) * 0.045;
      camera.position.y += (mouseY*0.22 + 1.8 - camera.position.y) * 0.045;
      camera.lookAt(0, 0.4, 0);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(frameId);
      ro.disconnect();
      mount.removeEventListener("mousemove", onMouseMove);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  if (webglFailed) return <FallbackScene />;

  return (
    <div ref={mountRef} className="w-full h-full" style={{ minHeight:"520px", cursor:"default" }} />
  );
}
