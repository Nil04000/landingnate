import { and, desc, eq, gte, inArray, lte } from 'drizzle-orm';

import { workoutExercises, workoutSets, workouts } from '../schema';
import type { AppSqliteDb } from '../types';
import { insertStamp, notDeleted, softDeleteStamp, updateStamp } from './base.repository';

export type Workout = typeof workouts.$inferSelect;
export type WorkoutSet = typeof workoutSets.$inferSelect;

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
