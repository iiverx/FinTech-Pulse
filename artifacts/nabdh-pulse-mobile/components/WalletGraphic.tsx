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
  Defs,
  LinearGradient,
  Stop,
  Rect,
  Circle,
  Line,
  Path,
} from 'react-native-svg';

interface WalletGraphicProps {
  level: 1 | 2 | 3 | 4;
  pulse?: boolean;
  width?: number;
  height?: number;
}

interface LevelPalette {
  body1: string;
  body2: string;
  body3: string;
  stitch: string;
  clasp1: string;
  clasp2: string;
  border: string;
  card: boolean;
}

const LEVELS: Record<1 | 2 | 3 | 4, LevelPalette> = {
  1: {
    body1: '#A07040',
    body2: '#7B4F2E',
    body3: '#4A2E10',
    stitch: '#C09070',
    clasp1: '#9E8060',
    clasp2: '#6B5040',
    border: '#70502080',
    card: false,
  },
  2: {
    body1: '#B08040',
    body2: '#8B5E34',
    body3: '#5A3518',
    stitch: '#C8A070',
    clasp1: '#E8C040',
    clasp2: '#C8A020',
    border: '#C8A04080',
    card: true,
  },
  3: {
    body1: '#9B7040',
    body2: '#6B4020',
    body3: '#3A1F0A',
    stitch: '#B08050',
    clasp1: '#FFD700',
    clasp2: '#C8A000',
    border: '#FFD70099',
    card: true,
  },
  4: {
    body1: '#FFD700',
    body2: '#E8C020',
    body3: '#9A7010',
    stitch: '#FFE066',
    clasp1: '#FFF0A0',
    clasp2: '#C8A000',
    border: '#FFD700',
    card: true,
  },
};

