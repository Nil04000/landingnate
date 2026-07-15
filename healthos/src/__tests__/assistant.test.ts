import { describe, expect, it } from 'vitest';

import { dailyAggregates } from '@/core/db/schema';
import { FoodsRepository } from '@/core/db/repositories/foods.repository';
import { MealsRepository } from '@/core/db/repositories/meals.repository';
import type { AppSqliteDb } from '@/core/db/types';
import { daysAgoLocal } from '@/core/lib/dates';
import { runSeeds } from '@/core/db/seeds/run';
import { LocalAssistantProvider } from '@/features/assistant/engine/provider';
import { getBiggestChanges, getMetricSummary, getNutrientDeficits } from '@/features/assistant/engine/tools';

import { createTestDb } from './helpers/test-db';

function seedDay(db: AppSqliteDb, dayDate: string, values: Record<string, number | null>) {
  db.insert(dailyAggregates)
    .values({ dayDate, isStale: 0, computedAt: 1, loggedModules: 3, ...values })
    .run();
}

const jitter = (i: number, amplitude: number) => ((i % 5) - 2) * amplitude;

describe('herramientas del asistente', () => {
  it('getMetricSummary compara ventana actual vs anterior', () => {
    const db = createTestDb();
    // ventana actual = últimos 14 días INCLUYENDO hoy (hoy sin dato)
    for (let i = 28; i >= 1; i--) {
      seedDay(db, daysAgoLocal(i), { waterMl: i <= 13 ? 2500 : 1500 });
    }
    const s = getMetricSummary(db, 'water_ml', 14);
    expect(s.mean).toBe(2500);
    expect(s.prevMean).toBe(1500);
    expect(s.trendPct).toBeCloseTo(66.7, 0);
  });

  it('getBiggestChanges encuentra el cambio plantado', () => {
    const db = createTestDb();
    for (let i = 35; i >= 1; i--) {
      seedDay(db, daysAgoLocal(i), {
        proteinG: i <= 7 ? 110 + jitter(i, 2) : 170 + jitter(i, 2),
        steps: 9000 + jitter(i, 100),
      });
    }
    const changes = getBiggestChanges(db);
    const protein = changes.find((c) => c.metric === 'protein_g');
    expect(protein).toBeDefined();
    expect(protein!.relChange).toBeLessThan(-0.2);
  });

  it('getNutrientDeficits ordena por menor cobertura', () => {
    const db = createTestDb();
    runSeeds(db);
    const foods = new FoodsRepository(db);
    const meals = new MealsRepository(db);
    // Comida alta en vitamina C, sin hierro → hierro debe aparecer como déficit
    const food = foods.create({ name: 'Test C', kcal: 100, proteinG: 5, carbsG: 10, fatG: 2, vitaminCMg: 200 });
    for (let i = 3; i >= 1; i--) {
      const meal = meals.create({ dayDate: daysAgoLocal(i), slot: 'lunch' });
      meals.addItem(meal.id, food.id, 200);
    }
    const deficits = getNutrientDeficits(db, 7, 10);
    expect(deficits.length).toBeGreaterThan(0);
    expect(deficits[0]!.coveragePct).toBeLessThan(20);
    const vitC = deficits.find((d) => d.nutrientKey === 'vitamin_c_mg');
    expect(vitC).toBeUndefined(); // cubierta al 100% → no está entre los déficits
  });
});

describe('LocalAssistantProvider', () => {
  it('responde "qué cambió" con los cambios reales', () => {
    const db = createTestDb();
    for (let i = 35; i >= 1; i--) {
      seedDay(db, daysAgoLocal(i), { proteinG: i <= 7 ? 110 + jitter(i, 2) : 170 + jitter(i, 2) });
    }
    const answer = new LocalAssistantProvider(db).answer('¿Qué cambió este mes?');
    expect(answer.text.toLowerCase()).toContain('proteína');
    expect(answer.text).toMatch(/bajó/);
  });

  it('responde sobre sueño citando al sospechoso correlacionado', () => {
    const db = createTestDb();
    for (let i = 40; i >= 1; i--) {
      const high = i % 3 === 0;
      seedDay(db, daysAgoLocal(i), {
        caffeineMg: high ? 500 + jitter(i, 10) : 100 + jitter(i, 10),
        sleepMinutes: high ? 360 + jitter(i, 8) : 460 + jitter(i, 8),
      });
    }
    const answer = new LocalAssistantProvider(db).answer('¿Por qué estoy durmiendo peor?');
    expect(answer.text).toContain('sueño');
    expect(answer.text).toContain('cafeína');
    expect(answer.text).toContain('r=');
  });

  it('sin datos responde honesto, sin inventar', () => {
    const db = createTestDb();
    const answer = new LocalAssistantProvider(db).answer('¿Por qué duermo peor?');
    expect(answer.text).toContain('suficientes');
  });

  it('pregunta libre cae al fallback con sugerencias', () => {
    const db = createTestDb();
    const answer = new LocalAssistantProvider(db).answer('hola qué tal');
    expect(answer.text).toContain('Probá preguntarme');
  });
});
