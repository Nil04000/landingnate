import { and, asc, eq, like, or, sql } from 'drizzle-orm';

import { exercises } from '../schema';
import type { AppSqliteDb } from '../types';
import { insertStamp, notDeleted, softDeleteStamp, updateStamp } from './base.repository';

export type Exercise = typeof exercises.$inferSelect;

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'legs'
  | 'shoulders'
  | 'arms'
  | 'core'
  | 'full_body'
  | 'cardio';

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  chest: 'Pecho',
  back: 'Espalda',
  legs: 'Piernas',
  shoulders: 'Hombros',
  arms: 'Brazos',
  core: 'Core',
  full_body: 'Cuerpo completo',
  cardio: 'Cardio',
};

export class ExercisesRepository {
  constructor(private readonly db: AppSqliteDb) {}

  create(input: { name: string; muscleGroup: MuscleGroup; equipment?: string }): Exercise {
    const row = {
      ...insertStamp(),
      name: input.name,
      muscleGroup: input.muscleGroup,
      equipment: input.equipment ?? null,
      isCustom: 1,
    };
    this.db.insert(exercises).values(row).run();
    return this.getById(row.id)!;
  }

  update(id: string, patch: Partial<{ name: string; muscleGroup: MuscleGroup; equipment: string }>): void {
    this.db
      .update(exercises)
      .set({ ...patch, ...updateStamp() })
      .where(eq(exercises.id, id))
      .run();
  }

  softDelete(id: string): void {
    this.db.update(exercises).set(softDeleteStamp()).where(eq(exercises.id, id)).run();
  }

  getById(id: string): Exercise | undefined {
    return this.db
      .select()
      .from(exercises)
      .where(and(eq(exercises.id, id), notDeleted(exercises.deletedAt)))
      .get();
  }

  /** Búsqueda por nombre (prefijos primero) con filtro opcional por grupo. */
  search(query: string, muscleGroup?: MuscleGroup, limit = 40): Exercise[] {
    const conditions = [notDeleted(exercises.deletedAt)];
    const trimmed = query.trim();
    if (trimmed) {
      const pattern = `%${trimmed}%`;
      conditions.push(or(like(exercises.name, pattern))!);
    }
    if (muscleGroup) conditions.push(eq(exercises.muscleGroup, muscleGroup));

    const prefix = `${trimmed}%`;
    return this.db
      .select()
      .from(exercises)
      .where(and(...conditions))
      .orderBy(
        trimmed
          ? sql`CASE WHEN ${exercises.name} LIKE ${prefix} THEN 0 ELSE 1 END`
          : asc(exercises.muscleGroup),
        asc(exercises.name),
      )
      .limit(limit)
      .all();
  }
}
