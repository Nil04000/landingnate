import { and, desc, eq, gte, lte } from 'drizzle-orm';

import { hydrationEntries } from '../schema';
import type { AppSqliteDb } from '../types';
import { insertStamp, notDeleted, softDeleteStamp } from './base.repository';

export type HydrationEntry = typeof hydrationEntries.$inferSelect;

export type NewHydrationEntry = {
  dayDate: string;
  loggedAt: number;
  amountMl: number;
  kind?: string;
};

export class HydrationRepository {
  constructor(private readonly db: AppSqliteDb) {}

  log(input: NewHydrationEntry): HydrationEntry {
    const row = { ...insertStamp(), kind: 'water', ...input };
    this.db.insert(hydrationEntries).values(row).run();
    return this.getById(row.id)!;
  }

  softDelete(id: string): void {
    this.db
      .update(hydrationEntries)
      .set(softDeleteStamp())
      .where(eq(hydrationEntries.id, id))
      .run();
  }

  getById(id: string): HydrationEntry | undefined {
    return this.db
      .select()
      .from(hydrationEntries)
      .where(and(eq(hydrationEntries.id, id), notDeleted(hydrationEntries.deletedAt)))
      .get();
  }

  listByDay(dayDate: string): HydrationEntry[] {
    return this.db
      .select()
      .from(hydrationEntries)
      .where(and(eq(hydrationEntries.dayDate, dayDate), notDeleted(hydrationEntries.deletedAt)))
      .orderBy(desc(hydrationEntries.loggedAt))
      .all();
  }

  listRange(from: string, to: string): HydrationEntry[] {
    return this.db
      .select()
      .from(hydrationEntries)
      .where(
        and(
          gte(hydrationEntries.dayDate, from),
          lte(hydrationEntries.dayDate, to),
          notDeleted(hydrationEntries.deletedAt),
        ),
      )
      .orderBy(hydrationEntries.dayDate)
      .all();
  }

  totalMlForDay(dayDate: string): number {
    return this.listByDay(dayDate).reduce((sum, e) => sum + e.amountMl, 0);
  }
}
