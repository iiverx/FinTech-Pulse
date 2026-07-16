import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withRepeat, withSequence, withTiming, Easing,
} from 'react-native-reanimated';
import Svg, {
  Defs, LinearGradient, RadialGradient, Stop,
  Rect, Circle, Path, Line, G, Ellipse,
} from 'react-native-svg';

interface WalletGraphicProps {
  level: 1 | 2 | 3 | 4;
  pulse?: boolean;
  width?: number;
  height?: number;
}

interface Palette {
  body1: string; body2: string; body3: string;
  fold1: string;
  hw1: string; hw2: string;
  stitch: string;
  cardA: string; cardB: string;
  billColor: string;
}

const PALETTES: Record<1|2|3|4, Palette> = {
  // Level 1 — deep navy → primary blue
  1: { body1:'#1E3A6E', body2:'#122355', body3:'#0A1628', fold1:'#1D4ED8', hw1:'#93C5FD', hw2:'#3B82F6', stitch:'#2563EB', cardA:'#1D4ED8', cardB:'#60A5FA', billColor:'#1D4ED8' },
  // Level 2 — blue-to-teal
  2: { body1:'#164E63', body2:'#0C3547', body3:'#041D2C', fold1:'#0891B2', hw1:'#67E8F9', hw2:'#0891B2', stitch:'#0E7490', cardA:'#0891B2', cardB:'#67E8F9', billColor:'#0E7490' },
  // Level 3 — site secondary green
  3: { body1:'#14532D', body2:'#052E16', body3:'#021A0C', fold1:'#16A34A', hw1:'#4ADE80', hw2:'#16A34A', stitch:'#15803D', cardA:'#16A34A', cardB:'#4ADE80', billColor:'#15803D' },
  // Level 4 — premium gold
  4: { body1:'#78350F', body2:'#5C2A0A', body3:'#3A1800', fold1:'#D97706', hw1:'#FCD34D', hw2:'#F59E0B', stitch:'#B45309', cardA:'#D97706', cardB:'#FDE68A', billColor:'#16A34A' },
};

