import { describe, expect, it } from 'vitest';

import type { DailyAggregate } from '@/core/db/repositories/aggregates.repository';
import { HydrationRepository } from '@/core/db/repositories/hydration.repository';
import { ScoresRepository } from '@/core/db/repositories/scores.repository';
import { SleepRepository } from '@/core/db/repositories/sleep.repository';
import { computeAndStoreScore } from '@/features/health-score/engine/compute-day';
import { computeScore } from '@/features/health-score/engine/score-engine';
import { COMPONENT_WEIGHTS, defaultScoreGoals } from '@/features/health-score/engine/types';

import { createTestDb } from './helpers/test-db';

const DAY = '2026-07-15';

/** Agregado sintético con todos los campos null salvo lo pasado. */
function makeAgg(overrides: Partial<DailyAggregate>): DailyAggregate {
  return {
    dayDate: DAY,
    sleepMinutes: null,
    napMinutes: null,
    sleepQuality: null,
    bedtimeMinute: null,
    steps: null,
    activeKcal: null,
    workoutCount: 0,
    workoutMinutes: 0,
    strengthVolumeKg: 0,
    waterMl: null,
    caffeineMg: null,
    lastCaffeineHour: null,
    alcoholUnits: null,
    cigarettes: null,
    vapeSessions: null,
    kcal: null,
    proteinG: null,
    carbsG: null,
    fatG: null,
    fiberG: null,
    sugarG: null,
    saturatedFatG: null,
    sodiumMg: null,
    mealCount: 0,
    microCoveragePct: null,
    weightKg: null,
    bodyFatPct: null,
    mood: null,
    energy: null,
    stress: null,
    libido: null,
    soreness: null,
    supplementAdherencePct: null,
    loggedModules: 0,
    healthScore: null,
    isStale: 0,
    computedAt: null,
    ...overrides,
  };
}

const ctx = { goals: defaultScoreGoals, trailing: [] };

describe('computeScore — regla de datos faltantes', () => {
  it('día vacío → score null, nada disponible', () => {
    const breakdown = computeScore(makeAgg({}), ctx);
    expect(breakdown.score).toBeNull();
    expect(breakdown.availableWeight).toBe(0);
    expect(breakdown.components.every((c) => !c.available)).toBe(true);
  });

  it('solo agua (peso 0.08+0.12+0.04 < 0.45) → datos insuficientes', () => {
    const breakdown = computeScore(makeAgg({ waterMl: 2500, loggedModules: 1 }), ctx);
    // hidratación + sustancias (día con registro) + consistencia disponibles,
    // pero 0.24 < 0.45 → null
    expect(breakdown.score).toBeNull();
    expect(breakdown.availableWeight).toBeLessThan(0.45);
  });

  it('los pesos disponibles se renormalizan (suman 1 en effectiveWeight)', () => {
    const breakdown = computeScore(
      makeAgg({
        sleepMinutes: 480,
        steps: 10_000,
        waterMl: 2500,
        mood: 4,
        energy: 4,
        loggedModules: 4,
      }),
      ctx,
    );
    expect(breakdown.score).not.toBeNull();
    const totalEffective = breakdown.components
      .filter((c) => c.available)
      .reduce((s, c) => s + c.effectiveWeight, 0);
    expect(totalEffective).toBeCloseTo(1, 1);
    // componente no disponible no contribuye
    const nutrition = breakdown.components.find((c) => c.key === 'nutrition')!;
    expect(nutrition.available).toBe(false);
    expect(nutrition.contribution).toBe(0);
  });

  it('día perfecto → score alto con sustancias en 100 sin registros de consumo', () => {
    const breakdown = computeScore(
      makeAgg({
        sleepMinutes: 480,
        sleepQuality: 5,
        steps: 12_000,
        waterMl: 2600,
        kcal: 2400,
        proteinG: 160,
        fiberG: 40,
        mealCount: 3,
        microCoveragePct: 95,
        mood: 5,
        energy: 5,
        stress: 1,
        workoutCount: 1,
        workoutMinutes: 60,
        loggedModules: 6,
      }),
      ctx,
    );
    expect(breakdown.score).toBeGreaterThanOrEqual(95);
    const substances = breakdown.components.find((c) => c.key === 'substances')!;
    expect(substances.available).toBe(true);
    expect(substances.score).toBe(100);
  });
});

