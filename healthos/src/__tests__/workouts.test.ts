import { describe, expect, it } from 'vitest';

import { DailyAggregatesRepository } from '@/core/db/repositories/aggregates.repository';
import { ExercisesRepository } from '@/core/db/repositories/exercises.repository';
import { WorkoutsRepository, epleyE1Rm } from '@/core/db/repositories/workouts.repository';
import { runSeeds } from '@/core/db/seeds/run';

import { createTestDb } from './helpers/test-db';

const DAY = '2026-07-15';

describe('epleyE1Rm', () => {
  it('calcula e1RM con Epley', () => {
    expect(epleyE1Rm(100, 1)).toBe(100);
    expect(epleyE1Rm(80, 8)).toBeCloseTo(80 * (1 + 8 / 30));
    expect(epleyE1Rm(0, 5)).toBe(0);
    expect(epleyE1Rm(100, 0)).toBe(0);
  });
});

describe('WorkoutsRepository — sesión completa', () => {
  function setup() {
    const db = createTestDb();
    runSeeds(db);
    const workouts = new WorkoutsRepository(db);
    const exercises = new ExercisesRepository(db);
    const bench = exercises.search('press banca')[0] ?? exercises.search('press')[0];
    expect(bench).toBeDefined();
    return { db, workouts, exercises, bench: bench! };
  }

  it('arma sesión con ejercicios y series; el volumen excluye warmups', () => {
    const { db, workouts, bench } = setup();
    const w = workouts.create({ dayDate: DAY, type: 'strength', title: 'Push A', startedAt: 1000 });
    const wex = workouts.addExercise(w.id, bench.id);

    workouts.addSet(wex.id, { reps: 10, weightKg: 40, isWarmup: 1 });
    workouts.addSet(wex.id, { reps: 8, weightKg: 80 });
    workouts.addSet(wex.id, { reps: 8, weightKg: 80 });
    workouts.addSet(wex.id, { reps: 6, weightKg: 85 });

    const session = workouts.getFullSession(w.id);
    expect(session).toHaveLength(1);
    expect(session[0]!.exercise.id).toBe(bench.id);
    expect(session[0]!.sets).toHaveLength(4);

    // volumen: solo series efectivas
    expect(workouts.strengthVolumeForDay(DAY)).toBe(8 * 80 + 8 * 80 + 6 * 85);

    // agregados del día reflejan la sesión
    workouts.update(w.id, { endedAt: 1000 + 55 * 60_000 });
    const agg = new DailyAggregatesRepository(db).rebuildDay(DAY);
    expect(agg.workoutCount).toBe(1);
    expect(agg.workoutMinutes).toBe(55);
    expect(agg.strengthVolumeKg).toBe(1790);
  });

  it('lastSessionSets devuelve los valores fantasma de la sesión anterior', () => {
    const { workouts, bench } = setup();

    const prev = workouts.create({ dayDate: '2026-07-12', type: 'strength', startedAt: 500 });
    const prevWex = workouts.addExercise(prev.id, bench.id);
    workouts.addSet(prevWex.id, { reps: 8, weightKg: 77.5 });
    workouts.addSet(prevWex.id, { reps: 8, weightKg: 77.5 });

    const current = workouts.create({ dayDate: DAY, type: 'strength', startedAt: 2000 });
    workouts.addExercise(current.id, bench.id);

    const ghost = workouts.lastSessionSets(bench.id, current.id);
    expect(ghost).toHaveLength(2);
    expect(ghost[0]!.weightKg).toBe(77.5);
  });

  it('bestE1Rm detecta PRs y e1RmHistory da el máximo por día', () => {
    const { workouts, bench } = setup();

    const day1 = workouts.create({ dayDate: '2026-07-01', type: 'strength', startedAt: 1 });
    const wex1 = workouts.addExercise(day1.id, bench.id);
    workouts.addSet(wex1.id, { reps: 8, weightKg: 80 }); // e1RM ≈ 101.3

    const day2 = workouts.create({ dayDate: DAY, type: 'strength', startedAt: 2 });
    const wex2 = workouts.addExercise(day2.id, bench.id);

    const bestBefore = workouts.bestE1Rm(bench.id);
    expect(bestBefore).toBeCloseTo(epleyE1Rm(80, 8));

    const newSet = workouts.addSet(wex2.id, { reps: 5, weightKg: 95 }); // e1RM ≈ 110.8 → PR
    expect(epleyE1Rm(95, 5)).toBeGreaterThan(bestBefore);
    expect(workouts.bestE1Rm(bench.id, newSet.id)).toBeCloseTo(bestBefore);

    const history = workouts.e1RmHistory(bench.id);
    expect(history).toHaveLength(2);
    expect(history[0]!.dayDate).toBe('2026-07-01');
    expect(history[1]!.e1Rm).toBeCloseTo(epleyE1Rm(95, 5));
  });
});
