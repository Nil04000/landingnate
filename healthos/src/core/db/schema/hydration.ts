import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { dayDate, syncColumns } from './_base';

export const hydrationEntries = sqliteTable(
  'hydration_entries',
  {
    ...syncColumns,
    dayDate: dayDate(),
    loggedAt: integer('logged_at').notNull(),
    amountMl: integer('amount_ml').notNull(),
    /** water | sparkling | tea | other */
    kind: text('kind').notNull().default('water'),
  },
  (t) => [index('idx_hydration_day').on(t.dayDate)],
);