export function WalletGraphic({ level, pulse = true, width = 340, height = 200 }: WalletGraphicProps) {
  const scaleVal = useSharedValue(1);

  useEffect(() => {
    if (pulse && Platform.OS !== 'web') {
      scaleVal.value = withRepeat(
        withSequence(
          withTiming(1.018, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
          withTiming(1.0,   { duration: 1500, easing: Easing.inOut(Easing.sin) }),
        ), -1, false,
      );
    }
  }, [pulse]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleVal.value }],
  }));

  const pal = PALETTES[level];

  // ViewBox & wallet dims
  const vW = 340, vH = 200;
  const wX = 14, wY = 22, wW = 312, wH = 152, wR = 18;
  const thick = 7; // 3D back panel offset

  // Fold center Y
  const fY = wY + wH / 2;

  // Clasp
  const clCx = wX + wW / 2, clCy = fY;

  // Bills: sit just above top of wallet (back panel)
  const billW = wW * 0.52, billX = wX + thick + wW * 0.22;
  const billY = wY - thick - 10;

  // Cards peeking top
  const cardW = wW * 0.4, cardH = 14, cardX = wX + 22, cardY = wY - 7;

  // Slot areas (lower half)
  const slotPad = 14;
  const slotW   = (wW - slotPad * 3) / 2;
  const slotH   = wH * 0.42;
  const slotY   = fY + slotPad;

  return (
    <Animated.View style={[{ width, height }, animStyle]}>
      <Svg width={width} height={height} viewBox={`0 0 ${vW} ${vH}`}>
        <Defs>
          {/* Body gradient */}
          <LinearGradient id={`body${level}`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%"   stopColor={pal.body1} />
            <Stop offset="55%"  stopColor={pal.body2} />
            <Stop offset="100%" stopColor={pal.body3} />
          </LinearGradient>

          {/* Back panel gradient */}
          <LinearGradient id={`back${level}`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%"   stopColor={pal.fold1} />
            <Stop offset="100%" stopColor={pal.body2} />
          </LinearGradient>

          {/* Top sheen */}
          <LinearGradient id="sheen" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%"   stopColor="rgba(255,255,255,0.16)" />
            <Stop offset="100%" stopColor="rgba(255,255,255,0)"    />
          </LinearGradient>

          {/* Card gradient */}
          <LinearGradient id={`card${level}`} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%"   stopColor={pal.cardA} />
            <Stop offset="100%" stopColor={pal.cardB} />
          </LinearGradient>

          {/* Card 2 */}
          <LinearGradient id="card2" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%"   stopColor="#334155" />
            <Stop offset="100%" stopColor="#1E293B" />
          </LinearGradient>

          {/* Clasp */}
          <RadialGradient id={`clasp${level}`} cx="35%" cy="35%" r="65%">
            <Stop offset="0%"   stopColor={pal.hw1} />
            <Stop offset="100%" stopColor={pal.hw2} />
          </RadialGradient>

          {/* Drop shadow */}
          <LinearGradient id="shadow" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%"   stopColor="rgba(0,0,0,0.0)" />
            <Stop offset="100%" stopColor="rgba(0,0,0,0.35)" />
          </LinearGradient>
        </Defs>

        {/* ── Drop shadow ─────────────────────────────────────── */}
        <Rect x={wX+4} y={wY+8} width={wW} height={wH} rx={wR}
          fill="rgba(0,0,0,0.3)" />

        {/* ── Back panel (3D offset) ───────────────────────────── */}
        <Rect x={wX+thick} y={wY-thick} width={wW} height={wH} rx={wR}
          fill={`url(#back${level})`} />
        <Rect x={wX+thick} y={wY-thick} width={wW} height={wH} rx={wR}
          fill="none" stroke={`${pal.stitch}55`} strokeWidth="1" />

        {/* ── Bills peeking ─────────────────────────────────────── */}
        {/* Bill 3 */}
        <Rect x={billX+8} y={billY-4} width={billW-12} height={14}
          rx="3" fill={`${pal.billColor}55`} />
        {/* Bill 2 */}
        <Rect x={billX+4} y={billY-2} width={billW-8} height={14}
          rx="3" fill={`${pal.billColor}88`}
          stroke="rgba(255,255,255,0.1)" strokeWidth="0.8" />
        {/* Bill 1 (front) */}
        <Rect x={billX} y={billY} width={billW} height={14}
          rx="3" fill={pal.billColor + 'cc'}
          stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />
        <Line x1={billX+billW*0.1} y1={billY+8} x2={billX+billW*0.88} y2={billY+8}
          stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />

        {/* ── Front panel ──────────────────────────────────────── */}
        <Rect x={wX} y={wY} width={wW} height={wH} rx={wR}
          fill={`url(#body${level})`} />

        {/* Leather diagonal texture lines */}
        {Array.from({ length: 12 }, (_, i) => (
          <Line key={`tex${i}`}
            x1={wX + i * 30}       y1={wY}
            x2={wX + i * 30 - 60}  y2={wY + wH}
            stroke={`${pal.stitch}18`} strokeWidth="8"
          />
        ))}

        {/* Top sheen */}
        <Rect x={wX} y={wY} width={wW} height={wH * 0.48} rx={wR}
          fill="url(#sheen)" />

        {/* Outer border */}
        <Rect x={wX} y={wY} width={wW} height={wH} rx={wR}
          fill="none" stroke={`${pal.stitch}77`} strokeWidth={level >= 3 ? 1.8 : 1.2} />

        {/* Stitch dashed inner border */}
        <Rect
          x={wX+10} y={wY+10} width={wW-20} height={wH-20} rx={wR-5}
          fill="none" stroke={`${pal.stitch}44`}
          strokeWidth="0.9" strokeDasharray="6,5"
        />

        {/* ── Fold crease ──────────────────────────────────────── */}
        <Line x1={wX+14} y1={fY} x2={wX+wW-14} y2={fY}
          stroke={`${pal.body3}cc`} strokeWidth="1.5" />

        {/* ── Cards peeking from top ───────────────────────────── */}
        {level >= 2 && (
          <Rect x={cardX+18} y={cardY+4} width={cardW} height={cardH} rx={4}
            fill="url(#card2)" opacity={0.85} />
        )}
        <Rect x={cardX} y={cardY} width={cardW} height={cardH} rx={4}
          fill={`url(#card${level})`} />
        {/* Card chip */}
        <Rect x={cardX+10} y={cardY+3} width={18} height={8} rx="2"
          fill="rgba(255,220,100,0.65)" />

        {/* ── Card slots (lower half) ──────────────────────────── */}
        {/* Left slot */}
        <Rect x={wX+slotPad} y={slotY} width={slotW} height={slotH} rx="7"
          fill="rgba(0,0,0,0.28)"
          stroke={`${pal.stitch}44`} strokeWidth="1" />
        {/* Right slot */}
        <Rect x={wX+slotPad*2+slotW} y={slotY} width={slotW} height={slotH} rx="7"
          fill="rgba(0,0,0,0.22)"
          stroke={`${pal.stitch}44`} strokeWidth="1" />

        {/* ── Snap clasp ───────────────────────────────────────── */}
        {/* Outer ring */}
        <Circle cx={clCx} cy={clCy} r={13}
          fill={`url(#clasp${level})`} />
        <Circle cx={clCx} cy={clCy} r={13}
          fill="none" stroke={`${pal.hw1}77`} strokeWidth="1.5" />
        {/* Inner button */}
        <Circle cx={clCx} cy={clCy} r={7}
          fill={`${pal.hw2}ee`} />
        <Circle cx={clCx-2} cy={clCy-2} r={3}
          fill="rgba(255,255,255,0.4)" />

        {/* ── Level 4: shimmer overlay ─────────────────────────── */}
        {level === 4 && (
          <Rect x={wX} y={wY} width={wW} height={wH} rx={wR}
            fill="rgba(255,235,150,0.06)" />
        )}

        {/* ── Coins (level 3+) ─────────────────────────────────── */}
        {level >= 3 && [
          { cx: wX - 20, cy: wY + 30,  r: 12 },
          { cx: wX + wW + 18, cy: wY + 50, r: 10 },
          { cx: wX + wW + 10, cy: wY + wH - 30, r: 8 },
          { cx: wX - 12, cy: wY + wH - 25, r: 9 },
        ].map((c, i) => (
          <G key={`coin${i}`}>
            <Circle cx={c.cx} cy={c.cy} r={c.r}
              fill="#FFD700" opacity={0.85} />
            <Circle cx={c.cx} cy={c.cy} r={c.r * 0.68}
              fill="#FFF0A0" opacity={0.55} />
            <Circle cx={c.cx - c.r*0.28} cy={c.cy - c.r*0.28} r={c.r * 0.28}
              fill="rgba(255,255,255,0.45)" />
          </G>
        ))}
      </Svg>
    </Animated.View>
  );
}
