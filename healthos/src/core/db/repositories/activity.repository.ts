import { and, eq, gte, lte } from 'drizzle-orm';

import { activityEntries } from '../schema';
import type { AppSqliteDb } from '../types';
import { insertStamp, notDeleted, updateStamp } from './base.repository';

export type ActivityEntry = typeof activityEntries.$inferSelect;

export type ActivityUpsert = {
  dayDate: string;
  steps?: number;
  activeKcal?: number;
  distanceM?: number;
};

export class ActivityRepository {
  constructor(private readonly db: AppSqliteDb) {}

  /**
   * Upsert por (día, fuente): los pasos del día se corrigen, no se acumulan.
   * Fuente 'manual' hoy; 'pedometer'/'healthkit' en el futuro.
   */
  upsertForDay(input: ActivityUpsert, source = 'manual'): ActivityEntry {
    const existing = this.getForDay(input.dayDate, source);
    if (existing) {
      this.db
        .update(activityEntries)
        .set({ ...input, ...updateStamp() })
        .where(eq(activityEntries.id, existing.id))
        .run();
      return this.getForDay(input.dayDate, source)!;
    }
    const row = { ...insertStamp(), source, ...input };
    this.db.insert(activityEntries).values(row).run();
    return this.getForDay(input.dayDate, source)!;
  }

  getForDay(dayDate: string, source = 'manual'): ActivityEntry | undefined {
    return this.db
      .select()
      .from(activityEntries)
      .where(
        and(
          eq(activityEntries.dayDate, dayDate),
          eq(activityEntries.source, source),
          notDeleted(activityEntries.deletedAt),
        ),
      )
      .get();
  }

  listRange(from: string, to: string): ActivityEntry[] {
    return this.db
      .select()
      .from(activityEntries)
      .where(
        and(
          gte(activityEntries.dayDate, from),
          lte(activityEntries.dayDate, to),
          notDeleted(activityEntries.deletedAt),
        ),
      )
      .orderBy(activityEntries.dayDate)
      .all();
  }
}
