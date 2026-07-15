import type { InsightMetricId } from './metric-meta';

/**
 * Catálogo declarativo de reglas: las reglas son DATOS, no código.
 * Cinco evaluadores las interpretan; agregar chequeos = agregar entradas.
 */

export type CorrelationRule = {
  kind: 'correlation';
  id: string;
  x: InsightMetricId;
  y: InsightMetricId;
  /** 0 = mismo día; 1 = x de ayer vs y de hoy */
  lagDays: 0 | 1;
  windowDays: number;
  minN: number;
  minAbsR: number;
  maxP: number;
};

export type ThresholdRule = {
  kind: 'threshold';
  id: string;
  x: InsightMetricId;
  op: '>' | '<';
  threshold: number;
  y: InsightMetricId;
  lagDays: 0 | 1;
  windowDays: number;
  minNPerBucket: number;
  minAbsD: number;
};

export type WeekdayRule = {
  kind: 'weekday';
  id: string;
  metric: InsightMetricId;
  /** 0=domingo … 6=sábado, o fin de semana (sáb+dom) */
  scope: number | 'weekend';
  windowDays: number;
  minOccurrences: number;
  minRelDiff: number;
};

export type TrendRule = {
  kind: 'trend';
  id: string;
  metric: InsightMetricId;
  shortWindow: number;
  longWindow: number;
  minRelChange: number;
  minN: number;
};

export type RecordRule = {
  kind: 'record';
  id: string;
  metric: InsightMetricId;
  direction: 'max' | 'min';
  windowDays: number;
  minPriorDays: number;
};

export type StreakRule = {
  kind: 'streak';
  id: string;
  metric: InsightMetricId;
  threshold: number;
  direction: 'at_least' | 'at_most';
  minLength: number;
  /** Cómo tratar días sin dato: los at_most (abstinencia) toleran null como cumplido */
  nullCounts?: boolean;
};

export type InsightRule =
  | CorrelationRule
  | ThresholdRule
  | WeekdayRule
  | TrendRule
  | RecordRule
  | StreakRule;

// ── Generadores de familias ──────────────────────────────────────

const CORRELATION_INPUTS: InsightMetricId[] = [
  'caffeine_mg',
  'last_caffeine_hour',
  'alcohol_units',
  'stress',
  'steps',
  'workout_minutes',
  'strength_volume_kg',
  'water_ml',
  'protein_g',
  'sugar_g',
];

const CORRELATION_OUTCOMES: InsightMetricId[] = [
  'sleep_minutes',
  'sleep_quality',
  'energy',
  'mood',
  'health_score',
  'weight_kg',
  'soreness',
];

function correlationFamily(): CorrelationRule[] {
  const rules: CorrelationRule[] = [];
  for (const x of CORRELATION_INPUTS) {
    for (const y of CORRELATION_OUTCOMES) {
      if (x === y) continue;
      for (const lagDays of [0, 1] as const) {
        rules.push({
          kind: 'correlation',
          id: `corr.${x}->${y}.lag${lagDays}`,
          x,
          y,
          lagDays,
          windowDays: 60,
          minN: 14,
          minAbsR: 0.35,
          maxP: 0.05,
        });
      }
    }
  }
  return rules;
}

const WEEKDAY_METRICS: InsightMetricId[] = [
  'steps',
  'water_ml',
  'kcal',
  'protein_g',
  'sleep_minutes',
  'caffeine_mg',
  'alcohol_units',
  'workout_minutes',
];

function weekdayFamily(): WeekdayRule[] {
  const rules: WeekdayRule[] = [];
  for (const metric of WEEKDAY_METRICS) {
    for (let day = 0; day <= 6; day++) {
      rules.push({
        kind: 'weekday',
        id: `weekday.${metric}.${day}`,
        metric,
        scope: day,
        windowDays: 84,
        minOccurrences: 4,
        minRelDiff: 0.2,
      });
    }
    rules.push({
      kind: 'weekday',
      id: `weekday.${metric}.weekend`,
      metric,
      scope: 'weekend',
      windowDays: 84,
      minOccurrences: 6,
      minRelDiff: 0.2,
    });
  }
  return rules;
}

