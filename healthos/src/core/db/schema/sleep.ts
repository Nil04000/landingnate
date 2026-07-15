import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { dayDate, syncColumns } from './_base';

/**
 * Sueño principal Y siestas (`isNap`).
 * `dayDate` = día al que se acredita el sueño (día del despertar).
 */
export const sleepSessions = sqliteTable(
  'sleep_sessions',
  {
    ...syncColumns,
    dayDate: dayDate(),
    startAt: integer('start_at').notNull(),
    endAt: integer('end_at').notNull(),
    isNap: integer('is_nap').notNull().default(0),
    /** Calidad subjetiva 1..5 */
    qualityRating: integer('quality_rating'),
    awakenings: integer('awakenings'),
    /** 'manual' hoy; 'healthkit' en el futuro */
    source: text('source').notNull().default('manual'),
    notes: text('notes'),
  },
  (t) => [index('idx_sleep_day').on(t.dayDate)],
);
