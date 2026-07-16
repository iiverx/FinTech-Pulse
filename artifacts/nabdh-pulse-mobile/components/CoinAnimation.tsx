import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

interface CoinAnimationProps {
  active: boolean;
  onDone: () => void;
}

// Pre-compute offsets to avoid issues inside worklets
const COIN_OFFSETS = [-80, -48, -16, 16, 48, 80];
const COIN_DELAYS = [0, 60, 120, 80, 40, 100];
const COIN_HEIGHTS = [-180, -220, -200, -190, -210, -175];

function SingleCoin({
  index,
  xOffset,
  delay,
  riseH,
  onLast,
}: {
  index: number;
  xOffset: number;
  delay: number;
  riseH: number;
  onLast?: () => void;
}) {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withSequence(
        withTiming(1, { duration: 180, easing: Easing.out(Easing.quad) }),
        withDelay(300, withTiming(0, { duration: 350, easing: Easing.in(Easing.quad) })),
      ),
    );

    translateY.value = withDelay(
      delay,
      withTiming(riseH, { duration: 800, easing: Easing.out(Easing.cubic) }),
    );

    translateX.value = withDelay(
      delay,
      withTiming(xOffset, { duration: 800, easing: Easing.out(Easing.cubic) }),
    );

    scale.value = withDelay(
      delay,
      withSequence(
        withTiming(1, { duration: 200, easing: Easing.out(Easing.quad) }),
        withDelay(600, withTiming(0.6, { duration: 300 })),
      ),
    );

    if (onLast) {
      const totalDuration = delay + 900;
      const timeout = setTimeout(onLast, totalDuration);
      return () => clearTimeout(timeout);
    }
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.coin, style]}>
      <View style={styles.coinInner} />
      <View style={styles.coinShine} />
    </Animated.View>
  );
}

export function CoinAnimation({ active, onDone }: CoinAnimationProps) {
  if (!active) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {COIN_OFFSETS.map((xOffset, i) => (
        <SingleCoin
          key={i}
          index={i}
          xOffset={xOffset}
          delay={COIN_DELAYS[i]}
          riseH={COIN_HEIGHTS[i]}
          onLast={i === COIN_OFFSETS.length - 1 ? onDone : undefined}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 40,
  },
  coin: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFD700',
    shadowColor: '#C8A000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFF0A0',
    opacity: 0.7,
  },
  coinShine: {
    position: 'absolute',
    top: 4,
    left: 6,
    width: 8,
    height: 5,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.6)',
    transform: [{ rotate: '-20deg' }],
  },
});
