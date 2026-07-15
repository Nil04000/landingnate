import type { DailyAggregate } from '@/core/db/repositories/aggregates.repository';
import { palette } from '@/core/design-system/tokens/palette';
import { formatDecimal, formatInt, formatMinutes } from '@/core/lib/format';
import { defaultGoals } from '@/core/lib/defaults';

/**
 * Registro declarativo de métricas para Estadísticas.
 * Una métrica = columna de daily_aggregates + presentación + semántica.
 */
export type MetricDef = {
  key: string;
  label: string;
  group: 'cuerpo' | 'actividad' | 'nutricion' | 'sustancias' | 'subjetivo';
  color: string;
  /** Qué dirección es "mejor" para colorear tendencias */
  goodDirection: 'up' | 'down' | 'neutral';
  /** mean para niveles (peso, ánimo); sum para acumulables por bucket (volumen) */
  bucket: 'mean' | 'sum';
  getValue: (agg: DailyAggregate) => number | null;
  format: (value: number) => string;
  /** Objetivo diario (para rachas), si aplica */
  goal?: { value: number; direction: 'at_least' | 'at_most' };
};

export const METRICS: MetricDef[] = [
  {
    key: 'weightKg',
    label: 'Peso',
    group: 'cuerpo',
    color: palette.metric.score,
    goodDirection: 'neutral',
    bucket: 'mean',
    getValue: (a) => a.weightKg,
    format: (v) => `${formatDecimal(v, 1)} kg`,
  },
  {
    key: 'bodyFatPct',
    label: 'Grasa corporal',
    group: 'cuerpo',
    color: palette.metric.score,
    goodDirection: 'down',
    bucket: 'mean',
    getValue: (a) => a.bodyFatPct,
    format: (v) => `${formatDecimal(v, 1)}%`,
  },
  {
    key: 'healthScore',
    label: 'Health Score',
    group: 'cuerpo',
    color: palette.metric.score,
    goodDirection: 'up',
    bucket: 'mean',
    getValue: (a) => a.healthScore,
    format: (v) => formatInt(v),
  },
  {
    key: 'steps',
    label: 'Pasos',
    group: 'actividad',
    color: palette.metric.activity,
    goodDirection: 'up',
    bucket: 'mean',
    getValue: (a) => a.steps,
    format: (v) => formatInt(v),
    goal: { value: defaultGoals.stepsPerDay, direction: 'at_least' },
  },
  {
    key: 'sleepMinutes',
    label: 'Sueño',
    group: 'actividad',
    color: palette.metric.sleep,
    goodDirection: 'up',
    bucket: 'mean',
    getValue: (a) => a.sleepMinutes,
    format: (v) => formatMinutes(v),
    goal: { value: 420, direction: 'at_least' },
  },
  {
    key: 'workoutMinutes',
    label: 'Entrenamiento',
    group: 'actividad',
    color: palette.metric.training,
    goodDirection: 'up',
    bucket: 'sum',
    getValue: (a) => a.workoutMinutes,
    format: (v) => formatMinutes(v),
  },
  {
    key: 'strengthVolumeKg',
    label: 'Volumen de fuerza',
    group: 'actividad',
    color: palette.metric.training,
    goodDirection: 'up',
    bucket: 'sum',
    getValue: (a) => (a.strengthVolumeKg ? a.strengthVolumeKg : null),
    format: (v) => `${formatInt(v)} kg`,
  },
  {
    key: 'waterMl',
    label: 'Agua',
    group: 'nutricion',
    color: palette.metric.hydration,
    goodDirection: 'up',
    bucket: 'mean',
    getValue: (a) => a.waterMl,
    format: (v) => `${formatInt(v)} ml`,
    goal: { value: defaultGoals.waterMlPerDay, direction: 'at_least' },
  },
  {
    key: 'kcal',
    label: 'Calorías',
    group: 'nutricion',
    color: palette.metric.nutrition,
    goodDirection: 'neutral',
    bucket: 'mean',
    getValue: (a) => a.kcal,
    format: (v) => `${formatInt(v)} kcal`,
  },
  {
    key: 'proteinG',
    label: 'Proteína',
    group: 'nutricion',
    color: palette.metric.nutrition,
    goodDirection: 'up',
    bucket: 'mean',
    getValue: (a) => a.proteinG,
    format: (v) => `${formatInt(v)} g`,
    goal: { value: 150, direction: 'at_least' },
  },
  {
    key: 'microCoveragePct',
    label: 'Micronutrientes',
    group: 'nutricion',
    color: palette.metric.nutrition,
    goodDirection: 'up',
    bucket: 'mean',
    getValue: (a) => a.microCoveragePct,
    format: (v) => `${formatInt(v)}%`,
  },
  {
    key: 'caffeineMg',
    label: 'Cafeína',
    group: 'sustancias',
    color: palette.metric.caffeine,
    goodDirection: 'down',
    bucket: 'mean',
    getValue: (a) => a.caffeineMg,
    format: (v) => `${formatInt(v)} mg`,
    goal: { value: defaultGoals.caffeineMgMax, direction: 'at_most' },
  },
  {
    key: 'alcoholUnits',
    label: 'Alcohol',
    group: 'sustancias',
    color: palette.metric.training,
    goodDirection: 'down',
    bucket: 'sum',
    getValue: (a) => a.alcoholUnits,
    format: (v) => `${formatDecimal(v, 1)} u.`,
  },
  {
    key: 'mood',
    label: 'Ánimo',
    group: 'subjetivo',
    color: palette.metric.mood,
    goodDirection: 'up',
    bucket: 'mean',
    getValue: (a) => a.mood,
    format: (v) => `${formatDecimal(v, 1)}/5`,
  },
  {
    key: 'energy',
    label: 'Energía',
    group: 'subjetivo',
    color: palette.metric.mood,
    goodDirection: 'up',
    bucket: 'mean',
    getValue: (a) => a.energy,
    format: (v) => `${formatDecimal(v, 1)}/5`,
  },
  {
    key: 'stress',
    label: 'Estrés',
    group: 'subjetivo',
    color: palette.metric.mood,
    goodDirection: 'down',
    bucket: 'mean',
    getValue: (a) => a.stress,
    format: (v) => `${formatDecimal(v, 1)}/5`,
  },
];

export const METRIC_GROUPS: { key: MetricDef['group']; label: string }[] = [
  { key: 'cuerpo', label: 'Cuerpo' },
  { key: 'actividad', label: 'Actividad y sueño' },
  { key: 'nutricion', label: 'Nutrición' },
  { key: 'sustancias', label: 'Sustancias' },
  { key: 'subjetivo', label: 'Subjetivo' },
];

export function metricByKey(key: string): MetricDef | undefined {
  return METRICS.find((m) => m.key === key);
}
