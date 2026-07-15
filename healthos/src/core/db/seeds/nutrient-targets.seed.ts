import type { NutrientTargetSeed } from './types';

/**
 * RDA/AI por nutriente (adulto, defaults NIH; ajustables por el usuario en
 * Configuración → Objetivos). `nutrientKey` = columna snake_case de `foods`.
 */
export const nutrientTargetSeeds: NutrientTargetSeed[] = [
  { nutrientKey: 'fiber_g', displayName: 'Fibra', rdaAmount: 38, unit: 'g' },
  { nutrientKey: 'sodium_mg', displayName: 'Sodio', rdaAmount: 1500, upperLimit: 2300, unit: 'mg' },
  { nutrientKey: 'potassium_mg', displayName: 'Potasio', rdaAmount: 3400, unit: 'mg' },
  { nutrientKey: 'calcium_mg', displayName: 'Calcio', rdaAmount: 1000, upperLimit: 2500, unit: 'mg' },
  { nutrientKey: 'iron_mg', displayName: 'Hierro', rdaAmount: 8, upperLimit: 45, unit: 'mg' },
  { nutrientKey: 'magnesium_mg', displayName: 'Magnesio', rdaAmount: 420, unit: 'mg' },
  { nutrientKey: 'zinc_mg', displayName: 'Zinc', rdaAmount: 11, upperLimit: 40, unit: 'mg' },
  { nutrientKey: 'phosphorus_mg', displayName: 'Fósforo', rdaAmount: 700, upperLimit: 4000, unit: 'mg' },
  { nutrientKey: 'selenium_ug', displayName: 'Selenio', rdaAmount: 55, upperLimit: 400, unit: 'µg' },
  { nutrientKey: 'copper_mg', displayName: 'Cobre', rdaAmount: 0.9, upperLimit: 10, unit: 'mg' },
  { nutrientKey: 'manganese_mg', displayName: 'Manganeso', rdaAmount: 2.3, upperLimit: 11, unit: 'mg' },
  { nutrientKey: 'iodine_ug', displayName: 'Yodo', rdaAmount: 150, upperLimit: 1100, unit: 'µg' },
  { nutrientKey: 'vitamin_a_ug', displayName: 'Vitamina A', rdaAmount: 900, upperLimit: 3000, unit: 'µg' },
  { nutrientKey: 'vitamin_b1_mg', displayName: 'Vitamina B1 (tiamina)', rdaAmount: 1.2, unit: 'mg' },
  { nutrientKey: 'vitamin_b2_mg', displayName: 'Vitamina B2 (riboflavina)', rdaAmount: 1.3, unit: 'mg' },
  { nutrientKey: 'vitamin_b3_mg', displayName: 'Vitamina B3 (niacina)', rdaAmount: 16, upperLimit: 35, unit: 'mg' },
  { nutrientKey: 'vitamin_b5_mg', displayName: 'Vitamina B5 (ác. pantoténico)', rdaAmount: 5, unit: 'mg' },
  { nutrientKey: 'vitamin_b6_mg', displayName: 'Vitamina B6', rdaAmount: 1.3, upperLimit: 100, unit: 'mg' },
  { nutrientKey: 'vitamin_b7_ug', displayName: 'Vitamina B7 (biotina)', rdaAmount: 30, unit: 'µg' },
  { nutrientKey: 'vitamin_b9_ug', displayName: 'Vitamina B9 (folato)', rdaAmount: 400, upperLimit: 1000, unit: 'µg' },
  { nutrientKey: 'vitamin_b12_ug', displayName: 'Vitamina B12', rdaAmount: 2.4, unit: 'µg' },
  { nutrientKey: 'vitamin_c_mg', displayName: 'Vitamina C', rdaAmount: 90, upperLimit: 2000, unit: 'mg' },
  { nutrientKey: 'vitamin_d_ug', displayName: 'Vitamina D', rdaAmount: 15, upperLimit: 100, unit: 'µg' },
  { nutrientKey: 'vitamin_e_mg', displayName: 'Vitamina E', rdaAmount: 15, upperLimit: 1000, unit: 'mg' },
  { nutrientKey: 'vitamin_k_ug', displayName: 'Vitamina K', rdaAmount: 120, unit: 'µg' },
  { nutrientKey: 'choline_mg', displayName: 'Colina', rdaAmount: 550, upperLimit: 3500, unit: 'mg' },
];
