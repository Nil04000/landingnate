import { and, desc, eq, gte, isNotNull, lte } from 'drizzle-orm';

import { bodyMeasurements } from '../schema';
import type { AppSqliteDb } from '../types';
import { insertStamp, notDeleted, softDeleteStamp, updateStamp } from './base.repository';

export type BodyMeasurement = typeof bodyMeasurements.$inferSelect;

export type NewBodyMeasurement = {
  dayDate: string;
  measuredAt: number;
  weightKg?: number;
  bodyFatPct?: number;
  waistCm?: number;
  chestCm?: number;
  armCm?: number;
  thighCm?: number;
  notes?: string;
};

export class BodyRepository {
  constructor(private readonly db: AppSqliteDb) {}

  log(input: NewBodyMeasurement): BodyMeasurement {
    const row = { ...insertStamp(), ...input };
    this.db.insert(bodyMeasurements).values(row).run();
    return this.getById(row.id)!;
  }

  update(id: string, patch: Partial<NewBodyMeasurement>): void {
    this.db
      .update(bodyMeasurements)
      .set({ ...patch, ...updateStamp() })
      .where(eq(bodyMeasurements.id, id))
      .run();
  }

  softDelete(id: string): void {
    this.db
      .update(bodyMeasurements)
      .set(softDeleteStamp())
      .where(eq(bodyMeasurements.id, id))
      .run();
  }

  getById(id: string): BodyMeasurement | undefined {
    return this.db
      .select()
      .from(bodyMeasurements)
      .where(and(eq(bodyMeasurements.id, id), notDeleted(bodyMeasurements.deletedAt)))
      .get();
  }

  listByDay(dayDate: string): BodyMeasurement[] {
    return this.db
      .select()
      .from(bodyMeasurements)
      .where(and(eq(bodyMeasurements.dayDate, dayDate), notDeleted(bodyMeasurements.deletedAt)))
      .orderBy(desc(bodyMeasurements.measuredAt))
      .all();
  }

  listRange(from: string, to: string): BodyMeasurement[] {
    return this.db
      .select()
      .from(bodyMeasurements)
      .where(
        and(
          gte(bodyMeasurements.dayDate, from),
          lte(bodyMeasurements.dayDate, to),
          notDeleted(bodyMeasurements.deletedAt),
        ),
      )
      .orderBy(bodyMeasurements.dayDate)
      .all();
  }

  /** Último peso registrado (para la card de Inicio y deltas). */
  latestWeight(): BodyMeasurement | undefined {
    return this.db
      .select()
      .from(bodyMeasurements)
      .where(and(isNotNull(bodyMeasurements.weightKg), notDeleted(bodyMeasurements.deletedAt)))
      .orderBy(desc(bodyMeasurements.measuredAt))
      .limit(1)
      .get();
  }
}
