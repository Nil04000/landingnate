import { and, desc, eq, gte, lte } from 'drizzle-orm';

import { substanceEntries } from '../schema';
import type { AppSqliteDb } from '../types';
import { insertStamp, notDeleted, softDeleteStamp } from './base.repository';

export type SubstanceEntry = typeof substanceEntries.$inferSelect;

export type SubstanceType =
  | 'coffee'
  | 'espresso'
  | 'energy_drink'
  | 'preworkout'
  | 'alcohol'
  | 'cigarette'
  | 'vape'
  | 'other';

export type NewSubstanceEntry = {
  dayDate: string;
  consumedAt: number;
  type: SubstanceType;
  label?: string;
  quantity?: number;
  volumeMl?: number;
  caffeineMg?: number;
  alcoholGrams?: number;
  nicotineMg?: number;
  kcal?: number;
};

export class SubstancesRepository {
  constructor(private readonly db: AppSqliteDb) {}

  log(input: NewSubstanceEntry): SubstanceEntry {
    const row = { ...insertStamp(), quantity: 1, ...input };
    this.db.insert(substanceEntries).values(row).run();
    return this.getById(row.id)!;
  }

  softDelete(id: string): void {
    this.db.update(substanceEntries).set(softDeleteStamp()).where(eq(substanceEntries.id, id)).run();
  }

  getById(id: string): SubstanceEntry | undefined {
    return this.db
      .select()
      .from(substanceEntries)
      .where(and(eq(substanceEntries.id, id), notDeleted(substanceEntries.deletedAt)))
      .get();
  }

  listByDay(dayDate: string): SubstanceEntry[] {
    return this.db
      .select()
      .from(substanceEntries)
      .where(and(eq(substanceEntries.dayDate, dayDate), notDeleted(substanceEntries.deletedAt)))
      .orderBy(desc(substanceEntries.consumedAt))
      .all();
  }

  listRange(from: string, to: string): SubstanceEntry[] {
    return this.db
      .select()
      .from(substanceEntries)
      .where(
        and(
          gte(substanceEntries.dayDate, from),
          lte(substanceEntries.dayDate, to),
          notDeleted(substanceEntries.deletedAt),
        ),
      )
      .orderBy(substanceEntries.dayDate)
      .all();
  }
}
