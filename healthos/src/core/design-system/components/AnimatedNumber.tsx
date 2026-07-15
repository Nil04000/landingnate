import { useEffect } from 'react';
import { TextInput, type TextStyle } from 'react-native';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { durations, standardEasing } from '../tokens/motion';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

type AnimatedNumberProps = {
  value: number;
  decimals?: number;
  style?: TextStyle | TextStyle[];
};

/**
 * Número que interpola en vez de saltar (regla de la app: los números nunca
 * saltan). Render vía TextInput no editable para poder animar `text` en el
 * hilo de UI. Decimales con coma (es-AR). Siempre tabular-nums.
 */
export function AnimatedNumber({ value, decimals = 0, style }: AnimatedNumberProps) {
  const progress = useSharedValue(value);

  useEffect(() => {
    progress.value = withTiming(value, { duration: durations.base, easing: standardEasing });
  }, [value, progress]);

  const animatedProps = useAnimatedProps(() => {
    const text = progress.value.toFixed(decimals).replace('.', ',');
    return { text } as any;
  });

  return (
    <AnimatedTextInput
      editable={false}
      defaultValue={value.toFixed(decimals).replace('.', ',')}
      animatedProps={animatedProps}
      style={[{ fontVariant: ['tabular-nums'], padding: 0 }, style]}
    />
  );
}
