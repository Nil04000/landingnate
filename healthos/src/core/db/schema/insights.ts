import { integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { syncColumns } from './_base';

/**
 * Cache de hallazgos generados por el motor de insights.
 * `dedupeKey = ruleId + ':' + semanaISO(periodEnd)` — una regla refresca su
 * fila dentro de la misma semana en lugar de duplicarla.
 */
export const insights = sqliteTable(
  'insights',
  {
    ...syncColumns,
    /** ej. 'corr.caffeine_mg->sleep_minutes.lag0' */
    ruleId: text('rule_id').notNull(),
    /** correlation | weekday | threshold | trend | record | streak */
    kind: text('kind').notNull(),
    title: text('title').notNull(),
    body: text('body').notNull(),
    /** JSON {r, n, pApprox, d, effect, windowDays, ...} */
    metricsJson: text('metrics_json').notNull(),
    /** info | notable | warning */
    severity: text('severity').notNull(),
    /** Score de ranking para ordenar en Inicio */
    relevance: real('relevance').notNull(),
    periodStart: text('period_start').notNull(),
    periodEnd: text('period_end').notNull(),
    dedupeKey: text('dedupe_key').notNull(),
    /** new | seen | dismissed */
    status: text('status').notNull().default('new'),
    validUntil: integer('valid_until'),
  },
  (t) => [uniqueIndex('uq_insight_dedupe').on(t.dedupeKey)],
);
