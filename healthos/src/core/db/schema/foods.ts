import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { syncColumns } from './_base';

/**
 * Biblioteca de alimentos. TODOS los nutrientes son por 100 g
 * (o por 100 ml cuando `isLiquid = 1`).
 *
 * Los totales por comida/día se computan EN LECTURA (`nutrition-math.ts`):
 * editar un alimento recalcula la historia (comportamiento Cronometer,
 * ADR-0004). No hay columnas snapshot.
 */
export const foods = sqliteTable(
  'foods',
  {
    ...syncColumns,
    name: text('name').notNull(),
    brand: text('brand'),
    barcode: text('barcode'),
    /** seed | user (futuro: off | usda) */
    source: text('source').notNull().default('user'),
    isLiquid: integer('is_liquid').notNull().default(0),

    // ── Energía y macros ─────────────────────────────────────────
    kcal: real('kcal').notNull().default(0),
    proteinG: real('protein_g').notNull().default(0),
    carbsG: real('carbs_g').notNull().default(0),
    fatG: real('fat_g').notNull().default(0),
    fiberG: real('fiber_g').default(0),
    sugarG: real('sugar_g').default(0),
    saturatedFatG: real('saturated_fat_g').default(0),
    monounsatFatG: real('monounsat_fat_g'),
    polyunsatFatG: real('polyunsat_fat_g'),
    transFatG: real('trans_fat_g'),
    cholesterolMg: real('cholesterol_mg'),

    // ── Minerales ────────────────────────────────────────────────
    sodiumMg: real('sodium_mg'),
    potassiumMg: real('potassium_mg'),
    calciumMg: real('calcium_mg'),
    ironMg: real('iron_mg'),
    magnesiumMg: real('magnesium_mg'),
    zincMg: real('zinc_mg'),
    phosphorusMg: real('phosphorus_mg'),
    seleniumUg: real('selenium_ug'),
    copperMg: real('copper_mg'),
    manganeseMg: real('manganese_mg'),
    iodineUg: real('iodine_ug'),

    // ── Vitaminas ────────────────────────────────────────────────
    /** Retinol Activity Equivalents */
    vitaminAUg: real('vitamin_a_ug'),
    vitaminB1Mg: real('vitamin_b1_mg'),
    vitaminB2Mg: real('vitamin_b2_mg'),
    vitaminB3Mg: real('vitamin_b3_mg'),
    vitaminB5Mg: real('vitamin_b5_mg'),
    vitaminB6Mg: real('vitamin_b6_mg'),
    vitaminB7Ug: real('vitamin_b7_ug'),
    vitaminB9Ug: real('vitamin_b9_ug'),
    vitaminB12Ug: real('vitamin_b12_ug'),
    vitaminCMg: real('vitamin_c_mg'),
    vitaminDUg: real('vitamin_d_ug'),
    vitaminEMg: real('vitamin_e_mg'),
    vitaminKUg: real('vitamin_k_ug'),
    cholineMg: real('choline_mg'),

    // ── Otros ────────────────────────────────────────────────────
    caffeineMg: real('caffeine_mg'),
    alcoholG: real('alcohol_g'),
    waterG: real('water_g'),
  },
  (t) => [index('idx_food_name').on(t.name), index('idx_food_barcode').on(t.barcode)],
);

/** Porciones con nombre ("1 huevo", "1 scoop") mapeadas a gramos. */
export const foodPortions = sqliteTable(
  'food_portions',
  {
    ...syncColumns,
    foodId: text('food_id')
      .notNull()
      .references(() => foods.id),
    name: text('name').notNull(),
    grams: real('grams').notNull(),
  },
  (t) => [index('idx_portion_food').on(t.foodId)],
);
