import { and, desc, eq, gt, isNull, lt } from 'drizzle-orm';

import type { InsightFinding } from '@/features/insights/engine/evaluators';

import { insights } from '../schema';
import type { AppSqliteDb } from '../types';
import { insertStamp, notDeleted, softDeleteStamp, updateStamp } from './base.repository';

export type InsightRow = typeof insights.$inferSelect;

const VALID_DAYS = 14;

export class InsightsRepository {
  constructor(private readonly db: AppSqliteDb) {}

  /**
   * Upsert por dedupeKey (regla + semana ISO): una regla refresca su fila
   * semanal en lugar de duplicarla. Un hallazgo descartado solo reaparece
   * si su efecto creció ≥20%.
   */
  upsert(finding: InsightFinding, dedupeKey: string, now = Date.now()): 'inserted' | 'updated' | 'skipped' {
    const existing = this.db
      .select()
      .from(insights)
      .where(eq(insights.dedupeKey, dedupeKey))
      .get();

    const payload = {
      ruleId: finding.ruleId,
      kind: finding.kind,
      title: finding.title,
      body: finding.body,
      metricsJson: JSON.stringify(finding.metrics),
      severity: finding.severity,
      relevance: finding.relevance,
      periodStart: finding.periodStart,
      periodEnd: finding.periodEnd,
      validUntil: now + VALID_DAYS * 86_400_000,
    };

    if (!existing) {
      this.db
        .insert(insights)
        .values({ ...insertStamp(), ...payload, dedupeKey, status: 'new' })
        .run();
      return 'inserted';
    }

    if (existing.status === 'dismissed') {
      if (finding.relevance < existing.relevance * 1.2) return 'skipped';
      this.db
        .update(insights)
        .set({ ...payload, status: 'new', deletedAt: null, ...updateStamp() })
        .where(eq(insights.id, existing.id))
        .run();
      return 'updated';
    }

    this.db
      .update(insights)
      .set({ ...payload, deletedAt: null, ...updateStamp() })
      .where(eq(insights.id, existing.id))
      .run();
    return 'updated';
  }

  /** Vigentes, no descartados, por relevancia. */
  listActive(limit = 50, now = Date.now()): InsightRow[] {
    return this.db
      .select()
      .from(insights)
      .where(
        and(
          notDeleted(insights.deletedAt),
          gt(insights.validUntil, now),
          eq(insights.status, 'new'),
        ),
      )
      .orderBy(desc(insights.relevance))
      .limit(limit)
      .all();
  }

  /** Todos los visibles (nuevos y vistos) para la pantalla de insights. */
  listVisible(limit = 100, now = Date.now()): InsightRow[] {
    const rows = this.db
      .select()
      .from(insights)
      .where(and(notDeleted(insights.deletedAt), gt(insights.validUntil, now)))
      .orderBy(desc(insights.relevance))
      .limit(limit)
      .all();
    return rows.filter((r) => r.status !== 'dismissed');
  }

  getById(id: string): InsightRow | undefined {
    return this.db
      .select()
      .from(insights)
      .where(and(eq(insights.id, id), notDeleted(insights.deletedAt)))
      .get();
  }

  markSeen(id: string): void {
    const row = this.getById(id);
    if (!row || row.status !== 'new') return;
    this.db
      .update(insights)
      .set({ status: 'seen', ...updateStamp() })
      .where(eq(insights.id, id))
      .run();
  }

  dismiss(id: string): void {
    this.db
      .update(insights)
      .set({ status: 'dismissed', ...updateStamp() })
      .where(eq(insights.id, id))
      .run();
  }

  /** Soft-delete de vencidos (higiene periódica del pipeline). */
  expireOld(now = Date.now()): number {
    const stale = this.db
      .select({ id: insights.id })
      .from(insights)
      .where(and(isNull(insights.deletedAt), lt(insights.validUntil, now)))
      .all();
    for (const row of stale) {
      this.db.update(insights).set(softDeleteStamp()).where(eq(insights.id, row.id)).run();
    }
    return stale.length;
  }
}
