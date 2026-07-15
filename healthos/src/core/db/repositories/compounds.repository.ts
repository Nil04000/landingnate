import { and, desc, eq } from 'drizzle-orm';

import { compoundDefinitions, compoundIntakes } from '../schema';
import type { AppSqliteDb } from '../types';
import { insertStamp, notDeleted, softDeleteStamp, updateStamp } from './base.repository';

export type CompoundDefinition = typeof compoundDefinitions.$inferSelect;
export type CompoundIntake = typeof compoundIntakes.$inferSelect;

export type NewCompoundDefinition = {
  kind: 'supplement' | 'medication';
  name: string;
  brand?: string;
  defaultDoseAmount?: number;
  defaultDoseUnit?: string;
  scheduleJson?: string;
  linkedNutrientKey?: string;
};

export type NewCompoundIntake = {
  compoundId: string;
  dayDate: string;
  takenAt: number;
  doseAmount: number;
  doseUnit: string;
  skipped?: number;
};

export class CompoundsRepository {
  constructor(private readonly db: AppSqliteDb) {}

  // ── Definiciones (catálogo personal) ───────────────────────────

  createDefinition(input: NewCompoundDefinition): CompoundDefinition {
    const row = { ...insertStamp(), isActive: 1, ...input };
    this.db.insert(compoundDefinitions).values(row).run();
    return this.getDefinition(row.id)!;
  }

  updateDefinition(id: string, patch: Partial<NewCompoundDefinition & { isActive: number }>): void {
    this.db
      .update(compoundDefinitions)
      .set({ ...patch, ...updateStamp() })
      .where(eq(compoundDefinitions.id, id))
      .run();
  }

  archiveDefinition(id: string): void {
    this.updateDefinition(id, { isActive: 0 });
  }

  getDefinition(id: string): CompoundDefinition | undefined {
    return this.db
      .select()
      .from(compoundDefinitions)
      .where(and(eq(compoundDefinitions.id, id), notDeleted(compoundDefinitions.deletedAt)))
      .get();
  }

  listActiveDefinitions(): CompoundDefinition[] {
    return this.db
      .select()
      .from(compoundDefinitions)
      .where(and(eq(compoundDefinitions.isActive, 1), notDeleted(compoundDefinitions.deletedAt)))
      .orderBy(compoundDefinitions.name)
      .all();
  }

  // ── Tomas ──────────────────────────────────────────────────────

  logIntake(input: NewCompoundIntake): CompoundIntake {
    const row = { ...insertStamp(), skipped: 0, ...input };
    this.db.insert(compoundIntakes).values(row).run();
    return this.db
      .select()
      .from(compoundIntakes)
      .where(eq(compoundIntakes.id, row.id))
      .get()!;
  }

  softDeleteIntake(id: string): void {
    this.db.update(compoundIntakes).set(softDeleteStamp()).where(eq(compoundIntakes.id, id)).run();
  }

  listIntakesByDay(dayDate: string): CompoundIntake[] {
    return this.db
      .select()
      .from(compoundIntakes)
      .where(and(eq(compoundIntakes.dayDate, dayDate), notDeleted(compoundIntakes.deletedAt)))
      .orderBy(desc(compoundIntakes.takenAt))
      .all();
  }

  /**
   * Adherencia del día: tomas efectivas / (efectivas + omitidas).
   * null si no hubo registros (≠ 0%: sin datos no es incumplimiento).
   */
  adherenceForDay(dayDate: string): number | null {
    const intakes = this.listIntakesByDay(dayDate);
    if (intakes.length === 0) return null;
    const taken = intakes.filter((i) => !i.skipped).length;
    return (taken / intakes.length) * 100;
  }
}
