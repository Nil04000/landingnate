import type { foods } from '@/core/db/schema';

export type Food = typeof foods.$inferSelect;

/**
 * Matemática nutricional pura (sin DB, 100% testeable).
 * Convención central: TODO alimento guarda nutrientes por 100 g (o 100 ml);
 * los totales de comida/día se computan en lectura (ADR-0004).
 */

/** Claves numéricas de nutrientes en `foods` (camelCase). */
export const NUTRIENT_KEYS = [
  'kcal',
  'proteinG',
  'carbsG',
  'fatG',
  'fiberG',
  'sugarG',
  'saturatedFatG',
  'monounsatFatG',
  'polyunsatFatG',
  'transFatG',
  'cholesterolMg',
  'sodiumMg',
  'potassiumMg',
  'calciumMg',
  'ironMg',
  'magnesiumMg',
  'zincMg',
  'phosphorusMg',
  'seleniumUg',
  'copperMg',
  'manganeseMg',
  'iodineUg',
  'vitaminAUg',
  'vitaminB1Mg',
  'vitaminB2Mg',
  'vitaminB3Mg',
  'vitaminB5Mg',
  'vitaminB6Mg',
  'vitaminB7Ug',
  'vitaminB9Ug',
  'vitaminB12Ug',
  'vitaminCMg',
  'vitaminDUg',
  'vitaminEMg',
  'vitaminKUg',
  'cholineMg',
  'caffeineMg',
  'alcoholG',
  'waterG',
] as const;

export type NutrientKey = (typeof NUTRIENT_KEYS)[number];

/** Totales de nutrientes (todas las claves presentes, 0 si no aportó nada). */
export type NutrientTotals = Record<NutrientKey, number>;

export function emptyTotals(): NutrientTotals {
  return Object.fromEntries(NUTRIENT_KEYS.map((k) => [k, 0])) as NutrientTotals;
}

/** Nutrientes de `grams` gramos de un alimento (escala lineal por-100g). */
export function scaleFood(food: Food, grams: number): NutrientTotals {
  const factor = grams / 100;
  const out = emptyTotals();
  for (const key of NUTRIENT_KEYS) {
    const per100 = food[key];
    if (per100 != null) out[key] = per100 * factor;
  }
  return out;
}

/** Suma de totales (comida = Σ items; día = Σ comidas). */
export function sumTotals(list: NutrientTotals[]): NutrientTotals {
  const out = emptyTotals();
  for (const totals of list) {
    for (const key of NUTRIENT_KEYS) out[key] += totals[key];
  }
  return out;
}

/** camelCase → snake_case ('vitaminDUg' → 'vitamin_d_ug') para nutrient_targets. */
export function nutrientKeyToSnake(key: NutrientKey): string {
  return key.replace(/([A-Z])/g, '_$1').toLowerCase();
}

export type NutrientTarget = { nutrientKey: string; rdaAmount: number };

export type CoverageItem = {
  /** snake_case, matchea nutrient_targets */
  nutrientKey: string;
  intake: number;
  rda: number;
  /** 0..1 (clampeado) */
  coverage: number;
};

/**
 * Cobertura de micronutrientes del día vs RDA.
 * `supplementExtras`: aportes de suplementos con linked_nutrient_key
 * (clave snake_case → cantidad en la unidad del target).
 * Devuelve items ordenados por menor cobertura (los déficits primero).
 */
export function microCoverage(
  dayTotals: NutrientTotals,
  targets: NutrientTarget[],
  supplementExtras: Record<string, number> = {},
): { items: CoverageItem[]; averagePct: number | null } {
  const bySnake = new Map<string, number>();
  for (const key of NUTRIENT_KEYS) bySnake.set(nutrientKeyToSnake(key), dayTotals[key]);

  const items: CoverageItem[] = [];
  for (const target of targets) {
    if (target.rdaAmount <= 0) continue;
    const fromFood = bySnake.get(target.nutrientKey) ?? 0;
    const fromSupplements = supplementExtras[target.nutrientKey] ?? 0;
    const intake = fromFood + fromSupplements;
    items.push({
      nutrientKey: target.nutrientKey,
      intake,
      rda: target.rdaAmount,
      coverage: Math.min(1, intake / target.rdaAmount),
    });
  }

  items.sort((a, b) => a.coverage - b.coverage);
  const averagePct = items.length
    ? (items.reduce((s, i) => s + i.coverage, 0) / items.length) * 100
    : null;

  return { items, averagePct };
}
