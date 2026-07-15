import { InsightsRepository } from '@/core/db/repositories/insights.repository';
import { MealsRepository } from '@/core/db/repositories/meals.repository';
import { ScoresRepository } from '@/core/db/repositories/scores.repository';
import { SettingsRepository } from '@/core/db/repositories/settings.repository';
import { WorkoutsRepository } from '@/core/db/repositories/workouts.repository';
import type { AppSqliteDb } from '@/core/db/types';
import { daysAgoLocal, todayLocal } from '@/core/lib/dates';
import { microCoverage } from '@/core/lib/nutrition-math';
import { pearson } from '@/core/lib/stats/pearson';
import { spearman } from '@/core/lib/stats/spearman';
import { METRIC_META, type InsightMetricId } from '@/features/insights/engine/metric-meta';
import { loadDenseDays } from '@/features/insights/engine/run';
import type { ScoreBreakdown } from '@/features/health-score/engine/types';

/**
 * Herramientas de datos del asistente: funciones agregadas 100% locales.
 * Los intents las componen para responder; si algún día se enchufa un LLM
 * (tool-use), estas MISMAS funciones son las tools (ADR-0006).
 */

export type MetricSummary = {
  metric: InsightMetricId;
  days: number;
  n: number;
  mean: number | null;
  min: number | null;
  max: number | null;
  prevMean: number | null;
  /** % de cambio vs la ventana anterior de igual largo */
  trendPct: number | null;
};

export function getMetricSummary(
  db: AppSqliteDb,
  metric: InsightMetricId,
  days = 14,
): MetricSummary {
  const rows = loadDenseDays(db, days * 2);
  const get = METRIC_META[metric].get;
  const all = rows.map((r) => get(r.agg));
  const current = all.slice(-days).filter((v): v is number => v != null);
  const previous = all.slice(0, days).filter((v): v is number => v != null);

  const mean = current.length ? current.reduce((a, b) => a + b, 0) / current.length : null;
  const prevMean = previous.length ? previous.reduce((a, b) => a + b, 0) / previous.length : null;

  return {
    metric,
    days,
    n: current.length,
    mean,
    min: current.length ? Math.min(...current) : null,
    max: current.length ? Math.max(...current) : null,
    prevMean,
    trendPct:
      mean != null && prevMean != null && prevMean !== 0
        ? ((mean - prevMean) / Math.abs(prevMean)) * 100
        : null,
  };
}

export type CorrelationAnswer = {
  x: InsightMetricId;
  y: InsightMetricId;
  r: number;
  n: number;
  p: number;
  agrees: boolean;
};

/** Correlación on-demand con la misma guarda Pearson∧Spearman del motor. */
export function getCorrelation(
  db: AppSqliteDb,
  x: InsightMetricId,
  y: InsightMetricId,
  windowDays = 60,
): CorrelationAnswer | null {
  const rows = loadDenseDays(db, windowDays);
  const xs = rows.map((r) => METRIC_META[x].get(r.agg));
  const ys = rows.map((r) => METRIC_META[y].get(r.agg));
  const p = pearson(xs, ys);
  if (p.n < 10 || Number.isNaN(p.r)) return null;
  const s = spearman(xs, ys);
  const agrees = !Number.isNaN(s.r) && Math.sign(s.r) === Math.sign(p.r) && Math.abs(s.r) >= 0.25;
  return { x, y, r: p.r, n: p.n, p: p.p, agrees };
}

