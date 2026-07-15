import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { InsightRow } from '@/core/db/repositories/insights.repository';

import { repos } from './repos';

export type ParsedInsight = InsightRow & { metrics: Record<string, number | string> };

function parse(row: InsightRow): ParsedInsight {
  let metrics: Record<string, number | string> = {};
  try {
    metrics = JSON.parse(row.metricsJson) as Record<string, number | string>;
  } catch {
    // metricsJson corrupto: se muestra el insight sin detalle numérico
  }
  return { ...row, metrics };
}

/** Insights vigentes ordenados por relevancia (Inicio usa limit=2). */
export function useInsightsList(limit = 100) {
  return useQuery({
    queryKey: ['insights', 'list', limit],
    queryFn: () => repos.insights.listVisible(limit).map(parse),
  });
}

export function useInsight(id: string) {
  return useQuery({
    queryKey: ['insights', 'detail', id],
    queryFn: () => {
      const row = repos.insights.getById(id);
      return row ? parse(row) : null;
    },
  });
}

/** markSeen / dismiss con invalidación. */
export function useInsightAction(action: 'seen' | 'dismiss') {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      if (action === 'seen') repos.insights.markSeen(id);
      else repos.insights.dismiss(id);
      return Promise.resolve();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['insights'] });
    },
  });
}
