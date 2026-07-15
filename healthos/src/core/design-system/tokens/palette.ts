/**
 * Paleta canónica de HealthOS — dark-first.
 *
 * Fuente de verdad para todo color usado desde JS/Skia (anillos, heatmap,
 * gráficos). Las clases de Tailwind consumen el espejo en `tailwind.config.js`;
 * si se cambia un valor acá, debe cambiarse allá también.
 */
export const palette = {
  /** Fondo de pantalla */
  canvas: '#0A0A0C',
  /** Fill de cards */
  surface: '#141417',
  /** Fill elevado (chips, filas dentro de cards) */
  surface2: '#1C1C21',
  /** Borde de cards (1px) */
  stroke: '#26262C',
  /** Separadores de listas */
  separator: '#2E2E34',

  text: {
    primary: '#F5F5F7',
    secondary: '#A1A1AA',
    tertiary: '#5E5E66',
  },

  tint: '#0A84FF',
  success: '#30D158',
  warning: '#FFD60A',
  danger: '#FF453A',

  /** Color identitario por métrica (cards, gráficos, iconos) */
  metric: {
    sleep: '#BF5AF2',
    activity: '#FF9F0A',
    nutrition: '#30D158',
    hydration: '#64D2FF',
    caffeine: '#A2845E',
    mood: '#FF375F',
    training: '#FF6482',
    labs: '#6C8EEF',
    score: '#5DE6C0',
  },
} as const;

/** Rampa del Health Score (dial + heatmap del calendario). */
export const scoreRamp = {
  none: '#3A3A3F',
  bands: [
    { min: 0, color: '#E4574F' }, // <40
    { min: 40, color: '#E8883F' }, // 40-59
    { min: 60, color: '#E6C54B' }, // 60-74
    { min: 75, color: '#7BC96F' }, // 75-89
    { min: 90, color: '#34D399' }, // 90+
  ],
} as const;

/** Color de la rampa para un score dado (null = sin datos). */
export function scoreColor(score: number | null | undefined): string {
  if (score == null) return scoreRamp.none;
  let color: string = scoreRamp.bands[0].color;
  for (const band of scoreRamp.bands) {
    if (score >= band.min) color = band.color;
  }
  return color;
}

export type MetricColorKey = keyof typeof palette.metric;
