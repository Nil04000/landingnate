import { and, desc, eq, gte, lte } from 'drizzle-orm';

import { sleepSessions } from '../schema';
import type { AppSqliteDb } from '../types';
import { insertStamp, notDeleted, softDeleteStamp, updateStamp } from './base.repository';

export type SleepSession = typeof sleepSessions.$inferSelect;

export type NewSleepSession = {
  /** Día al que se acredita (día del despertar) */
  dayDate: string;
  startAt: number;
  endAt: number;
  isNap?: number;
  qualityRating?: number;
  awakenings?: number;
  notes?: string;
};

export class SleepRepository {
  constructor(private readonly db: AppSqliteDb) {}

  log(input: NewSleepSession): SleepSession {
    const row = { ...insertStamp(), source: 'manual', ...input };
    this.db.insert(sleepSessions).values(row).run();
    return this.getById(row.id)!;
  }

  update(id: string, patch: Partial<NewSleepSession>): void {
    this.db
      .update(sleepSessions)
      .set({ ...patch, ...updateStamp() })
      .where(eq(sleepSessions.id, id))
      .run();
  }

  softDelete(id: string): void {
    this.db.update(sleepSessions).set(softDeleteStamp()).where(eq(sleepSessions.id, id)).run();
  }

  getById(id: string): SleepSession | undefined {
    return this.db
      .select()
      .from(sleepSessions)
      .where(and(eq(sleepSessions.id, id), notDeleted(sleepSessions.deletedAt)))
      .get();
  }

  listByDay(dayDate: string): SleepSession[] {
    return this.db
      .select()
      .from(sleepSessions)
      .where(and(eq(sleepSessions.dayDate, dayDate), notDeleted(sleepSessions.deletedAt)))
      .orderBy(desc(sleepSessions.startAt))
      .all();
  }

  listRange(from: string, to: string): SleepSession[] {
    return this.db
      .select()
      .from(sleepSessions)
      .where(
        and(
          gte(sleepSessions.dayDate, from),
          lte(sleepSessions.dayDate, to),
          notDeleted(sleepSessions.deletedAt),
        ),
      )
      .orderBy(sleepSessions.dayDate)
      .all();
  }

  /** Minutos de sueño del día: { principal, siestas }. */
  minutesForDay(dayDate: string): { sleepMinutes: number; napMinutes: number } {
    const sessions = this.listByDay(dayDate);
    let sleepMinutes = 0;
    let napMinutes = 0;
    for (const s of sessions) {
      const minutes = Math.max(0, (s.endAt - s.startAt) / 60_000);
      if (s.isNap) napMinutes += minutes;
      else sleepMinutes += minutes;
    }
    return { sleepMinutes, napMinutes };
  }
}
