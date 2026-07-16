import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, {
  Defs, LinearGradient, RadialGradient, Stop,
  Rect, Circle, Path, Line, Text as SvgText,
  Ellipse, G,
} from 'react-native-svg';

interface WalletGraphicProps {
  level: 1 | 2 | 3 | 4;
  pulse?: boolean;
  width?: number;
  height?: number;
}

interface Palette {
  bg0: string; bg1: string; bg2: string;
  accent: string; ring: string; particle: string;
}

const PALETTES: Record<1|2|3|4, Palette> = {
  1: { bg0:'#0F172A', bg1:'#1E3A5F', bg2:'#1E40AF', accent:'#60A5FA', ring:'#3B82F6', particle:'#93C5FD' },
  2: { bg0:'#1A0533', bg1:'#4C1D95', bg2:'#7C3AED', accent:'#A78BFA', ring:'#8B5CF6', particle:'#C4B5FD' },
  3: { bg0:'#052E16', bg1:'#065F46', bg2:'#059669', accent:'#34D399', ring:'#10B981', particle:'#6EE7B7' },
  4: { bg0:'#1C1100', bg1:'#78350F', bg2:'#D97706', accent:'#FCD34D', ring:'#F59E0B', particle:'#FDE68A' },
};

const LEVEL_NAMES: Record<1|2|3|4, string> = {
  1: 'مبتدئة', 2: 'نشطة', 3: 'ذهبية', 4: 'فاخرة ✦',
};

