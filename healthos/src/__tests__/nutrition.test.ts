import { describe, expect, it } from 'vitest';

import { DailyAggregatesRepository } from '@/core/db/repositories/aggregates.repository';
import { CompoundsRepository } from '@/core/db/repositories/compounds.repository';
import { FoodsRepository } from '@/core/db/repositories/foods.repository';
import { MealsRepository } from '@/core/db/repositories/meals.repository';
import { SubstancesRepository } from '@/core/db/repositories/substances.repository';
import { runSeeds } from '@/core/db/seeds/run';
import {
  emptyTotals,
  microCoverage,
  nutrientKeyToSnake,
  scaleFood,
  sumTotals,
} from '@/core/lib/nutrition-math';

import { createTestDb } from './helpers/test-db';

const DAY = '2026-07-15';

describe('nutrition-math', () => {
  it('scaleFood escala linealmente por 100 g', () => {
    const foods = new FoodsRepository(createTestDb());
    const egg = foods.create({
      name: 'Huevo test',
      kcal: 155,
      proteinG: 13,
      carbsG: 1.1,
      fatG: 11,
      seleniumUg: 30.8,
      vitaminDUg: 2.2,
    });
    const scaled = scaleFood(egg, 50); // 1 huevo
    expect(scaled.kcal).toBeCloseTo(77.5);
    expect(scaled.proteinG).toBeCloseTo(6.5);
    expect(scaled.seleniumUg).toBeCloseTo(15.4);
    // nutriente no cargado = 0, no NaN
    expect(scaled.ironMg).toBe(0);
  });

  it('sumTotals suma items en totales de comida', () => {
    const a = { ...emptyTotals(), kcal: 100, proteinG: 10 };
    const b = { ...emptyTotals(), kcal: 250, proteinG: 5, fatG: 20 };
    const total = sumTotals([a, b]);
    expect(total.kcal).toBe(350);
    expect(total.proteinG).toBe(15);
    expect(total.fatG).toBe(20);
  });

  it('nutrientKeyToSnake matchea las claves de nutrient_targets', () => {
    expect(nutrientKeyToSnake('vitaminDUg')).toBe('vitamin_d_ug');
    expect(nutrientKeyToSnake('ironMg')).toBe('iron_mg');
    expect(nutrientKeyToSnake('vitaminB12Ug')).toBe('vitamin_b12_ug');
  });

  it('microCoverage clampa a 100%, ordena déficits primero y suma suplementos', () => {
    const totals = { ...emptyTotals(), ironMg: 4, vitaminDUg: 30 };
    const targets = [
      { nutrientKey: 'iron_mg', rdaAmount: 8 },
      { nutrientKey: 'vitamin_d_ug', rdaAmount: 15 },
      { nutrientKey: 'zinc_mg', rdaAmount: 11 },
    ];
    const { items, averagePct } = microCoverage(totals, targets, { zinc_mg: 11 });
    expect(items[0]!.nutrientKey).toBe('iron_mg'); // 50% — el peor primero
    expect(items[0]!.coverage).toBeCloseTo(0.5);
    expect(items.find((i) => i.nutrientKey === 'vitamin_d_ug')!.coverage).toBe(1); // 200% → clamp
    expect(items.find((i) => i.nutrientKey === 'zinc_mg')!.coverage).toBe(1); // vía suplemento
    expect(averagePct).toBeCloseTo(((0.5 + 1 + 1) / 3) * 100);
  });
});

