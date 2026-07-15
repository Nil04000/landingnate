import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { syncColumns } from './_base';

/** Paneles: cbc, lipids, metabolic, liver, hormones, thyroid, vitamins, inflammation, custom. */
export const labPanels = sqliteTable('lab_panels', {
  ...syncColumns,
  code: text('code').notNull(),
  name: text('name').notNull(),
  sortIndex: integer('sort_index').notNull().default(0),
});

/**
 * Marcadores del catálogo (seedeado + custom del usuario).
 * `unit` es la unidad canónica del marcador; los resultados se convierten
 * a esta unidad en lectura.
 */
export const labMarkers = sqliteTable('lab_markers', {
  ...syncColumns,
  panelId: text('panel_id').references(() => labPanels.id),
  /** 'hgb', 'ldl', 'glucose', 'hba1c', 'testosterone_total', 'tsh', ... */
  code: text('code').notNull(),
  name: text('name').notNull(),
  unit: text('unit').notNull(),
  description: text('description'),
  /** null = óptimo dentro de banda; 1 = menos es mejor; 0 = más es mejor */
  higherIsWorse: integer('higher_is_worse'),
});

/** Rangos de referencia (banda del laboratorio) + banda óptima, por sexo/edad. */
export const labReferenceRanges = sqliteTable(
  'lab_reference_ranges',
  {
    ...syncColumns,
    markerId: text('marker_id')
      .notNull()
      .references(() => labMarkers.id),
    low: real('low'),
    high: real('high'),
    optimalLow: real('optimal_low'),
    optimalHigh: real('optimal_high'),
    /** male | female | null (ambos) */
    sex: text('sex'),
    ageMin: integer('age_min'),
    ageMax: integer('age_max'),
    /** "seed" | "mi laboratorio" */
    sourceLabel: text('source_label'),
  },
  (t) => [index('idx_range_marker').on(t.markerId)],
);

/** Una extracción / visita al laboratorio. */
export const labReports = sqliteTable('lab_reports', {
  ...syncColumns,
  collectedAt: integer('collected_at').notNull(),
  labName: text('lab_name'),
  fasting: integer('fasting'),
  notes: text('notes'),
});

export const labResults = sqliteTable(
  'lab_results',
  {
    ...syncColumns,
    reportId: text('report_id')
      .notNull()
      .references(() => labReports.id),
    markerId: text('marker_id')
      .notNull()
      .references(() => labMarkers.id),
    value: real('value').notNull(),
    /** Unidad tal como se ingresó */
    unit: text('unit').notNull(),
    /** Computado al escribir: low | high | in_range | optimal */
    flag: text('flag'),
  },
  (t) => [index('idx_result_marker').on(t.markerId), index('idx_result_report').on(t.reportId)],
);
