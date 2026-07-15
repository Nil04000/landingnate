import { describe, expect, it } from 'vitest';

import { dailyAggregates } from '@/core/db/schema';
import { InsightsRepository } from '@/core/db/repositories/insights.repository';
import type { AppSqliteDb } from '@/core/db/types';
import { daysAgoLocal, weekdayOf } from '@/core/lib/dates';
import { buildCatalog } from '@/features/insights/engine/rules';
import { runInsights } from '@/features/insights/engine/run';

import { createTestDb } from './helpers/test-db';

/** Inserta un día sintético en daily_aggregates. */
function seedDay(db: AppSqliteDb, dayDate: string, values: Record<string, number | null>) {
  db.insert(dailyAggregates)
    .values({ dayDate, isStale: 0, computedAt: 1, loggedModules: 3, ...values })
    .run();
}

/** Jitter determinístico para que Welch/Pearson no vean varianza cero. */
const jitter = (i: number, amplitude: number) => ((i % 5) - 2) * amplitude;

describe('catálogo', () => {
  it('tiene cientos de chequeos y las reglas curadas del spec', () => {
    const catalog = buildCatalog();
    expect(catalog.length).toBeGreaterThanOrEqual(220);
    const ids = catalog.map((r) => r.id);
    expect(ids).toContain('thr.caffeine_mg>450->sleep_minutes.lag0'); // "dormís peor con >450mg"
    expect(ids).toContain('weekday.steps.1'); // "los lunes caminás menos"
    expect(ids).toContain('weekday.water_ml.weekend'); // "hidratación los findes"
    expect(ids).toContain('trend.protein_g'); // "tu proteína promedio bajó"
    // ids únicos
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('runInsights — patrones sintéticos', () => {
  it('detecta que dormís peor los días con >450 mg de cafeína', () => {
    const db = createTestDb();
    for (let i = 40; i >= 1; i--) {
      const day = daysAgoLocal(i);
      const highCaffeine = i % 4 === 0; // 10 de 40 días
      seedDay(db, day, {
        caffeineMg: highCaffeine ? 520 + jitter(i, 8) : 120 + jitter(i, 8),
        sleepMinutes: highCaffeine ? 355 + jitter(i, 6) : 455 + jitter(i, 6),
      });
    }

    const result = runInsights(db);
    expect(result.findings).toBeGreaterThan(0);

    const repo = new InsightsRepository(db);
    const active = repo.listActive();
    const caffeineFinding = active.find((f) => f.ruleId === 'thr.caffeine_mg>450->sleep_minutes.lag0');
    expect(caffeineFinding, 'la regla curada del spec debe disparar').toBeDefined();
    expect(caffeineFinding!.severity).toBe('warning'); // dormir menos = adverso
    const metrics = JSON.parse(caffeineFinding!.metricsJson) as { meanA: number; meanB: number };
    expect(metrics.meanA).toBeLessThan(metrics.meanB);
    expect(caffeineFinding!.body).toContain('n=');
  });

  it('detecta el efecto "los lunes caminás menos"', () => {
    const db = createTestDb();
    for (let i = 84; i >= 1; i--) {
      const day = daysAgoLocal(i);
      const isMonday = weekdayOf(day) === 1;
      seedDay(db, day, { steps: isMonday ? 6200 + jitter(i, 40) : 10100 + jitter(i, 40) });
    }

    runInsights(db);
    const active = new InsightsRepository(db).listActive(100);
    const monday = active.find((f) => f.ruleId === 'weekday.steps.1');
    expect(monday).toBeDefined();
    expect(monday!.title).toContain('lunes');
    expect(monday!.title).toContain('menos');
  });

  it('detecta tendencia: la proteína promedio bajó', () => {
    const db = createTestDb();
    for (let i = 35; i >= 1; i--) {
      const day = daysAgoLocal(i);
      seedDay(db, day, { proteinG: i <= 7 ? 115 + jitter(i, 2) : 165 + jitter(i, 2) });
    }

    runInsights(db);
    const active = new InsightsRepository(db).listActive(100);
    const trend = active.find((f) => f.ruleId === 'trend.protein_g');
    expect(trend).toBeDefined();
    expect(trend!.title).toContain('bajó');
    expect(trend!.severity).toBe('warning'); // menos proteína = adverso
  });

  it('detecta récords y rachas', () => {
    const db = createTestDb();
    for (let i = 30; i >= 0; i--) {
      const day = daysAgoLocal(i);
      seedDay(db, day, {
        steps: i === 0 ? 16000 : 9000 + jitter(i, 300),
        waterMl: i <= 5 ? 2400 : 1200,
      });
    }

    runInsights(db);
    const active = new InsightsRepository(db).listActive(100);
    expect(active.find((f) => f.ruleId === 'record.steps.max')).toBeDefined();
    const streak = active.find((f) => f.ruleId === 'streak.water');
    expect(streak).toBeDefined();
    expect((JSON.parse(streak!.metricsJson) as { length: number }).length).toBe(6);
  });

  it('sin datos suficientes no inventa nada', () => {
    const db = createTestDb();
    for (let i = 5; i >= 1; i--) {
      seedDay(db, daysAgoLocal(i), { steps: 9000, sleepMinutes: 450 });
    }
    const result = runInsights(db);
    expect(result.findings).toBe(0);
  });
});

describe('dedupe y descartes', () => {
  function seedCaffeinePattern(db: AppSqliteDb) {
    for (let i = 40; i >= 1; i--) {
      const day = daysAgoLocal(i);
      const high = i % 4 === 0;
      seedDay(db, day, {
        caffeineMg: high ? 520 + jitter(i, 8) : 120 + jitter(i, 8),
        sleepMinutes: high ? 355 + jitter(i, 6) : 455 + jitter(i, 6),
      });
    }
  }

  it('correr dos veces en la misma semana no duplica', () => {
    const db = createTestDb();
    seedCaffeinePattern(db);
    const first = runInsights(db);
    expect(first.inserted).toBeGreaterThan(0);
    const countAfterFirst = new InsightsRepository(db).listVisible(500).length;

    const second = runInsights(db);
    expect(second.inserted).toBe(0);
    expect(second.updated).toBe(second.findings);
    expect(new InsightsRepository(db).listVisible(500).length).toBe(countAfterFirst);
  });

  it('un hallazgo descartado no reaparece con el mismo efecto', () => {
    const db = createTestDb();
    seedCaffeinePattern(db);
    runInsights(db);

    const repo = new InsightsRepository(db);
    const finding = repo.listActive(100).find((f) => f.ruleId.startsWith('thr.caffeine_mg>450'))!;
    repo.dismiss(finding.id);

    const rerun = runInsights(db);
    expect(rerun.skipped).toBeGreaterThan(0);
    const after = repo.listVisible(500).find((f) => f.id === finding.id);
    expect(after).toBeUndefined(); // sigue descartado
  });
});