describe('MealsRepository', () => {
  it('comida con items calcula totales en lectura; editar el alimento recalcula', () => {
    const db = createTestDb();
    const foods = new FoodsRepository(db);
    const meals = new MealsRepository(db);

    const rice = foods.create({ name: 'Arroz test', kcal: 130, proteinG: 2.7, carbsG: 28, fatG: 0.3 });
    const chicken = foods.create({ name: 'Pollo test', kcal: 165, proteinG: 31, carbsG: 0, fatG: 3.6 });

    const meal = meals.create({ dayDate: DAY, slot: 'lunch' });
    meals.addItem(meal.id, rice.id, 200);
    meals.addItem(meal.id, chicken.id, 150);

    const withItems = meals.getWithItems(meal.id)!;
    expect(withItems.totals.kcal).toBeCloseTo(130 * 2 + 165 * 1.5);
    expect(withItems.totals.proteinG).toBeCloseTo(2.7 * 2 + 31 * 1.5);

    // ADR-0004: corregir el alimento recalcula la historia
    foods.update(chicken.id, { proteinG: 25 });
    expect(meals.getWithItems(meal.id)!.totals.proteinG).toBeCloseTo(2.7 * 2 + 25 * 1.5);
  });

  it('templates: guardar y aplicar reproduce los items', () => {
    const db = createTestDb();
    const foods = new FoodsRepository(db);
    const meals = new MealsRepository(db);

    const oats = foods.create({ name: 'Avena test', kcal: 389, proteinG: 16.9, carbsG: 66, fatG: 6.9 });
    const meal = meals.create({ dayDate: DAY, slot: 'breakfast' });
    meals.addItem(meal.id, oats.id, 80);
    meals.saveAsTemplate(meal.id, 'Desayuno estándar');

    const applied = meals.applyTemplate(meals.listTemplates()[0]!.id, '2026-07-16', 'breakfast');
    const items = meals.listItems(applied.id);
    expect(items).toHaveLength(1);
    expect(items[0]!.grams).toBe(80);
    expect(items[0]!.food.name).toBe('Avena test');
  });

  it('la búsqueda encuentra seeds por nombre con prefijo primero', () => {
    const db = createTestDb();
    runSeeds(db);
    const foods = new FoodsRepository(db);
    const results = foods.search('poll');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]!.name.toLowerCase()).toContain('poll');
  });
});

describe('agregados nutricionales', () => {
  it('rebuildDay integra comidas, kcal de sustancias y cobertura de micros', () => {
    const db = createTestDb();
    runSeeds(db);
    const foods = new FoodsRepository(db);
    const meals = new MealsRepository(db);
    const substances = new SubstancesRepository(db);
    const compounds = new CompoundsRepository(db);
    const aggregates = new DailyAggregatesRepository(db);

    // Sin comidas: nutrición null aunque haya kcal de sustancias
    substances.log({ dayDate: DAY, consumedAt: 1, type: 'energy_drink', caffeineMg: 160, kcal: 10 });
    expect(aggregates.rebuildDay(DAY).kcal).toBeNull();

    // Comida: 200 g de un alimento conocido
    const food = foods.create({
      name: 'Bowl test',
      kcal: 200,
      proteinG: 20,
      carbsG: 10,
      fatG: 8,
      fiberG: 5,
      sodiumMg: 300,
      ironMg: 4,
    });
    const meal = meals.create({ dayDate: DAY, slot: 'lunch' });
    meals.addItem(meal.id, food.id, 200);

    // Suplemento linkeado a vitamina D
    const vitD = compounds.createDefinition({
      kind: 'supplement',
      name: 'D3',
      linkedNutrientKey: 'vitamin_d_ug',
    });
    compounds.logIntake({ compoundId: vitD.id, dayDate: DAY, takenAt: 2, doseAmount: 15, doseUnit: 'µg' });

    const agg = aggregates.rebuildDay(DAY);
    expect(agg.mealCount).toBe(1);
    expect(agg.kcal).toBeCloseTo(400 + 10); // comida + energética
    expect(agg.proteinG).toBeCloseTo(40);
    expect(agg.fiberG).toBeCloseTo(10);
    expect(agg.sodiumMg).toBeCloseTo(600);
    expect(agg.caffeineMg).toBe(160);
    expect(agg.microCoveragePct).not.toBeNull();
    expect(agg.microCoveragePct!).toBeGreaterThan(0);
    expect(agg.microCoveragePct!).toBeLessThanOrEqual(100);
  });
});
