import type { DailyAggregate } from '@/core/db/repositories/aggregates.repository';

/**
 * Metadatos de las métricas que el motor de insights puede cruzar.
 * `badWhenHigh`: true si subir es malo (para severidad de hallazgos).
 */
export type InsightMetricId =
  | 'sleep_minutes'
  | 'sleep_quality'
  | 'bedtime_minute'
  | 'steps'
  | 'workout_minutes'
  | 'strength_volume_kg'
  | 'water_ml'
  | 'caffeine_mg'
  | 'last_caffeine_hour'
  | 'alcohol_units'
  | 'cigarettes'
  | 'kcal'
  | 'protein_g'
  | 'fiber_g'
  | 'sugar_g'
  | 'micro_coverage_pct'
  | 'weight_kg'
  | 'mood'
  | 'energy'
  | 'stress'
  | 'libido'
  | 'soreness'
  | 'supplement_adherence_pct'
  | 'health_score';

export type MetricMeta = {
  label: string;
  unit: string;
  decimals: number;
  /** true = subir es malo (estrés, alcohol); false = subir es bueno; null = neutral */
  badWhenHigh: boolean | null;
  get: (agg: DailyAggregate) => number | null;
};

export const METRIC_META: Record<InsightMetricId, MetricMeta> = {
  sleep_minutes: { label: 'sueño', unit: 'min', decimals: 0, badWhenHigh: false, get: (a) => a.sleepMinutes },
  sleep_quality: { label: 'calidad de sueño', unit: '/5', decimals: 1, badWhenHigh: false, get: (a) => a.sleepQuality },
  bedtime_minute: { label: 'hora de acostarte', unit: 'min', decimals: 0, badWhenHigh: null, get: (a) => a.bedtimeMinute },
  steps: { label: 'pasos', unit: '', decimals: 0, badWhenHigh: false, get: (a) => a.steps },
  workout_minutes: { label: 'entrenamiento', unit: 'min', decimals: 0, badWhenHigh: false, get: (a) => (a.workoutMinutes ? a.workoutMinutes : null) },
  strength_volume_kg: { label: 'volumen de fuerza', unit: 'kg', decimals: 0, badWhenHigh: false, get: (a) => (a.strengthVolumeKg ? a.strengthVolumeKg : null) },
  water_ml: { label: 'agua', unit: 'ml', decimals: 0, badWhenHigh: false, get: (a) => a.waterMl },
  caffeine_mg: { label: 'cafeína', unit: 'mg', decimals: 0, badWhenHigh: true, get: (a) => a.caffeineMg },
  last_caffeine_hour: { label: 'hora de la última cafeína', unit: 'h', decimals: 1, badWhenHigh: true, get: (a) => a.lastCaffeineHour },
  alcohol_units: { label: 'alcohol', unit: 'u.', decimals: 1, badWhenHigh: true, get: (a) => a.alcoholUnits },
  cigarettes: { label: 'cigarrillos', unit: '', decimals: 0, badWhenHigh: true, get: (a) => a.cigarettes },
  kcal: { label: 'calorías', unit: 'kcal', decimals: 0, badWhenHigh: null, get: (a) => a.kcal },
  protein_g: { label: 'proteína', unit: 'g', decimals: 0, badWhenHigh: false, get: (a) => a.proteinG },
  fiber_g: { label: 'fibra', unit: 'g', decimals: 0, badWhenHigh: false, get: (a) => a.fiberG },
  sugar_g: { label: 'azúcar', unit: 'g', decimals: 0, badWhenHigh: true, get: (a) => a.sugarG },
  micro_coverage_pct: { label: 'cobertura de micronutrientes', unit: '%', decimals: 0, badWhenHigh: false, get: (a) => a.microCoveragePct },
  weight_kg: { label: 'peso', unit: 'kg', decimals: 1, badWhenHigh: null, get: (a) => a.weightKg },
  mood: { label: 'ánimo', unit: '/5', decimals: 1, badWhenHigh: false, get: (a) => a.mood },
  energy: { label: 'energía', unit: '/5', decimals: 1, badWhenHigh: false, get: (a) => a.energy },
  stress: { label: 'estrés', unit: '/5', decimals: 1, badWhenHigh: true, get: (a) => a.stress },
  libido: { label: 'libido', unit: '/5', decimals: 1, badWhenHigh: false, get: (a) => a.libido },
  soreness: { label: 'dolor muscular', unit: '/5', decimals: 1, badWhenHigh: true, get: (a) => a.soreness },
  supplement_adherence_pct: { label: 'adherencia a suplementos', unit: '%', decimals: 0, badWhenHigh: false, get: (a) => a.supplementAdherencePct },
  health_score: { label: 'Health Score', unit: '', decimals: 0, badWhenHigh: false, get: (a) => a.healthScore },
};

/** Formatea un valor con la unidad de la métrica (es-AR). */
export function formatMetricValue(metricId: InsightMetricId, value: number): string {
  const meta = METRIC_META[metricId];
  const num =
    meta.decimals === 0
      ? Math.round(value).toLocaleString('es-AR')
      : value.toFixed(meta.decimals).replace('.', ',');
  return meta.unit ? `${num} ${meta.unit}`.trim() : num;
}
