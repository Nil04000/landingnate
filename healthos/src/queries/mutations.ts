import { useMutation, useQueryClient } from '@tanstack/react-query';

import { db } from '@/core/db/client';
import { haptic } from '@/core/design-system/haptics';
import { computeAndStoreScore } from '@/features/health-score/engine/compute-day';
import { scheduleInsightsRun } from '@/features/insights/engine/scheduler';

import { repos } from './repos';

/**
 * Mutación de registro genérica: ejecuta el write del repositorio, marca el
 * día sucio, reconstruye el agregado y invalida las queries afectadas.
 * TODO write de dominio de la UI pasa por acá — garantiza que Inicio,
 * timeline y sparklines nunca queden desincronizados.
 */
export function useLogMutation<TArgs extends { dayDate: string }>(
  write: (args: TArgs) => unknown,
  opts?: { silent?: boolean },
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (args: TArgs) => {
      write(args);
      repos.aggregates.markStale(args.dayDate);
      repos.aggregates.rebuildDay(args.dayDate);
      computeAndStoreScore(db, args.dayDate);
      return Promise.resolve(args.dayDate);
    },
    onSuccess: (dayDate) => {
      if (!opts?.silent) haptic.logged();
      void queryClient.invalidateQueries({ queryKey: ['day', dayDate] });
      void queryClient.invalidateQueries({ queryKey: ['dayEntries', dayDate] });
      void queryClient.invalidateQueries({ queryKey: ['range'] });
      void queryClient.invalidateQueries({ queryKey: ['latestWeight'] });
      scheduleInsightsRun(() => void queryClient.invalidateQueries({ queryKey: ['insights'] }));
    },
  });
}

/** Mutación para el catálogo de suplementos (no toca agregados de un día). */
export function useCompoundDefinitionMutation<TArgs>(write: (args: TArgs) => unknown) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: TArgs) => {
      write(args);
      return Promise.resolve();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['compoundDefinitions'] });
    },
  });
}
