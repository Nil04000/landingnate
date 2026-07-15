import { Pressable, type PressableProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { springs } from '../tokens/motion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Único efecto de press de la app: escala a 0.97 con spring snappy.
 * Envuelve cualquier contenido presionable (cards, filas, botones).
 */
export function PressableScale({ children, ...rest }: PressableProps) {
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(pressed.value ? 0.97 : 1, springs.snappy) }],
  }));

  return (
    <AnimatedPressable
      {...rest}
      style={animatedStyle}
      onPressIn={(e) => {
        pressed.value = 1;
        rest.onPressIn?.(e);
      }}
      onPressOut={(e) => {
        pressed.value = 0;
        rest.onPressOut?.(e);
      }}
    >
      {children}
    </AnimatedPressable>
  );
}
