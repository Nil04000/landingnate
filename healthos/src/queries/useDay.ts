import { useQuery } from '@tanstack/react-query';

import type { DailyAggregate } from '@/core/db/repositories/aggregates.repository';
import { eachDayLocal, lastNDaysRange } from '@/core/lib/dates';

import { queryKeys } from './keys';
import { repos } from './repos';

/** Agregado del día (se materializa/reconstruye si falta o está sucio). */
export function useDayAggregate(date: string) {
  return useQuery({
    queryKey: queryKeys.day(date),
    queryFn: (): DailyAggregate => {
      const existing = repos.aggregates.getDay(date);
      if (existing && !existing.isStale) return existing;
      return repos.aggregates.rebuildDay(date);
    },
  });
}

/**
 * Serie densa [from..to]: una posición por día, null donde no hay fila.
 * Alimenta sparklines y gráficos sin que la UI rellene huecos.
 */
export function useRangeAggregates(from: string, to: string) {
  return useQuery({
    queryKey: queryKeys.range(from, to),
    queryFn: () => {
      repos.aggregates.rebuildStale();
      const rows = repos.aggregates.getRange(from, to);
      const byDay = new Map(rows.map((r) => [r.dayDate, r]));
      return eachDayLocal(from, to).map((day) => byDay.get(day) ?? null);
    },
  });
}

/** Últimos 7 días (incluye hoy) — para las sparklines de Inicio. */
export function useLast7Days() {
  const { from, to } = lastNDaysRange(7);
  return useRangeAggregates(from, to);
}

/** Último peso registrado (independiente del día seleccionado). */
export function useLatestWeight() {
  return useQuery({
    queryKey: queryKeys.latestWeight,
    queryFn: () => repos.body.latestWeight() ?? null,
  });
}

/** Todas las entradas crudas del día — timeline del tab Registro y day/[date]. */
export function useDayEntries(date: string) {
  return useQuery({
    queryKey: queryKeys.dayEntries(date),
    queryFn: () => ({
      sleep: repos.sleep.listByDay(date),
      hydration: repos.hydration.listByDay(date),
      substances: repos.substances.listByDay(date),
      body: repos.body.listByDay(date),
      wellbeing: repos.wellbeing.listByDay(date),
      intakes: repos.compounds.listIntakesByDay(date),
      workouts: repos.workouts.listByDay(date),
      activity: repos.activity.getForDay(date) ?? null,
      note: repos.wellbeing.getNote(date) ?? null,
    }),
  });
}

/** Definiciones activas de suplementos/medicación (checklist del sheet). */
export function useCompoundDefinitions() {
  return useQuery({
    queryKey: queryKeys.compoundDefinitions,
    queryFn: () => repos.compounds.listActiveDefinitions(),
  });
}
