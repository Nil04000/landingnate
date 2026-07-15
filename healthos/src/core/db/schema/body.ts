import { index, real, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { dayDate, syncColumns } from './_base';

/** Una fila por evento de medición corporal (peso, % graso, circunferencias). */
export const bodyMeasurements = sqliteTable(
  'body_measurements',
  {
    ...syncColumns,
    dayDate: dayDate(),
    measuredAt: integer('measured_at').notNull(),
    weightKg: real('weight_kg'),
    bodyFatPct: real('body_fat_pct'),
    waistCm: real('waist_cm'),
    chestCm: real('chest_cm'),
    armCm: real('arm_cm'),
    thighCm: real('thigh_cm'),
    notes: text('notes'),
  },
  (t) => [index('idx_body_day').on(t.dayDate)],
);
