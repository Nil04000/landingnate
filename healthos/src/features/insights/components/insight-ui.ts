import { palette } from '@/core/design-system/tokens/palette';
import { metricByKey } from '@/features/stats/metrics';

export const KIND_LABELS: Record<string, string> = {
  correlation: 'Correlación',
  threshold: 'Patrón',
  weekday: 'Día de semana',
  trend: 'Tendencia',
  record: 'Récord',
  streak: 'Racha',
};

export function severityColor(severity: string): string {
  if (severity === 'warning') return palette.warning;
  if (severity === 'notable') return palette.metric.score;
  return palette.tint;
}

/** 'water_ml' → 'waterMl' (ids del motor → keys del registro de stats). */
export function insightMetricToStatsKey(metricId: string): string | null {
  const camel = metricId.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
  return metricByKey(camel) ? camel : null;
}
