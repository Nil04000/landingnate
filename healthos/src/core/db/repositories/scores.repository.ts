import { and, eq, gte, lte } from 'drizzle-orm';

import type { ScoreBreakdown } from '@/features/health-score/engine/types';
import { scoreBreakdownSchema } from '@/features/health-score/engine/types';

import { dailyAggregates, healthScores } from '../schema';
import type { AppSqliteDb } from '../types';
import { insertStamp, notDeleted, updateStamp } from './base.repository';

export type HealthScoreRow = typeof healthScores.$inferSelect;

export class ScoresRepository {
  constructor(private readonly db: AppSqliteDb) {}

  /** Upsert del score del día + espejo en daily_aggregates.health_score. */
  upsertForDay(dayDate: string, breakdown: ScoreBreakdown): void {
    const componentsJson = JSON.stringify(breakdown);
    const existing = this.db
      .select()
      .from(healthScores)
      .where(and(eq(healthScores.dayDate, dayDate), notDeleted(healthScores.deletedAt)))
      .get();

    if (existing) {
      this.db
        .update(healthScores)
        .set({
          score: breakdown.score,
          componentsJson,
          algoVersion: breakdown.algoVersion,
          computedAt: Date.now(),
          ...updateStamp(),
        })
        .where(eq(healthScores.id, existing.id))
        .run();
    } else {
      this.db
        .insert(healthScores)
        .values({
          ...insertStamp(),
          dayDate,
          score: breakdown.score,
          componentsJson,
          algoVersion: breakdown.algoVersion,
          computedAt: Date.now(),
        })
        .run();
    }

    this.db
      .update(dailyAggregates)
      .set({ healthScore: breakdown.score })
      .where(eq(dailyAggregates.dayDate, dayDate))
      .run();
  }

  /** Desglose validado con zod (null si no existe o no parsea). */
  getBreakdown(dayDate: string): ScoreBreakdown | null {
    const row = this.db
      .select()
      .from(healthScores)
      .where(and(eq(healthScores.dayDate, dayDate), notDeleted(healthScores.deletedAt)))
      .get();
    if (!row) return null;
    const parsed = scoreBreakdownSchema.safeParse(JSON.parse(row.componentsJson));
    return parsed.success ? parsed.data : null;
  }

  listRange(from: string, to: string): HealthScoreRow[] {
    return this.db
      .select()
      .from(healthScores)
      .where(
        and(gte(healthScores.dayDate, from), lte(healthScores.dayDate, to), notDeleted(healthScores.deletedAt)),
      )
      .orderBy(healthScores.dayDate)
      .all();
  }
}
