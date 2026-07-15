import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { dayDate, syncColumns } from './_base';

/**
 * Entradas tipadas de sustancias: café, energéticas, alcohol, cigarrillos, vape.
 * Los campos cuantitativos (cafeína, etanol, nicotina, kcal) se resuelven AL
 * LOGUEAR desde presets — el análisis nunca re-deriva mg desde el tipo.
 */
export const substanceEntries = sqliteTable(
  'substance_entries',
  {
    ...syncColumns,
    dayDate: dayDate(),
    consumedAt: integer('consumed_at').notNull(),
    /** coffee | espresso | energy_drink | preworkout | alcohol | cigarette | vape | other */
    type: text('type').notNull(),
    /** Etiqueta libre: "Monster Ultra", "IPA 0.5l" */
    label: text('label'),
    /** Unidades: latas / copas / cigarrillos / sesiones de vape */
    quantity: real('quantity').notNull().default(1),
    volumeMl: integer('volume_ml'),
    caffeineMg: real('caffeine_mg'),
    /** Gramos de etanol puro (1 unidad estándar = 10 g) */
    alcoholGrams: real('alcohol_grams'),
    nicotineMg: real('nicotine_mg'),
    /** Calorías de energéticas/alcohol — suman al presupuesto energético del día */
    kcal: real('kcal'),
  },
  (t) => [index('idx_substance_day').on(t.dayDate), index('idx_substance_type').on(t.type)],
);