export function WalletGraphic({ level, pulse = true, width = 300, height = 200 }: WalletGraphicProps) {
  const scaleVal = useSharedValue(1);

  useEffect(() => {
    if (pulse && Platform.OS !== 'web') {
      scaleVal.value = withRepeat(
        withSequence(
          withTiming(1.018, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
          withTiming(1.0, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      );
    }
  }, [pulse]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleVal.value }],
  }));

  const pal = LEVELS[level];

  // SVG viewBox: 220 x 140
  const vW = 220;
  const vH = 140;

  // Wallet body dimensions
  const bX = 10, bY = 14, bW = 200, bH = 112, bR = 12;

  // Card slot (top-right area of front face)
  const sX = 110, sY = 24, sW = 88, sH = 44, sR = 6;

  // Card inside slot
  const cX = 114, cY = 44, cW = 80, cH = 26, cR = 4;

  // Fold line
  const fY = bY + bH / 2;

  // Clasp (center)
  const clW = 60, clH = 26, clR = 8;
  const clX = bX + bW / 2 - clW / 2;
  const clY = fY - clH / 2;

  return (
    <Animated.View style={[{ width, height }, animStyle]}>
      <Svg width={width} height={height} viewBox={`0 0 ${vW} ${vH}`}>
        <Defs>
          {/* Body gradient */}
          <LinearGradient id={`bg${level}`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor={pal.body1} />
            <Stop offset="50%" stopColor={pal.body2} />
            <Stop offset="100%" stopColor={pal.body3} />
          </LinearGradient>

          {/* Sheen */}
          <LinearGradient id="sheen" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="rgba(255,255,255,0.28)" />
            <Stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </LinearGradient>

          {/* Clasp gradient */}
          <LinearGradient id={`clasp${level}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={pal.clasp1} />
            <Stop offset="100%" stopColor={pal.clasp2} />
          </LinearGradient>

          {/* Card gradient */}
          <LinearGradient id="cardGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor="#2050B0" />
            <Stop offset="100%" stopColor="#1040A0" />
          </LinearGradient>

          {/* Slot shadow */}
          <LinearGradient id="slot" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="rgba(0,0,0,0.4)" />
            <Stop offset="100%" stopColor="rgba(0,0,0,0.15)" />
          </LinearGradient>
        </Defs>

        {/* Drop shadow approximation */}
        <Rect
          x={bX + 2}
          y={bY + 6}
          width={bW}
          height={bH}
          rx={bR}
          fill="rgba(0,0,0,0.2)"
        />

        {/* Wallet body */}
        <Rect x={bX} y={bY} width={bW} height={bH} rx={bR} fill={`url(#bg${level})`} />

        {/* Top sheen */}
        <Rect x={bX} y={bY} width={bW} height={bH / 2} rx={bR} fill="url(#sheen)" />

        {/* Border/outline */}
        <Rect
          x={bX}
          y={bY}
          width={bW}
          height={bH}
          rx={bR}
          fill="none"
          stroke={pal.border}
          strokeWidth={level >= 3 ? 1.5 : 1}
        />

        {/* Stitch dashed inner border */}
        <Rect
          x={bX + 6}
          y={bY + 6}
          width={bW - 12}
          height={bH - 12}
          rx={bR - 3}
          fill="none"
          stroke={`${pal.stitch}55`}
          strokeWidth={0.8}
          strokeDasharray="5,4"
        />

        {/* Fold crease line */}
        <Line
          x1={bX + 8}
          y1={fY}
          x2={bX + bW - 8}
          y2={fY}
          stroke={`${pal.body3}88`}
          strokeWidth={0.8}
        />

        {/* Card slot */}
        <Rect x={sX} y={sY} width={sW} height={sH} rx={sR} fill="url(#slot)" />
        <Rect
          x={sX}
          y={sY}
          width={sW}
          height={sH}
          rx={sR}
          fill="none"
          stroke={`${pal.clasp1}44`}
          strokeWidth={0.8}
        />

        {/* Card in slot */}
        {pal.card && (
          <>
            <Rect x={cX} y={cY} width={cW} height={cH} rx={cR} fill="url(#cardGrad)" opacity={0.92} />
            {/* Card chip */}
            <Rect x={cX + 8} y={cY + 6} width={14} height={10} rx={2} fill="#FFD70060" />
            {/* Card stripe lines */}
            <Line x1={cX + 8} y1={cY + 20} x2={cX + cW - 8} y2={cY + 20} stroke="rgba(255,255,255,0.2)" strokeWidth={2} />
            <Line x1={cX + 8} y1={cY + 20} x2={cX + 40} y2={cY + 20} stroke="rgba(255,255,255,0.5)" strokeWidth={2} />
          </>
        )}

        {/* Clasp / buckle */}
        <Rect
          x={clX}
          y={clY}
          width={clW}
          height={clH}
          rx={clR}
          fill={`url(#clasp${level})`}
        />
        <Rect
          x={clX}
          y={clY}
          width={clW}
          height={clH}
          rx={clR}
          fill="none"
          stroke={level >= 2 ? `${pal.clasp1}88` : '#70502099'}
          strokeWidth={1}
        />

        {/* Pin hole */}
        <Circle cx={bX + bW / 2} cy={fY} r={5} fill={`${pal.body3}cc`} />
        <Circle cx={bX + bW / 2} cy={fY} r={3} fill="rgba(255,255,255,0.15)" />
        <Circle
          cx={bX + bW / 2}
          cy={fY}
          r={5}
          fill="none"
          stroke={`${pal.clasp1}66`}
          strokeWidth={0.8}
        />

        {/* Level 4: shimmer streak */}
        {level === 4 && (
          <Rect
            x={bX}
            y={bY}
            width={bW}
            height={bH}
            rx={bR}
            fill="rgba(255,255,220,0.08)"
          />
        )}

        {/* Level label — coin stack icons */}
        {level >= 3 && (
          <>
            <Circle cx={30} cy={30} r={8} fill="#FFD700" opacity={0.85} />
            <Circle cx={30} cy={30} r={5} fill="#FFF0A0" opacity={0.6} />
            <Circle cx={44} cy={26} r={6} fill="#FFD700" opacity={0.7} />
          </>
        )}
      </Svg>
    </Animated.View>
  );
}