export function WalletGraphic({ level, pulse = true, width = 300, height = 190 }: WalletGraphicProps) {
  const scaleVal = useSharedValue(1);
  const shimVal  = useSharedValue(0);

  useEffect(() => {
    if (pulse && Platform.OS !== 'web') {
      scaleVal.value = withRepeat(
        withSequence(
          withTiming(1.02, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
          withTiming(1.0,  { duration: 1600, easing: Easing.inOut(Easing.sin) }),
        ), -1, false,
      );
    }
    shimVal.value = withRepeat(
      withTiming(1, { duration: 2800, easing: Easing.linear }), -1, false,
    );
  }, [pulse]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleVal.value }],
  }));

  const pal = PALETTES[level];

  // ViewBox
  const vW = 300, vH = 190;
  const bR  = 18;   // corner radius
  const pct = level / 4;

  // Progress ring
  const ringCx = vW * 0.8, ringCy = vH * 0.38, ringR = 26;
  const ringCirc  = 2 * Math.PI * ringR;
  const ringDash  = pct * ringCirc;

  // Grid step
  const gStep = 28;

  // Dot row
  const dotY = vH * 0.84, dotR = 3.5, dotGap = 18;

  // Chip
  const chipX = vW * 0.07, chipY = vH * 0.14, chipW = 34, chipH = 24;

  return (
    <Animated.View style={[{ width, height }, animStyle]}>
      <Svg width={width} height={height} viewBox={`0 0 ${vW} ${vH}`}>
        <Defs>
          {/* Background gradient */}
          <LinearGradient id={`bg${level}`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%"   stopColor={pal.bg0} />
            <Stop offset="55%"  stopColor={pal.bg1} />
            <Stop offset="100%" stopColor={pal.bg2} />
          </LinearGradient>

          {/* Orb 1 — top left */}
          <RadialGradient id={`orb1${level}`} cx="20%" cy="25%" r="55%" fx="20%" fy="25%">
            <Stop offset="0%"   stopColor={pal.bg2}  stopOpacity="0.5" />
            <Stop offset="100%" stopColor={pal.bg0}  stopOpacity="0"   />
          </RadialGradient>

          {/* Orb 2 — bottom right */}
          <RadialGradient id={`orb2${level}`} cx="85%" cy="80%" r="45%" fx="85%" fy="80%">
            <Stop offset="0%"   stopColor={pal.accent} stopOpacity="0.25" />
            <Stop offset="100%" stopColor={pal.bg0}    stopOpacity="0"    />
          </RadialGradient>

          {/* Shimmer band */}
          <LinearGradient id="shim" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%"   stopColor={pal.accent} stopOpacity="0"    />
            <Stop offset="45%"  stopColor={pal.accent} stopOpacity="0.12" />
            <Stop offset="50%"  stopColor={pal.accent} stopOpacity="0.28" />
            <Stop offset="55%"  stopColor={pal.accent} stopOpacity="0.12" />
            <Stop offset="100%" stopColor={pal.accent} stopOpacity="0"    />
          </LinearGradient>

          {/* Ring track */}
          <RadialGradient id={`rtrack${level}`} cx="50%" cy="50%" r="50%">
            <Stop offset="0%"   stopColor={pal.accent} stopOpacity="0.08" />
            <Stop offset="100%" stopColor={pal.accent} stopOpacity="0"    />
          </RadialGradient>

          {/* Chip gradient */}
          <LinearGradient id={`chip${level}`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%"   stopColor={pal.accent} stopOpacity="0.9" />
            <Stop offset="100%" stopColor={pal.ring}   stopOpacity="0.5" />
          </LinearGradient>
        </Defs>

        {/* ── Background ──────────────────────────────────────────────── */}
        <Rect x="0" y="0" width={vW} height={vH} rx={bR} fill={`url(#bg${level})`} />
        <Rect x="0" y="0" width={vW} height={vH} rx={bR} fill={`url(#orb1${level})`} />
        <Rect x="0" y="0" width={vW} height={vH} rx={bR} fill={`url(#orb2${level})`} />

        {/* ── Grid lines (level 2+) ────────────────────────────────────── */}
        {level >= 2 && (
          <G opacity="0.1">
            {Array.from({ length: Math.ceil(vW / gStep) + 1 }, (_, i) => (
              <Line key={`v${i}`}
                x1={i * gStep} y1="0" x2={i * gStep} y2={vH}
                stroke={pal.accent} strokeWidth="0.6"
              />
            ))}
            {Array.from({ length: Math.ceil(vH / gStep) + 1 }, (_, i) => (
              <Line key={`h${i}`}
                x1="0" y1={i * gStep} x2={vW} y2={i * gStep}
                stroke={pal.accent} strokeWidth="0.6"
              />
            ))}
          </G>
        )}

        {/* Circuit nodes (level 3+) */}
        {level >= 3 && (
          <G opacity="0.22">
            {Array.from({ length: 4 }, (_, r) =>
              Array.from({ length: 6 }, (_, c) => (
                <Circle
                  key={`n${r}${c}`}
                  cx={(c + 1) * gStep * 0.85}
                  cy={(r + 1) * gStep * 0.85}
                  r="2" fill={pal.particle}
                />
              ))
            )}
          </G>
        )}

        {/* ── Particles ─────────────────────────────────────────────────── */}
        {[
          {cx:40, cy:30, r:2.2, op:0.6},   {cx:80, cy:50, r:1.5, op:0.4},
          {cx:130, cy:20, r:2.5, op:0.5},  {cx:180, cy:60, r:1.8, op:0.35},
          {cx:240, cy:30, r:2,   op:0.55}, {cx:260, cy:80, r:1.2, op:0.3},
          {cx:50,  cy:140,r:1.8, op:0.4},  {cx:160, cy:150,r:2.2, op:0.5},
          {cx:220, cy:160,r:1.5, op:0.35}, {cx:110, cy:170,r:2,   op:0.45},
        ].map((p, i) => (
          <Circle key={i} cx={p.cx} cy={p.cy} r={p.r}
            fill={pal.particle} opacity={p.op} />
        ))}

        {/* ── Shimmer band ──────────────────────────────────────────────── */}
        <Rect x="0" y="0" width={vW} height={vH} rx={bR} fill="url(#shim)" />

        {/* ── Border glow ───────────────────────────────────────────────── */}
        <Rect
          x="0.75" y="0.75" width={vW - 1.5} height={vH - 1.5} rx={bR}
          fill="none" stroke={pal.accent} strokeWidth="1.5" opacity="0.6"
        />

        {/* ── Chip (SIM-style) ──────────────────────────────────────────── */}
        <Rect x={chipX} y={chipY} width={chipW} height={chipH}
          rx="4" fill={`url(#chip${level})`} />
        {/* Chip grooves */}
        <Line x1={chipX+chipW/2} y1={chipY+2}    x2={chipX+chipW/2} y2={chipY+chipH-2}
          stroke={pal.bg0} strokeWidth="2" opacity="0.5" />
        <Line x1={chipX+2}       y1={chipY+chipH/2} x2={chipX+chipW-2} y2={chipY+chipH/2}
          stroke={pal.bg0} strokeWidth="2" opacity="0.5" />

        {/* ── Progress ring ─────────────────────────────────────────────── */}
        {/* Track */}
        <Circle cx={ringCx} cy={ringCy} r={ringR}
          fill="none" stroke={pal.accent} strokeWidth="5" opacity="0.15" />
        {/* Fill */}
        <Circle cx={ringCx} cy={ringCy} r={ringR}
          fill="none" stroke={pal.ring} strokeWidth="5"
          strokeDasharray={`${ringDash} ${ringCirc - ringDash}`}
          strokeDashoffset={ringCirc * 0.25}
          strokeLinecap="round" opacity="0.9"
        />
        {/* Center glyph */}
        <SvgText
          x={ringCx} y={ringCy + 6}
          textAnchor="middle" fontSize="16"
          fill={pal.accent} fontWeight="bold" opacity="0.9"
        >
          ◈
        </SvgText>

        {/* ── EKG pulse line ─────────────────────────────────────────────── */}
        <Path
          d={buildEKGPath(vW * 0.07, vH * 0.57, vW * 0.63, vH * 0.065)}
          stroke={pal.accent} strokeWidth="1.4"
          fill="none" opacity="0.7" strokeLinecap="round" strokeLinejoin="round"
        />

        {/* ── Level label ───────────────────────────────────────────────── */}
        <SvgText
          x={vW * 0.07} y={vH * 0.72}
          fontSize="13" fontWeight="bold"
          fill={pal.accent} opacity="0.95"
        >
          {`المستوى ${level} — ${LEVEL_NAMES[level]}`}
        </SvgText>

        {/* ── Dot row (card number placeholder) ─────────────────────────── */}
        {Array.from({ length: 10 }, (_, i) => (
          <Circle
            key={`dot${i}`}
            cx={vW * 0.07 + i * dotGap}
            cy={dotY} r={dotR}
            fill={pal.accent}
            opacity={i < 3 ? 0.85 : 0.25}
          />
        ))}
      </Svg>
    </Animated.View>
  );
}

// ── EKG path builder ─────────────────────────────────────────────────────────
function buildEKGPath(startX: number, baseY: number, totalW: number, amp: number): string {
  const segments = 5;
  const segW = totalW / segments;
  let d = `M ${startX} ${baseY}`;

  for (let i = 0; i < segments; i++) {
    const x0 = startX + i * segW;
    if (i === 2) {
      // Spike segment
      const mid = x0 + segW * 0.3;
      d += ` L ${mid} ${baseY}`;
      d += ` L ${mid + segW * 0.1} ${baseY - amp * 2.8}`;
      d += ` L ${mid + segW * 0.2} ${baseY + amp * 1.2}`;
      d += ` L ${mid + segW * 0.3} ${baseY}`;
      d += ` L ${x0 + segW} ${baseY}`;
    } else {
      // Flat with gentle sine
      const cpX = x0 + segW * 0.5;
      const cpY = baseY + (i % 2 === 0 ? amp * 0.3 : -amp * 0.3);
      d += ` Q ${cpX} ${cpY} ${x0 + segW} ${baseY}`;
    }
  }
  return d;
}
