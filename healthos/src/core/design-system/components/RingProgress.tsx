import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import { useEffect } from 'react';
import { useDerivedValue, useSharedValue, withTiming } from 'react-native-reanimated';

import { palette } from '../tokens/palette';
import { durations, standardEasing } from '../tokens/motion';

type RingProgressProps = {
  /** 0..1 (se clampa) */
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
};

/** Anillo de progreso Skia con sweep animado (mount y cambios de valor). */
export function RingProgress({
  progress,
  size = 44,
  strokeWidth = 5,
  color = palette.tint,
  trackColor = palette.surface2,
}: RingProgressProps) {
  const clamped = Math.min(1, Math.max(0, progress));
  const end = useSharedValue(0);

  useEffect(() => {
    end.value = withTiming(clamped, { duration: durations.slow, easing: standardEasing });
  }, [clamped, end]);

  const animatedEnd = useDerivedValue(() => end.value);

  const r = (size - strokeWidth) / 2;
  const path = Skia.Path.Make();
  path.addCircle(size / 2, size / 2, r);

  return (
    <Canvas style={{ width: size, height: size, transform: [{ rotate: '-90deg' }] }}>
      <Path
        path={path}
        color={trackColor}
        style="stroke"
        strokeWidth={strokeWidth}
        strokeCap="round"
      />
      <Path
        path={path}
        color={color}
        style="stroke"
        strokeWidth={strokeWidth}
        strokeCap="round"
        start={0}
        end={animatedEnd}
      />
    </Canvas>
  );
}
