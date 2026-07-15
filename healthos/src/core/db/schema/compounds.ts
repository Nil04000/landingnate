import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { dayDate, syncColumns } from './_base';

/** Catálogo personal de suplementos y medicación (QUÉ tomo). */
export const compoundDefinitions = sqliteTable('compound_definitions', {
  ...syncColumns,
  /** supplement | medication */
  kind: text('kind').notNull(),
  name: text('name').notNull(),
  brand: text('brand'),
  defaultDoseAmount: real('default_dose_amount'),
  /** mg | g | IU | ug | capsule | ml */
  defaultDoseUnit: text('default_dose_unit'),
  /** JSON {"times":["08:00","22:00"],"days":[0..6]} — agenda para adherencia/recordatorios */
  scheduleJson: text('schedule_json'),
  /**
   * Clave de nutriente de `nutrient_targets` (ej. 'vitamin_d_ug'):
   * la dosis suma a la cobertura de micronutrientes del día.
   */
  linkedNutrientKey: text('linked_nutrient_key'),
  isActive: integer('is_active').notNull().default(1),
});

/** Log de tomas (CUÁNDO lo tomé). `skipped=1` registra omisión explícita. */
export const compoundIntakes = sqliteTable(
  'compound_intakes',
  {
    ...syncColumns,
    compoundId: text('compound_id')
      .notNull()
      .references(() => compoundDefinitions.id),
    dayDate: dayDate(),
    takenAt: integer('taken_at').notNull(),
    doseAmount: real('dose_amount').notNull(),
    doseUnit: text('dose_unit').notNull(),
    skipped: integer('skipped').notNull().default(0),
  },
  (t) => [index('idx_intake_day').on(t.dayDate)],
);
