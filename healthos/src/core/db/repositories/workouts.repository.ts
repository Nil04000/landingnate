import { and, asc, desc, eq, gte, inArray, lte } from 'drizzle-orm';

import { exercises, workoutExercises, workoutSets, workouts } from '../schema';
import type { AppSqliteDb } from '../types';
import { insertStamp, notDeleted, softDeleteStamp, updateStamp } from './base.repository';

export type Workout = typeof workouts.$inferSelect;
export type WorkoutExercise = typeof workoutExercises.$inferSelect;
export type WorkoutSet = typeof workoutSets.$inferSelect;
export type Exercise = typeof exercises.$inferSelect;

export type WorkoutExerciseWithSets = WorkoutExercise & {
  exercise: Exercise;
  sets: WorkoutSet[];
};

/** e1RM por fórmula de Epley: peso × (1 + reps/30). */
export function epleyE1Rm(weightKg: number, reps: number): number {
  if (reps <= 0 || weightKg <= 0) return 0;
  if (reps === 1) return weightKg;
  return weightKg * (1 + reps / 30);
}

export type NewWorkout = {
  dayDate: string;
  type: 'strength' | 'cardio' | 'mobility' | 'sport';
  title?: string;
  startedAt: number;
  endedAt?: number;
  perceivedExertion?: number;
  kcalBurned?: number;
  distanceM?: number;
  avgHr?: number;
  notes?: string;
};

/**
 * Fase 2: shell de lectura + alta básica (los agregados ya consumen
 * duración/volumen). El logger en vivo con ejercicios/series llega en Fase 4.
 */
export class WorkoutsRepository {
  constructor(private readonly db: AppSqliteDb) {}

  create(input: NewWorkout): Workout {
    const row = { ...insertStamp(), ...input };
    this.db.insert(workouts).values(row).run();
    return this.getById(row.id)!;
  }

  update(id: string, patch: Partial<NewWorkout>): void {
    this.db
      .update(workouts)
      .set({ ...patch, ...updateStamp() })
      .where(eq(workouts.id, id))
      .run();
  }

  softDelete(id: string): void {
    this.db.update(workouts).set(softDeleteStamp()).where(eq(workouts.id, id)).run();
  }

  getById(id: string): Workout | undefined {
    return this.db
      .select()
      .from(workouts)
      .where(and(eq(workouts.id, id), notDeleted(workouts.deletedAt)))
      .get();
  }

  listByDay(dayDate: string): Workout[] {
    return this.db
      .select()
      .from(workouts)
      .where(and(eq(workouts.dayDate, dayDate), notDeleted(workouts.deletedAt)))
      .orderBy(desc(workouts.startedAt))
      .all();
  }

  listRange(from: string, to: string): Workout[] {
    return this.db
      .select()
      .from(workouts)
      .where(and(gte(workouts.dayDate, from), lte(workouts.dayDate, to), notDeleted(workouts.deletedAt)))
      .orderBy(workouts.dayDate)
      .all();
  }

  /** Minutos totales entrenados en el día (sesiones cerradas). */
  minutesForDay(dayDate: string): number {
    return this.listByDay(dayDate).reduce((sum, w) => {
      if (!w.endedAt) return sum;
      return sum + Math.max(0, (w.endedAt - w.startedAt) / 60_000);
    }, 0);
  }

  // ── Ejercicios y series de una sesión ──────────────────────────

  addExercise(workoutId: string, exerciseId: string): WorkoutExercise {
    const existing = this.listExercises(workoutId);
    const row = {
      ...insertStamp(),
      workoutId,
      exerciseId,
      orderIndex: existing.length,
    };
    this.db.insert(workoutExercises).values(row).run();
    return this.db.select().from(workoutExercises).where(eq(workoutExercises.id, row.id)).get()!;
  }

  removeExercise(workoutExerciseId: string): void {
    this.db
      .update(workoutExercises)
      .set(softDeleteStamp())
      .where(eq(workoutExercises.id, workoutExerciseId))
      .run();
  }

  listExercises(workoutId: string): WorkoutExercise[] {
    return this.db
      .select()
      .from(workoutExercises)
      .where(and(eq(workoutExercises.workoutId, workoutId), notDeleted(workoutExercises.deletedAt)))
      .orderBy(asc(workoutExercises.orderIndex))
      .all();
  }

  addSet(
    workoutExerciseId: string,
    input: {
      reps?: number;
      weightKg?: number;
      rpe?: number;
      isWarmup?: number;
      durationS?: number;
      distanceM?: number;
    },
  ): WorkoutSet {
    const setCount = this.listSets(workoutExerciseId).length;
    const row = { ...insertStamp(), workoutExerciseId, setIndex: setCount, ...input };
    this.db.insert(workoutSets).values(row).run();
    return this.db.select().from(workoutSets).where(eq(workoutSets.id, row.id)).get()!;
  }

  updateSet(
    setId: string,
    patch: Partial<{ reps: number; weightKg: number; rpe: number; isWarmup: number; durationS: number; distanceM: number }>,
  ): void {
    this.db
      .update(workoutSets)
      .set({ ...patch, ...updateStamp() })
      .where(eq(workoutSets.id, setId))
      .run();
  }

  removeSet(setId: string): void {
    this.db.update(workoutSets).set(softDeleteStamp()).where(eq(workoutSets.id, setId)).run();
  }

