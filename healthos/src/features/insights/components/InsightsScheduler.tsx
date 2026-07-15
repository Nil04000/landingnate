import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import { runInsightsIfStale, runInsightsNow } from '../engine/scheduler';

/**
 * Componente invisible montado bajo los providers: corre el motor al boot
 * y al volver a foreground si la última corrida quedó vieja (>6 h).
 */
export function InsightsScheduler() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const invalidate = () => void queryClient.invalidateQueries({ queryKey: ['insights'] });
    runInsightsNow(invalidate);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') runInsightsIfStale(invalidate);
    });
    return () => subscription.remove();
  }, [queryClient]);

  return null;
}
