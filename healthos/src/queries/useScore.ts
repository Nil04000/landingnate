import { useQuery } from '@tanstack/react-query';

import { db } from '@/core/db/client';
import { addDaysLocal } from '@/core/lib/dates';
import { computeAndStoreScore } from '@/features/health-score/engine/compute-day';

import { repos } from './repos';

/**
 * Desglose del score de un día. Si no existe (o quedó de una versión vieja
 * del algoritmo), se recomputa y persiste en el momento.
 */
export function useScoreBreakdown(date: string) {
  return useQuery({
    queryKey: ['day', date, 'scoreBreakdown'],
    queryFn: () => {
      const stored = repos.scores.getBreakdown(date);
      if (stored) return stored;
      return computeAndStoreScore(db, date);
    },
  });
}

/** Desglose del día anterior (para el delta del header). */
export function useYesterdayScore(date: string) {
  const yesterday = addDaysLocal(date, -1);
  return useQuery({
    queryKey: ['day', yesterday, 'scoreOnly'],
    queryFn: () => repos.scores.getBreakdown(yesterday)?.score ?? null,
  });
}

/** Scores por día para el heatmap del calendario: Map<dayDate, score|null>. */
export function useScoreRange(from: string, to: string) {
  return useQuery({
    queryKey: ['range', from, to, 'scores'],
    queryFn: () => {
      const rows = repos.scores.listRange(from, to);
      const map: Record<string, number | null> = {};
      for (const row of rows) map[row.dayDate] = row.score;
      return map;
    },
  });
}
