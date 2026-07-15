import { useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { cn } from '../cn';

type SkeletonProps = {
  className?: string;
};

/** Placeholder pulsante para estados de carga (usar con clases de tamaño). */
export function Skeleton({ className }: SkeletonProps) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.9, { duration: 700 }), -1, true);
  }, [opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View style={style} className={cn('rounded-row bg-surface-2', className)} />;
}
