import type { TextStyle } from 'react-native';

/**
 * Escala tipográfica (fuente del sistema — SF en iOS, Roboto en Android).
 * Espejo JS de los `fontSize` de tailwind.config.js, para usos fuera de
 * className (Skia, estilos animados).
 * Los valores numéricos SIEMPRE se muestran con tabular-nums.
 */
export const typography = {
  display: { fontSize: 34, lineHeight: 41, fontWeight: '700' },
  title1: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  title2: { fontSize: 22, lineHeight: 28, fontWeight: '600' },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: '600' },
  body: { fontSize: 17, lineHeight: 22, fontWeight: '400' },
  subhead: { fontSize: 15, lineHeight: 20, fontWeight: '400' },
  footnote: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  caption: { fontSize: 11, lineHeight: 13, fontWeight: '500', letterSpacing: 0.6 },
} as const satisfies Record<string, TextStyle>;

export const tabularNums: TextStyle = { fontVariant: ['tabular-nums'] };
