import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { dayDate, syncColumns } from './_base';

/**
 * Health Score diario 0..100 (null = datos insuficientes, nunca un número
 * engañoso). `componentsJson` guarda el desglose completo (ScoreBreakdown,
 * validado con zod) que alimenta la pantalla "por qué subió/bajó".
 */
export const healthScores = sqliteTable(
  'health_scores',
  {
    ...syncColumns,
    dayDate: dayDate(),
    score: integer('score'),
    componentsJson: text('components_json').notNull(),
    algoVersion: integer('algo_version').notNull(),
    computedAt: integer('computed_at').notNull(),
  },
  (t) => [uniqueIndex('uq_score_day').on(t.dayDate)],
);
