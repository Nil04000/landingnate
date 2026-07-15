import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { dayDate, syncColumns } from './_base';

/**
 * Check-ins subjetivos (se permiten varios por día; el agregado promedia).
 * Escalas 1..5. Convención: stress y soreness 5 = peor; el resto 5 = mejor.
 */
export const wellbeingEntries = sqliteTable(
  'wellbeing_entries',
  {
    ...syncColumns,
    dayDate: dayDate(),
    loggedAt: integer('logged_at').notNull(),
    mood: integer('mood'),
    energy: integer('energy'),
    stress: integer('stress'),
    libido: integer('libido'),
    soreness: integer('soreness'),
    sorenessArea: text('soreness_area'),
  },
  (t) => [index('idx_wellbeing_day').on(t.dayDate)],
);

/** Nota del día (markdown), única por fecha. */
export const dailyNotes = sqliteTable(
  'daily_notes',
  {
    ...syncColumns,
    dayDate: dayDate(),
    content: text('content').notNull(),
  },
  (t) => [uniqueIndex('uq_note_day').on(t.dayDate)],
);