  listSets(workoutExerciseId: string): WorkoutSet[] {
    return this.db
      .select()
      .from(workoutSets)
      .where(and(eq(workoutSets.workoutExerciseId, workoutExerciseId), notDeleted(workoutSets.deletedAt)))
      .orderBy(asc(workoutSets.setIndex))
      .all();
  }

  /** Sesión completa: ejercicios ordenados con sus series y datos del catálogo. */
  getFullSession(workoutId: string): WorkoutExerciseWithSets[] {
    const wex = this.db
      .select({ wex: workoutExercises, exercise: exercises })
      .from(workoutExercises)
      .innerJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
      .where(and(eq(workoutExercises.workoutId, workoutId), notDeleted(workoutExercises.deletedAt)))
      .orderBy(asc(workoutExercises.orderIndex))
      .all();
    return wex.map((r) => ({ ...r.wex, exercise: r.exercise, sets: this.listSets(r.wex.id) }));
  }

  /**
   * Series de la última sesión donde se hizo este ejercicio (valores fantasma
   * del logger: "la vez pasada hiciste 3×8 con 80 kg").
   */
  lastSessionSets(exerciseId: string, beforeWorkoutId?: string): WorkoutSet[] {
    const candidates = this.db
      .select({ wex: workoutExercises, workout: workouts })
      .from(workoutExercises)
      .innerJoin(workouts, eq(workoutExercises.workoutId, workouts.id))
      .where(
        and(
          eq(workoutExercises.exerciseId, exerciseId),
          notDeleted(workoutExercises.deletedAt),
          notDeleted(workouts.deletedAt),
        ),
      )
      .orderBy(desc(workouts.startedAt))
      .limit(10)
      .all();

    for (const c of candidates) {
      if (beforeWorkoutId && c.wex.workoutId === beforeWorkoutId) continue;
      const sets = this.listSets(c.wex.id);
      if (sets.length > 0) return sets;
    }
    return [];
  }

  /**
   * Mejor e1RM histórico de un ejercicio ANTES de un set dado (detección de PR):
   * si el nuevo set supera este valor, es récord.
   */
  bestE1Rm(exerciseId: string, excludeSetId?: string): number {
    const rows = this.db
      .select({ set: workoutSets })
      .from(workoutSets)
      .innerJoin(workoutExercises, eq(workoutSets.workoutExerciseId, workoutExercises.id))
      .where(
        and(
          eq(workoutExercises.exerciseId, exerciseId),
          eq(workoutSets.isWarmup, 0),
          notDeleted(workoutSets.deletedAt),
          notDeleted(workoutExercises.deletedAt),
        ),
      )
      .all();

    let best = 0;
    for (const { set } of rows) {
      if (excludeSetId && set.id === excludeSetId) continue;
      if (set.reps != null && set.weightKg != null) {
        best = Math.max(best, epleyE1Rm(set.weightKg, set.reps));
      }
    }
    return best;
  }

  /** Historia de e1RM máximo por día para el gráfico del ejercicio. */
  e1RmHistory(exerciseId: string): { dayDate: string; e1Rm: number }[] {
    const rows = this.db
      .select({ set: workoutSets, workout: workouts })
      .from(workoutSets)
      .innerJoin(workoutExercises, eq(workoutSets.workoutExerciseId, workoutExercises.id))
      .innerJoin(workouts, eq(workoutExercises.workoutId, workouts.id))
      .where(
        and(
          eq(workoutExercises.exerciseId, exerciseId),
          eq(workoutSets.isWarmup, 0),
          notDeleted(workoutSets.deletedAt),
          notDeleted(workoutExercises.deletedAt),
          notDeleted(workouts.deletedAt),
        ),
      )
      .all();

    const byDay = new Map<string, number>();
    for (const { set, workout } of rows) {
      if (set.reps == null || set.weightKg == null) continue;
      const e1 = epleyE1Rm(set.weightKg, set.reps);
      byDay.set(workout.dayDate, Math.max(byDay.get(workout.dayDate) ?? 0, e1));
    }
    return [...byDay.entries()]
      .map(([dayDate, e1Rm]) => ({ dayDate, e1Rm }))
      .sort((a, b) => (a.dayDate < b.dayDate ? -1 : 1));
  }

  /** Volumen de fuerza del día: Σ reps × kg de series efectivas (sin warmups). */
  strengthVolumeForDay(dayDate: string): number {
    const dayWorkouts = this.listByDay(dayDate).filter((w) => w.type === 'strength');
    if (dayWorkouts.length === 0) return 0;

    const wex = this.db
      .select({ id: workoutExercises.id })
      .from(workoutExercises)
      .where(
        and(
          inArray(
            workoutExercises.workoutId,
            dayWorkouts.map((w) => w.id),
          ),
          notDeleted(workoutExercises.deletedAt),
        ),
      )
      .all();
    if (wex.length === 0) return 0;

    const sets = this.db
      .select()
      .from(workoutSets)
      .where(
        and(
          inArray(
            workoutSets.workoutExerciseId,
            wex.map((x) => x.id),
          ),
          eq(workoutSets.isWarmup, 0),
          notDeleted(workoutSets.deletedAt),
        ),
      )
      .all();

    return sets.reduce((sum, s) => sum + (s.reps ?? 0) * (s.weightKg ?? 0), 0);
  }
}
