import { Easing } from 'react-native-reanimated';

/**
 * Vocabulario de movimiento — SOLO estos dos springs y tres timings en toda
 * la app. El movimiento comunica cambio de estado, nunca decora; nada dura
 * más de 450 ms.
 */
export const springs = {
  /** Press, thumbs de segmented, sheets */
  snappy: { damping: 18, stiffness: 220, mass: 0.6 },
  /** Layout, anillos, transiciones suaves */
  gentle: { damping: 20, stiffness: 120, mass: 1 },
} as const;

export const durations = {
  fast: 180,
  base: 260,
  slow: 420,
} as const;

export const standardEasing = Easing.bezier(0.25, 0.1, 0.25, 1);

/** Delay de stagger para grillas de cards (index * STAGGER_MS). */
export const STAGGER_MS = 40;