/** Los cambios (7d vs 28d) más grandes entre todas las métricas. */
export function getBiggestChanges(
  db: AppSqliteDb,
  limit = 5,
): { metric: InsightMetricId; relChange: number; meanShort: number; meanLong: number }[] {
  const rows = loadDenseDays(db, 35);
  const out: { metric: InsightMetricId; relChange: number; meanShort: number; meanLong: number }[] = [];
  for (const metric of Object.keys(METRIC_META) as InsightMetricId[]) {
    const get = METRIC_META[metric].get;
    const all = rows.map((r) => get(r.agg));
    const short = all.slice(-7).filter((v): v is number => v != null);
    const long = all.slice(0, 28).filter((v): v is number => v != null);
    if (short.length < 4 || long.length < 8) continue;
    const mShort = short.reduce((a, b) => a + b, 0) / short.length;
    const mLong = long.reduce((a, b) => a + b, 0) / long.length;
    if (mLong === 0) continue;
    const relChange = (mShort - mLong) / Math.abs(mLong);
    if (Math.abs(relChange) < 0.08) continue;
    out.push({ metric, relChange, meanShort: mShort, meanLong: mLong });
  }
  return out.sort((a, b) => Math.abs(b.relChange) - Math.abs(a.relChange)).slice(0, limit);
}

export function getScoreBreakdown(db: AppSqliteDb, date = todayLocal()): ScoreBreakdown | null {
  return new ScoresRepository(db).getBreakdown(date);
}

export function getActiveInsights(db: AppSqliteDb, limit = 5) {
  return new InsightsRepository(db).listVisible(limit);
}

export type NutrientDeficit = { nutrientKey: string; displayName: string; coveragePct: number };

/** Cobertura media de micros por nutriente en los últimos `days` con comida. */
export function getNutrientDeficits(db: AppSqliteDb, days = 14, limit = 5): NutrientDeficit[] {
  const meals = new MealsRepository(db);
  const targets = new SettingsRepository(db).listNutrientTargets();
  const targetInput = targets.map((t) => ({ nutrientKey: t.nutrientKey, rdaAmount: t.rdaAmount }));
  const names = new Map(targets.map((t) => [t.nutrientKey, t.displayName]));

  const coverageByNutrient = new Map<string, number[]>();
  for (let i = 0; i < days; i++) {
    const day = daysAgoLocal(i);
    const { totals, mealCount } = meals.dayTotals(day);
    if (mealCount === 0) continue;
    const { items } = microCoverage(totals, targetInput);
    for (const item of items) {
      const list = coverageByNutrient.get(item.nutrientKey) ?? [];
      list.push(item.coverage);
      coverageByNutrient.set(item.nutrientKey, list);
    }
  }

  const out: NutrientDeficit[] = [];
  for (const [nutrientKey, list] of coverageByNutrient) {
    const avg = list.reduce((a, b) => a + b, 0) / list.length;
    out.push({
      nutrientKey,
      displayName: names.get(nutrientKey) ?? nutrientKey,
      coveragePct: avg * 100,
    });
  }
  return out.sort((a, b) => a.coveragePct - b.coveragePct).slice(0, limit);
}

export type WorkoutToolSummary = {
  sessions: number;
  minutes: number;
  volumeKg: number;
  daysSinceLast: number | null;
};

export function getWorkoutSummary(db: AppSqliteDb, days = 28): WorkoutToolSummary {
  const workouts = new WorkoutsRepository(db);
  const from = daysAgoLocal(days - 1);
  const list = workouts.listRange(from, todayLocal());
  const minutes = list.reduce(
    (s, w) => (w.endedAt ? s + (w.endedAt - w.startedAt) / 60_000 : s),
    0,
  );
  let volumeKg = 0;
  const uniqueDays = [...new Set(list.map((w) => w.dayDate))];
  for (const day of uniqueDays) volumeKg += workouts.strengthVolumeForDay(day);

  let daysSinceLast: number | null = null;
  if (list.length > 0) {
    const lastDay = list[list.length - 1]!.dayDate;
    const today = todayLocal();
    daysSinceLast = Math.round(
      (new Date(today).getTime() - new Date(lastDay).getTime()) / 86_400_000,
    );
  }

  return { sessions: list.length, minutes, volumeKg, daysSinceLast };
}

/** Mejor día por Health Score en la ventana. */
export function getBestDay(db: AppSqliteDb, days = 60): { day: string; score: number } | null {
  const rows = loadDenseDays(db, days);
  let best: { day: string; score: number } | null = null;
  for (const row of rows) {
    const score = row.agg.healthScore;
    if (score != null && (!best || score > best.score)) best = { day: row.day, score };
  }
  return best;
}