describe('computeScore — componentes', () => {
  it('sustancias: cafeína tarde y alcohol restan con razones explicables', () => {
    const breakdown = computeScore(
      makeAgg({
        sleepMinutes: 480,
        steps: 10_000,
        waterMl: 2500,
        caffeineMg: 500,
        lastCaffeineHour: 18.5,
        alcoholUnits: 2,
        mood: 3,
        energy: 3,
        loggedModules: 4,
      }),
      ctx,
    );
    const substances = breakdown.components.find((c) => c.key === 'substances')!;
    // 100 − 10 (cafeína 500>400) − 20 (18,5−16=2,5h·8) − 24 (2u·12) = 46
    expect(substances.score).toBe(46);
    const codes = substances.reasons.map((r) => r.code);
    expect(codes).toContain('caffeine_over');
    expect(codes).toContain('caffeine_late');
    expect(codes).toContain('alcohol');
    // los impacts explican exactamente la caída
    const totalImpact = substances.reasons.reduce((s, r) => s + r.impact, 0);
    expect(totalImpact).toBeCloseTo(46 - 100, 1);
  });

  it('sueño: siesta suma al 50% con cap y la calidad pondera 20%', () => {
    const withNap = computeScore(
      makeAgg({ sleepMinutes: 420, napMinutes: 90, loggedModules: 1, steps: 8000, waterMl: 2000, mood: 3 }),
      ctx,
    );
    const sleep = withNap.components.find((c) => c.key === 'sleep')!;
    // 420 + 0.5*min(90,60)=450 → dentro de [450, 525] → 100
    expect(sleep.score).toBe(100);

    const withQuality = computeScore(
      makeAgg({ sleepMinutes: 480, sleepQuality: 1, loggedModules: 1, steps: 8000, waterMl: 2000, mood: 3 }),
      ctx,
    );
    const sleepQ = withQuality.components.find((c) => c.key === 'sleep')!;
    // 0.8*100 + 0.2*0 = 80
    expect(sleepQ.score).toBe(80);
  });

  it('entrenamiento: hoy entrenado > descanso planificado > gap largo', () => {
    const trained = computeScore(
      makeAgg({ workoutCount: 1, workoutMinutes: 45, sleepMinutes: 480, steps: 9000, waterMl: 2000, loggedModules: 3 }),
      ctx,
    );
    expect(trained.components.find((c) => c.key === 'training')!.score).toBe(100);

    const trailing = [
      makeAgg({ dayDate: '2026-07-10', workoutCount: 1 }),
      makeAgg({ dayDate: '2026-07-11' }),
      makeAgg({ dayDate: '2026-07-12' }),
      makeAgg({ dayDate: '2026-07-13' }),
      makeAgg({ dayDate: '2026-07-14' }),
    ];
    const gap = computeScore(
      makeAgg({ sleepMinutes: 480, steps: 9000, waterMl: 2000, loggedModules: 3 }),
      { goals: defaultScoreGoals, trailing },
    );
    const training = gap.components.find((c) => c.key === 'training')!;
    // 5 días sin entrenar, gap permitido 2 → 75 − 12·3 = 39
    expect(training.score).toBe(39);
    expect(training.reasons[0]!.code).toBe('training_gap');
  });

  it('sin historial de entrenamiento, el componente queda no disponible', () => {
    const breakdown = computeScore(
      makeAgg({ sleepMinutes: 480, steps: 9000, waterMl: 2000, mood: 4, loggedModules: 3 }),
      ctx,
    );
    expect(breakdown.components.find((c) => c.key === 'training')!.available).toBe(false);
  });
});

describe('computeAndStoreScore (integración)', () => {
  it('persiste el desglose validable y espeja el score en el agregado', () => {
    const db = createTestDb();
    const sleep = new SleepRepository(db);
    const hydration = new HydrationRepository(db);

    const bed = new Date('2026-07-14T23:00:00');
    const wake = new Date('2026-07-15T07:00:00');
    sleep.log({ dayDate: DAY, startAt: bed.getTime(), endAt: wake.getTime(), qualityRating: 4 });
    hydration.log({ dayDate: DAY, loggedAt: 1, amountMl: 2500 });

    const breakdown = computeAndStoreScore(db, DAY);
    expect(breakdown.date).toBe(DAY);

    const scores = new ScoresRepository(db);
    const stored = scores.getBreakdown(DAY);
    expect(stored).not.toBeNull();
    expect(stored!.score).toBe(breakdown.score);
    expect(stored!.components).toHaveLength(9);
  });
});

describe('pesos', () => {
  it('los pesos canónicos suman 1', () => {
    const total = Object.values(COMPONENT_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(1);
  });
});
