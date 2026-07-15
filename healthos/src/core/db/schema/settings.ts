import { index, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { syncColumns } from './_base';

/** Perfil del usuario — fila única con id = 'self'. */
export const userProfile = sqliteTable('user_profile', {
  ...syncColumns,
  /** male | female | null */
  sex: text('sex'),
  /** 'YYYY-MM-DD' */
  birthDate: text('birth_date'),
  heightCm: real('height_cm'),
  timezone: text('timezone').notNull(),
  /** metric | imperial */
  unitSystem: text('unit_system').notNull().default('metric'),
});

/**
 * Objetivos por métrica, con vigencia (`activeFrom`/`activeTo`):
 * cambiar el objetivo de peso NO reescribe la historia.
 */
export const goals = sqliteTable(
  'goals',
  {
    ...syncColumns,
    /** 'steps' | 'sleep_minutes' | 'water_ml' | 'kcal' | 'protein_g' | 'weight_kg'
     *  | 'caffeine_mg_max' | 'alcohol_units_max' | 'workouts_per_week' | ... */
    metricKey: text('metric_key').notNull(),
    targetValue: real('target_value').notNull(),
    /** at_least | at_most | target_band */
    direction: text('direction').notNull(),
    bandLowPct: real('band_low_pct'),
    bandHighPct: real('band_high_pct'),
    activeFrom: text('active_from').notNull(),
    activeTo: text('active_to'),
  },
  (t) => [index('idx_goal_metric').on(t.metricKey)],
);

/**
 * Targets de nutrientes (RDA + límite superior), seedeados.
 * `nutrientKey` coincide con el nombre de columna en `foods` (ej. 'iron_mg').
 */
export const nutrientTargets = sqliteTable(
  'nutrient_targets',
  {
    ...syncColumns,
    nutrientKey: text('nutrient_key').notNull(),
    rdaAmount: real('rda_amount').notNull(),
    upperLimit: real('upper_limit'),
    unit: text('unit').notNull(),
    /** Nombre visible en español ("Hierro", "Vitamina D") */
    displayName: text('display_name').notNull(),
  },
  (t) => [uniqueIndex('uq_nutrient_key').on(t.nutrientKey)],
);
