import { and, desc, eq, gte, lte } from 'drizzle-orm';

import { dailyNotes, wellbeingEntries } from '../schema';
import type { AppSqliteDb } from '../types';
import { insertStamp, notDeleted, softDeleteStamp, updateStamp } from './base.repository';

export type WellbeingEntry = typeof wellbeingEntries.$inferSelect;
export type DailyNote = typeof dailyNotes.$inferSelect;

export type NewWellbeingEntry = {
  dayDate: string;
  loggedAt: number;
  mood?: number;
  energy?: number;
  stress?: number;
  libido?: number;
  soreness?: number;
  sorenessArea?: string;
};

export class WellbeingRepository {
  constructor(private readonly db: AppSqliteDb) {}

  log(input: NewWellbeingEntry): WellbeingEntry {
    const row = { ...insertStamp(), ...input };
    this.db.insert(wellbeingEntries).values(row).run();
    return this.db.select().from(wellbeingEntries).where(eq(wellbeingEntries.id, row.id)).get()!;
  }

  softDelete(id: string): void {
    this.db.update(wellbeingEntries).set(softDeleteStamp()).where(eq(wellbeingEntries.id, id)).run();
  }

  listByDay(dayDate: string): WellbeingEntry[] {
    return this.db
      .select()
      .from(wellbeingEntries)
      .where(and(eq(wellbeingEntries.dayDate, dayDate), notDeleted(wellbeingEntries.deletedAt)))
      .orderBy(desc(wellbeingEntries.loggedAt))
      .all();
  }

  listRange(from: string, to: string): WellbeingEntry[] {
    return this.db
      .select()
      .from(wellbeingEntries)
      .where(
        and(
          gte(wellbeingEntries.dayDate, from),
          lte(wellbeingEntries.dayDate, to),
          notDeleted(wellbeingEntries.deletedAt),
        ),
      )
      .orderBy(wellbeingEntries.dayDate)
      .all();
  }

  /** Promedios del día por dimensión (varios check-ins → media; null si no hay). */
  averagesForDay(dayDate: string): {
    mood: number | null;
    energy: number | null;
    stress: number | null;
    libido: number | null;
    soreness: number | null;
  } {
    const entries = this.listByDay(dayDate);
    const avg = (key: 'mood' | 'energy' | 'stress' | 'libido' | 'soreness') => {
      const vals = entries.map((e) => e[key]).filter((v): v is number => v != null);
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    };
    return {
      mood: avg('mood'),
      energy: avg('energy'),
      stress: avg('stress'),
      libido: avg('libido'),
      soreness: avg('soreness'),
    };
  }

  // ── Nota del día (única por fecha) ─────────────────────────────

  upsertNote(dayDate: string, content: string): DailyNote {
    const existing = this.getNote(dayDate);
    if (existing) {
      this.db
        .update(dailyNotes)
        .set({ content, ...updateStamp() })
        .where(eq(dailyNotes.id, existing.id))
        .run();
      return this.getNote(dayDate)!;
    }
    const row = { ...insertStamp(), dayDate, content };
    this.db.insert(dailyNotes).values(row).run();
    return this.getNote(dayDate)!;
  }

  getNote(dayDate: string): DailyNote | undefined {
    return this.db
      .select()
      .from(dailyNotes)
      .where(and(eq(dailyNotes.dayDate, dayDate), notDeleted(dailyNotes.deletedAt)))
      .get();
  }
}
