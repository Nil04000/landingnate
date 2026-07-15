import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { db } from '@/core/db/client';
import { haptic } from '@/core/design-system/haptics';
import { microCoverage, nutrientKeyToSnake, sumTotals } from '@/core/lib/nutrition-math';
import { computeAndStoreScore } from '@/features/health-score/engine/compute-day';
import { scheduleInsightsRun } from '@/features/insights/engine/scheduler';

import { repos } from './repos';

/** Comidas del día con items y totales (tab Nutrición). */
export function useDayMeals(date: string) {
  return useQuery({
    queryKey: ['dayMeals', date],
    queryFn: () => repos.meals.listByDayWithItems(date),
  });
}

/** Una comida con items + totales en vivo (editor). */
export function useMeal(mealId: string) {
  return useQuery({
    queryKey: ['meal', mealId],
    queryFn: () => repos.meals.getWithItems(mealId) ?? null,
  });
}

export function useFoodSearch(query: string) {
  return useQuery({
    queryKey: ['foodSearch', query],
    queryFn: () => repos.foods.search(query),
    placeholderData: (prev) => prev,
  });
}

export function useFood(foodId: string) {
  return useQuery({
    queryKey: ['food', foodId],
    queryFn: () => ({
      food: repos.foods.getById(foodId) ?? null,
      portions: repos.foods.listPortions(foodId),
    }),
  });
}

export function useMealTemplates() {
  return useQuery({
    queryKey: ['mealTemplates'],
    queryFn: () => repos.meals.listTemplates(),
  });
}

export function useNutrientTargets() {
  return useQuery({
    queryKey: ['nutrientTargets'],
    queryFn: () => repos.settings.listNutrientTargets(),
  });
}

/**
 * Cobertura de micros del día, item por item (barra + detalle).
 * Misma matemática que el agregado, pero con el desglose por nutriente.
 */
export function useMicroCoverage(date: string) {
  return useQuery({
    queryKey: ['microCoverage', date],
    queryFn: () => {
      const meals = repos.meals.listByDayWithItems(date);
      const totals = sumTotals(meals.map((m) => m.totals));
      const targets = repos.settings
        .listNutrientTargets()
        .map((t) => ({ nutrientKey: t.nutrientKey, rdaAmount: t.rdaAmount }));
      const result = microCoverage(totals, targets);
      const names = new Map(
        repos.settings.listNutrientTargets().map((t) => [t.nutrientKey, t.displayName]),
      );
      return {
        ...result,
        items: result.items.map((i) => ({ ...i, displayName: names.get(i.nutrientKey) ?? i.nutrientKey })),
      };
    },
  });
}

/**
 * Mutación de nutrición: como useLogMutation pero invalida también las
 * queries de comidas/alimentos. `mealId` opcional para invalidar el editor.
 */
export function useMealMutation<TArgs extends { dayDate: string; mealId?: string }>(
  write: (args: TArgs) => unknown,
  opts?: { silent?: boolean },
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (args: TArgs) => {
      const result = write(args);
      repos.aggregates.markStale(args.dayDate);
      repos.aggregates.rebuildDay(args.dayDate);
      computeAndStoreScore(db, args.dayDate);
      return Promise.resolve({ args, result });
    },
    onSuccess: ({ args }) => {
      if (!opts?.silent) haptic.logged();
      void queryClient.invalidateQueries({ queryKey: ['day', args.dayDate] });
      void queryClient.invalidateQueries({ queryKey: ['dayEntries', args.dayDate] });
      void queryClient.invalidateQueries({ queryKey: ['dayMeals', args.dayDate] });
      void queryClient.invalidateQueries({ queryKey: ['microCoverage', args.dayDate] });
      void queryClient.invalidateQueries({ queryKey: ['range'] });
      if (args.mealId) void queryClient.invalidateQueries({ queryKey: ['meal', args.mealId] });
      void queryClient.invalidateQueries({ queryKey: ['mealTemplates'] });
      scheduleInsightsRun(() => void queryClient.invalidateQueries({ queryKey: ['insights'] }));
    },
  });
}

/** Mutación de biblioteca de alimentos (alta/edición/porciones). */
export function useFoodMutation<TArgs>(write: (args: TArgs) => unknown) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: TArgs) => Promise.resolve(write(args)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['foodSearch'] });
      void queryClient.invalidateQueries({ queryKey: ['food'] });
      // editar un alimento recalcula totales históricos (ADR-0004)
      void queryClient.invalidateQueries({ queryKey: ['dayMeals'] });
      void queryClient.invalidateQueries({ queryKey: ['meal'] });
      void queryClient.invalidateQueries({ queryKey: ['microCoverage'] });
    },
  });
}

export { nutrientKeyToSnake };
