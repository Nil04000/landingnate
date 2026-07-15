import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { haptic } from '@/core/design-system/haptics';
import type { MuscleGroup } from '@/core/db/repositories/exercises.repository';
import { epleyE1Rm } from '@/core/db/repositories/workouts.repository';

import { repos } from './repos';

/** Sesión completa: workout + ejercicios ordenados con series. */
export function useWorkoutSession(workoutId: string) {
  return useQuery({
    queryKey: ['workout', workoutId],
    queryFn: () => {
      const workout = repos.workouts.getById(workoutId) ?? null;
      if (!workout) return null;
      return { workout, exercises: repos.workouts.getFullSession(workoutId) };
    },
  });
}

export function useExerciseSearch(query: string, muscleGroup?: MuscleGroup) {
  return useQuery({
    queryKey: ['exerciseSearch', query, muscleGroup ?? 'all'],
    queryFn: () => repos.exercises.search(query, muscleGroup),
    placeholderData: (prev) => prev,
  });
}

/** Valores fantasma: series de la última sesión con este ejercicio. */
export function useGhostSets(exerciseId: string, currentWorkoutId: string) {
  return useQuery({
    queryKey: ['ghostSets', exerciseId, currentWorkoutId],
    queryFn: () => repos.workouts.lastSessionSets(exerciseId, currentWorkoutId),
    staleTime: Infinity,
  });
}

/** Historial de un ejercicio: e1RM por día + mejor marca. */
export function useExerciseHistory(exerciseId: string) {
  return useQuery({
    queryKey: ['exerciseHistory', exerciseId],
    queryFn: () => ({
      exercise: repos.exercises.getById(exerciseId) ?? null,
      history: repos.workouts.e1RmHistory(exerciseId),
      bestE1Rm: repos.workouts.bestE1Rm(exerciseId),
    }),
  });
}

/**
 * Mutación de entrenamiento: write + rebuild de agregados + invalidación.
 * `checkPr`: si el write agrega una serie, compara e1RM contra el mejor
 * histórico ANTES del write y devuelve `isPr` (dispara haptic.goal()).
 */
export function useWorkoutMutation<TArgs extends { dayDate: string; workoutId?: string }>(
  write: (args: TArgs) => unknown,
  opts?: {
    silent?: boolean;
    checkPr?: (args: TArgs) => { exerciseId: string; weightKg?: number; reps?: number } | null;
  },
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (args: TArgs) => {
      let isPr = false;
      const prInput = opts?.checkPr?.(args);
      if (prInput && prInput.weightKg != null && prInput.reps != null) {
        const previousBest = repos.workouts.bestE1Rm(prInput.exerciseId);
        isPr = previousBest > 0 && epleyE1Rm(prInput.weightKg, prInput.reps) > previousBest;
      }
      const result = write(args);
      repos.aggregates.markStale(args.dayDate);
      repos.aggregates.rebuildDay(args.dayDate);
      return Promise.resolve({ args, result, isPr });
    },
    onSuccess: ({ args, isPr }) => {
      if (isPr) haptic.goal();
      else if (!opts?.silent) haptic.logged();
      void queryClient.invalidateQueries({ queryKey: ['day', args.dayDate] });
      void queryClient.invalidateQueries({ queryKey: ['dayEntries', args.dayDate] });
      void queryClient.invalidateQueries({ queryKey: ['range'] });
      if (args.workoutId) {
        void queryClient.invalidateQueries({ queryKey: ['workout', args.workoutId] });
      }
      void queryClient.invalidateQueries({ queryKey: ['exerciseHistory'] });
    },
  });
}