function thresholdFamily(): ThresholdRule[] {
  const defs: [InsightMetricId, '>' | '<', number, InsightMetricId, 0 | 1][] = [
    // Cafeína → sueño/energía (los ejemplos literales del spec incluidos)
    ['caffeine_mg', '>', 200, 'sleep_minutes', 0],
    ['caffeine_mg', '>', 300, 'sleep_minutes', 0],
    ['caffeine_mg', '>', 450, 'sleep_minutes', 0],
    ['caffeine_mg', '>', 300, 'sleep_quality', 0],
    ['caffeine_mg', '>', 450, 'sleep_quality', 0],
    ['caffeine_mg', '>', 300, 'energy', 1],
    ['last_caffeine_hour', '>', 16, 'sleep_minutes', 0],
    ['last_caffeine_hour', '>', 16, 'sleep_quality', 0],
    // Alcohol → sueño/ánimo/score
    ['alcohol_units', '>', 0, 'sleep_quality', 0],
    ['alcohol_units', '>', 0, 'sleep_minutes', 0],
    ['alcohol_units', '>', 2, 'sleep_quality', 0],
    ['alcohol_units', '>', 0, 'mood', 1],
    ['alcohol_units', '>', 0, 'energy', 1],
    ['alcohol_units', '>', 0, 'health_score', 1],
    // Sueño → día siguiente (el sueño se acredita al día del despertar → lag 0)
    ['sleep_minutes', '<', 360, 'energy', 0],
    ['sleep_minutes', '<', 360, 'mood', 0],
    ['sleep_minutes', '<', 420, 'energy', 0],
    ['sleep_minutes', '<', 420, 'steps', 0],
    ['sleep_minutes', '>', 450, 'weight_kg', 1],
    // Actividad y entrenamiento
    ['steps', '>', 10000, 'sleep_minutes', 0],
    ['steps', '<', 5000, 'mood', 0],
    ['strength_volume_kg', '>', 8000, 'soreness', 1],
    ['workout_minutes', '>', 0, 'mood', 0],
    ['workout_minutes', '>', 0, 'sleep_quality', 0],
    ['workout_minutes', '>', 0, 'stress', 0],
    // Nutrición
    ['protein_g', '<', 120, 'soreness', 1],
    ['sugar_g', '>', 80, 'energy', 0],
    ['water_ml', '<', 1500, 'energy', 0],
    ['kcal', '<', 1800, 'energy', 1],
    ['stress', '>', 3, 'sleep_minutes', 0],
  ];
  return defs.map(([x, op, threshold, y, lagDays]) => ({
    kind: 'threshold' as const,
    id: `thr.${x}${op}${threshold}->${y}.lag${lagDays}`,
    x,
    op,
    threshold,
    y,
    lagDays,
    windowDays: 90,
    minNPerBucket: 5,
    minAbsD: 0.5,
  }));
}

const TREND_METRICS: InsightMetricId[] = [
  'sleep_minutes',
  'steps',
  'water_ml',
  'kcal',
  'protein_g',
  'caffeine_mg',
  'alcohol_units',
  'weight_kg',
  'mood',
  'energy',
  'stress',
  'workout_minutes',
  'micro_coverage_pct',
  'health_score',
];

function trendFamily(): TrendRule[] {
  return TREND_METRICS.map((metric) => ({
    kind: 'trend' as const,
    id: `trend.${metric}`,
    metric,
    shortWindow: 7,
    longWindow: 28,
    minRelChange: 0.1,
    minN: 4,
  }));
}

function recordFamily(): RecordRule[] {
  const defs: [InsightMetricId, 'max' | 'min'][] = [
    ['steps', 'max'],
    ['strength_volume_kg', 'max'],
    ['water_ml', 'max'],
    ['sleep_minutes', 'max'],
    ['health_score', 'max'],
    ['weight_kg', 'min'],
    ['weight_kg', 'max'],
  ];
  return defs.map(([metric, direction]) => ({
    kind: 'record' as const,
    id: `record.${metric}.${direction}`,
    metric,
    direction,
    windowDays: 90,
    minPriorDays: 10,
  }));
}

function streakFamily(): StreakRule[] {
  return [
    { kind: 'streak', id: 'streak.steps', metric: 'steps', threshold: 8000, direction: 'at_least', minLength: 5 },
    { kind: 'streak', id: 'streak.water', metric: 'water_ml', threshold: 2000, direction: 'at_least', minLength: 5 },
    { kind: 'streak', id: 'streak.protein', metric: 'protein_g', threshold: 130, direction: 'at_least', minLength: 5 },
    { kind: 'streak', id: 'streak.sleep', metric: 'sleep_minutes', threshold: 420, direction: 'at_least', minLength: 5 },
    { kind: 'streak', id: 'streak.no-alcohol', metric: 'alcohol_units', threshold: 0, direction: 'at_most', minLength: 7, nullCounts: true },
    { kind: 'streak', id: 'streak.no-smoke', metric: 'cigarettes', threshold: 0, direction: 'at_most', minLength: 7, nullCounts: true },
    { kind: 'streak', id: 'streak.training', metric: 'workout_minutes', threshold: 1, direction: 'at_least', minLength: 3 },
  ];
}

/**
 * Catálogo completo (~250 chequeos). Las curadas del spec quedan cubiertas:
 * "dormís peor con >450 mg de cafeína" → thr.caffeine_mg>450->sleep_minutes
 * "los lunes caminás menos"            → weekday.steps.1
 * "la hidratación empeora los findes"  → weekday.water_ml.weekend
 * "perdés peso cuando dormís más"      → corr.sleep_minutes… (via thr.sleep>450->weight lag1)
 * "tu proteína promedio bajó"          → trend.protein_g
 */
export function buildCatalog(): InsightRule[] {
  return [
    ...correlationFamily(),
    ...thresholdFamily(),
    ...weekdayFamily(),
    ...trendFamily(),
    ...recordFamily(),
    ...streakFamily(),
  ];
}
