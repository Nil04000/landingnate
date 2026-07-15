import { useQuery } from '@tanstack/react-query';

import { addDaysLocal, daysAgoLocal, eachDayLocal, isoWeekOf, todayLocal } from '@/core/lib/dates';
import { bucketBy, streaks, summarize } from '@/core/lib/stats/series';
import { metricByKey } from '@/features/stats/metrics';

import { repos } from './repos';

export type StatsPeriod = 'D' | 'S' | 'M' | 'A';

export const PERIOD_OPTIONS: { key: StatsPeriod; label: string }[] = [
  { key: 'D', label: 'Días' },
  { key: 'S', label: 'Semanas' },
  { key: 'M', label: 'Meses' },
  { key: 'A', label: 'Años' },
];

/** Días de historia a leer por período. */
const PERIOD_DAYS: Record<StatsPeriod, number> = { D: 30, S: 182, M: 365, A: 1826 };

export type MetricPoint = { key: string; value: number | null };

export type MetricDetail = {
  points: MetricPoint[];
  /** Sobre los valores DIARIOS de la ventana */
  mean: number | null;
  min: { value: number; day: string } | null;
  max: { value: number; day: string } | null;
  daysWithData: number;
  /** Media de la ventana actual vs la ventana anterior de igual largo (%) */
  trendPct: number | null;
  /** Rachas vs objetivo (si la métrica tiene objetivo) */
  streak: { current: number; best: number } | null;
  lastValue: number | null;
};

/** Serie + resumen de una métrica para el período elegido. */
export function useMetricDetail(metricKey: string, period: StatsPeriod) {
  return useQuery({
    queryKey: ['range', 'metric', metricKey, period],
    queryFn: (): MetricDetail => {
      const metric = metricByKey(metricKey);
      if (!metric) throw new Error(`Métrica desconocida: ${metricKey}`);

      const today = todayLocal();
      const windowDays = PERIOD_DAYS[period];
      const from = daysAgoLocal(windowDays - 1);

      repos.aggregates.rebuildStale();
      const rows = repos.aggregates.getRange(from, today);
      const byDay = new Map(rows.map((r) => [r.dayDate, r]));
      const days = eachDayLocal(from, today).map((day) => {
        const agg = byDay.get(day);
        return { day, value: agg ? metric.getValue(agg) : null };
      });

      // Puntos del gráfico según el período
      let points: MetricPoint[];
      if (period === 'D') {
        points = days.map((d) => ({ key: d.day, value: d.value }));
      } else {
        const keyOf =
          period === 'S'
            ? (day: string) => isoWeekOf(day)
            : period === 'M'
              ? (day: string) => day.slice(0, 7)
              : (day: string) => day.slice(0, 4);
        const buckets = bucketBy(days, keyOf);
        points = buckets.map((b) => ({
          key: b.key,
          value: b.n === 0 ? null : metric.bucket === 'sum' ? (b.mean ?? 0) * b.n : b.mean,
        }));
      }

      // Resumen sobre valores diarios de la ventana
      const values = days.map((d) => d.value);
      const summary = summarize(values);

      // Comparación vs ventana anterior
      const prevFrom = addDaysLocal(from, -windowDays);
      const prevRows = repos.aggregates.getRange(prevFrom, addDaysLocal(from, -1));
      const prevByDay = new Map(prevRows.map((r) => [r.dayDate, r]));
      const prevValues = eachDayLocal(prevFrom, addDaysLocal(from, -1)).map((day) => {
        const agg = prevByDay.get(day);
        return agg ? metric.getValue(agg) : null;
      });
      const prevSummary = summarize(prevValues);
      const trendPct =
        summary.mean != null && prevSummary.mean != null && prevSummary.mean !== 0
          ? ((summary.mean - prevSummary.mean) / Math.abs(prevSummary.mean)) * 100
          : null;

      // Rachas vs objetivo
      let streak: { current: number; best: number } | null = null;
      if (metric.goal) {
        const { value, direction } = metric.goal;
        streak = streaks(values, (v) => (direction === 'at_least' ? v >= value : v <= value));
      }

      const lastWithData = [...days].reverse().find((d) => d.value != null);

      return {
        points,
        mean: summary.mean,
        min: summary.min ? { value: summary.min.value, day: days[summary.min.index]!.day } : null,
        max: summary.max ? { value: summary.max.value, day: days[summary.max.index]!.day } : null,
        daysWithData: summary.n,
        trendPct,
        streak,
        lastValue: lastWithData?.value ?? null,
      };
    },
  });
}

/** Última semana de cada métrica para las sparklines del hub. */
export function useStatsHub() {
  return useQuery({
    queryKey: ['range', 'statsHub'],
    queryFn: () => {
      const today = todayLocal();
      const from = daysAgoLocal(13);
      repos.aggregates.rebuildStale();
      const rows = repos.aggregates.getRange(from, today);
      const byDay = new Map(rows.map((r) => [r.dayDate, r]));
      const days = eachDayLocal(from, today).map((day) => byDay.get(day) ?? null);
      return days;
    },
  });
}
