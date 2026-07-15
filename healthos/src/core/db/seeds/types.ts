/**
 * Tipos de datos de seed. Los archivos *.seed.ts son SOLO datos declarativos;
 * `run.ts` los mapea a inserts idempotentes (ids determinísticos + ON CONFLICT
 * DO NOTHING, isDirty=0 — el catálogo no se pushea al sync futuro).
 */

/** Alimento por 100 g (o 100 ml si isLiquid). Claves = columnas camelCase de `foods`. */
export type FoodSeed = {
  /** slug estable, ej. 'pechuga-pollo' → id 'seed-food-pechuga-pollo' */
  slug: string;
  name: string;
  brand?: string;
  isLiquid?: boolean;
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG?: number;
  sugarG?: number;
  saturatedFatG?: number;
  monounsatFatG?: number;
  polyunsatFatG?: number;
  transFatG?: number;
  cholesterolMg?: number;
  sodiumMg?: number;
  potassiumMg?: number;
  calciumMg?: number;
  ironMg?: number;
  magnesiumMg?: number;
  zincMg?: number;
  phosphorusMg?: number;
  seleniumUg?: number;
  copperMg?: number;
  manganeseMg?: number;
  iodineUg?: number;
  vitaminAUg?: number;
  vitaminB1Mg?: number;
  vitaminB2Mg?: number;
  vitaminB3Mg?: number;
  vitaminB5Mg?: number;
  vitaminB6Mg?: number;
  vitaminB7Ug?: number;
  vitaminB9Ug?: number;
  vitaminB12Ug?: number;
  vitaminCMg?: number;
  vitaminDUg?: number;
  vitaminEMg?: number;
  vitaminKUg?: number;
  cholineMg?: number;
  caffeineMg?: number;
  alcoholG?: number;
  waterG?: number;
  /** Porciones con nombre en español: [nombre, gramos] */
  portions?: [string, number][];
};

export type ExerciseSeed = {
  /** slug estable → id 'seed-ex-<slug>' */
  slug: string;
  name: string;
  muscleGroup:
    | 'chest'
    | 'back'
    | 'legs'
    | 'shoulders'
    | 'arms'
    | 'core'
    | 'full_body'
    | 'cardio';
  equipment: 'barbell' | 'dumbbell' | 'machine' | 'cable' | 'bodyweight' | 'band' | 'other';
};

export type NutrientTargetSeed = {
  /** = nombre de columna snake_case en foods, ej. 'vitamin_d_ug' */
  nutrientKey: string;
  displayName: string;
  rdaAmount: number;
  upperLimit?: number;
  unit: string;
};

export type LabMarkerSeed = {
  /** código estable ('glucose', 'tsh', ...) → id 'seed-marker-<code>' */
  code: string;
  name: string;
  unit: string;
  description?: string;
  /** 1 = menos es mejor, 0 = más es mejor, undefined = banda */
  higherIsWorse?: 0 | 1;
  ranges: {
    low?: number;
    high?: number;
    optimalLow?: number;
    optimalHigh?: number;
    sex?: 'male' | 'female';
  }[];
};

export type LabPanelSeed = {
  /** código estable → id 'seed-panel-<code>' */
  code: string;
  name: string;
  markers: LabMarkerSeed[];
};
