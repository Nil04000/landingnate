import { integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { dayDate, syncColumns } from './_base';

/**
 * Totales diarios de actividad (pasos, kcal activas, distancia).
 * Una fila por día+fuente: 'manual' hoy, 'pedometer'/'healthkit' en el futuro
 * sin migración (la fuente de mayor prioridad gana al agregar).
 */
export const activityEntries = sqliteTable(
  'activity_entries',
  {
    ...syncColumns,
    dayDate: dayDate(),
    steps: integer('steps'),
    activeKcal: real('active_kcal'),
    distanceM: integer('distance_m'),
    source: text('source').notNull().default('manual'),
  },
  (t) => [uniqueIndex('uq_activity_day_source').on(t.dayDate, t.source)],
);
