import { DailyAggregatesRepository } from '@/core/db/repositories/aggregates.repository';
import { ScoresRepository } from '@/core/db/repositories/scores.repository';
import type { AppSqliteDb } from '@/core/db/types';
import { addDaysLocal } from '@/core/lib/dates';

import { computeScore } from './score-engine';
import { defaultScoreGoals, type ScoreBreakdown } from './types';

/**
 * Orquestador: reconstruye (si hace falta) el agregado del día, computa el
 * score con la ventana de 28 días previos y lo persiste (health_scores +
 * espejo en daily_aggregates). Se llama después de cada write de dominio
 * y al abrir la app para el día anterior.
 */
export function computeAndStoreScore(db: AppSqliteDb, dayDate: string): ScoreBreakdown {
  const aggregates = new DailyAggregatesRepository(db);
  const scores = new ScoresRepository(db);

  const agg = (() => {
    const existing = aggregates.getDay(dayDate);
    if (existing && !existing.isStale) return existing;
    return aggregates.rebuildDay(dayDate);
  })();

  const trailing = aggregates.getRange(addDaysLocal(dayDate, -28), addDaysLocal(dayDate, -1));
  const breakdown = computeScore(agg, { goals: defaultScoreGoals, trailing });
  scores.upsertForDay(dayDate, breakdown);
  return breakdown;
}
