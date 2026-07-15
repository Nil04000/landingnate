import { z } from 'zod';

export const ALGO_VERSION = 1;

export const scoreComponentKeys = [
  'sleep',
  'activity',
  'training',
  'nutrition',
  'micronutrients',
  'hydration',
  'substances',
  'wellbeing',
  'consistency',
] as const;

export type ScoreComponentKey = (typeof scoreComponentKeys)[number];

export const scoreReasonSchema = z.object({
  code: z.string(),
  text: z.string(),
  /** Puntos de componente ganados/perdidos por esta causa (aprox., con signo) */
  impact: z.number(),
});

export const scoreComponentSchema = z.object({
  key: z.enum(scoreComponentKeys),
  score: z.number().nullable(),
  weight: z.number(),
  effectiveWeight: z.number(),
  available: z.boolean(),
  /** score × effectiveWeight — alimenta las barras de contribución */
  contribution: z.number(),
  /** vs promedio del mismo componente en los días previos (ventana 7) */
  deltaVs7dAvg: z.number().nullable(),
  inputs: z.record(z.string(), z.number().nullable()),
  reasons: z.array(scoreReasonSchema),
});

export const scoreBreakdownSchema = z.object({
  date: z.string(),
  score: z.number().nullable(),
  algoVersion: z.number(),
  availableWeight: z.number(),
  components: z.array(scoreComponentSchema),
});

export type ScoreReason = z.infer<typeof scoreReasonSchema>;
export type ScoreComponent = z.infer<typeof scoreComponentSchema>;
export type ScoreBreakdown = z.infer<typeof scoreBreakdownSchema>;

/** Objetivos que consume el motor (defaults hoy; tabla `goals` después). */
export type ScoreGoals = {
  sleepMinutes: number;
  steps: number;
  waterMl: number;
  kcal: number;
  proteinG: number;
  fiberG: number;
  workoutsPerWeek: number;
  caffeineMgMax: number;
};

export const defaultScoreGoals: ScoreGoals = {
  sleepMinutes: 480,
  steps: 10_000,
  waterMl: 2_500,
  kcal: 2_400,
  proteinG: 150,
  fiberG: 38,
  workoutsPerWeek: 3,
  caffeineMgMax: 400,
};

/** Pesos canónicos (§7 del plan). Suman 1. */
export const COMPONENT_WEIGHTS: Record<ScoreComponentKey, number> = {
  sleep: 0.2,
  activity: 0.14,
  training: 0.1,
  nutrition: 0.14,
  micronutrients: 0.08,
  hydration: 0.08,
  substances: 0.12,
  wellbeing: 0.1,
  consistency: 0.04,
};

/** Etiquetas es-AR para la pantalla de desglose. */
export const COMPONENT_LABELS: Record<ScoreComponentKey, string> = {
  sleep: 'Sueño',
  activity: 'Actividad',
  training: 'Entrenamiento',
  nutrition: 'Nutrición',
  micronutrients: 'Micronutrientes',
  hydration: 'Hidratación',
  substances: 'Sustancias',
  wellbeing: 'Bienestar',
  consistency: 'Consistencia',
};
