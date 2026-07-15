import { describe, expect, it } from 'vitest';

import { ActivityRepository } from '@/core/db/repositories/activity.repository';
import { BodyRepository } from '@/core/db/repositories/body.repository';
import { CompoundsRepository } from '@/core/db/repositories/compounds.repository';
import { DailyAggregatesRepository } from '@/core/db/repositories/aggregates.repository';
import { HydrationRepository } from '@/core/db/repositories/hydration.repository';
import { SleepRepository } from '@/core/db/repositories/sleep.repository';
import { SubstancesRepository } from '@/core/db/repositories/substances.repository';
import { WellbeingRepository } from '@/core/db/repositories/wellbeing.repository';

import { createTestDb } from './helpers/test-db';

const DAY = '2026-07-15';

describe('DailyAggregatesRepository.rebuildDay', () => {
  it('día vacío: todo null salvo contadores estructurales', () => {
    const db = createTestDb();
    const agg = new DailyAggregatesRepository(db).rebuildDay(DAY);
    expect(agg.sleepMinutes).toBeNull();
    expect(agg.waterMl).toBeNull();
    expect(agg.caffeineMg).toBeNull();
    expect(agg.steps).toBeNull();
    expect(agg.weightKg).toBeNull();
    expect(agg.mood).toBeNull();
    expect(agg.supplementAdherencePct).toBeNull();
    expect(agg.workoutCount).toBe(0);
    expect(agg.loggedModules).toBe(0);
    expect(agg.isStale).toBe(0);
  });

  it('agrega un día completo correctamente', () => {
    const db = createTestDb();
    const sleep = new SleepRepository(db);
    const hydration = new HydrationRepository(db);
    const substances = new SubstancesRepository(db);
    const activity = new ActivityRepository(db);
    const body = new BodyRepository(db);
    const wellbeing = new WellbeingRepository(db);

    // Sueño 23:30 → 07:00 (acreditado al DAY), calidad 4
    const bedtime = new Date('2026-07-14T23:30:00');
    const wake = new Date('2026-07-15T07:00:00');
    sleep.log({ dayDate: DAY, startAt: bedtime.getTime(), endAt: wake.getTime(), qualityRating: 4 });
    // Siesta 30 min
    sleep.log({
      dayDate: DAY,
      startAt: new Date('2026-07-15T14:00:00').getTime(),
      endAt: new Date('2026-07-15T14:30:00').getTime(),
      isNap: 1,
    });

    hydration.log({ dayDate: DAY, loggedAt: 1, amountMl: 500 });
    hydration.log({ dayDate: DAY, loggedAt: 2, amountMl: 750 });

    // 2 espressos (63 mg c/u, el último a las 15:30) + 1 cerveza (14 g etanol)
    substances.log({
      dayDate: DAY,
      consumedAt: new Date('2026-07-15T08:00:00').getTime(),
      type: 'espresso',
      caffeineMg: 63,
    });
    substances.log({
      dayDate: DAY,
      consumedAt: new Date('2026-07-15T15:30:00').getTime(),
      type: 'espresso',
      caffeineMg: 63,
    });
    substances.log({
      dayDate: DAY,
      consumedAt: new Date('2026-07-15T21:00:00').getTime(),
      type: 'alcohol',
      alcoholGrams: 14,
    });

    activity.upsertForDay({ dayDate: DAY, steps: 9200 });
    body.log({ dayDate: DAY, measuredAt: 100, weightKg: 82.4, bodyFatPct: 17.2 });
    wellbeing.log({ dayDate: DAY, loggedAt: 1, mood: 4, energy: 3, stress: 2 });
    wellbeing.log({ dayDate: DAY, loggedAt: 2, mood: 2, energy: 3, stress: 4 });

    const agg = new DailyAggregatesRepository(db).rebuildDay(DAY);

    expect(agg.sleepMinutes).toBe(450); // 7h30
    expect(agg.napMinutes).toBe(30);
    expect(agg.sleepQuality).toBe(4);
    expect(agg.bedtimeMinute).toBe(330); // 23:30 = 5h30 después de las 18:00
    expect(agg.waterMl).toBe(1250);
    expect(agg.caffeineMg).toBe(126);
    expect(agg.lastCaffeineHour).toBe(15.5);
    expect(agg.alcoholUnits).toBeCloseTo(1.4);
    expect(agg.cigarettes).toBe(0);
    expect(agg.steps).toBe(9200);
    expect(agg.weightKg).toBe(82.4);
    expect(agg.bodyFatPct).toBe(17.2);
    expect(agg.mood).toBe(3); // media de 4 y 2
    expect(agg.stress).toBe(3); // media de 2 y 4
    expect(agg.loggedModules).toBe(5); // sueño, agua, subjetivo, cuerpo/actividad, sustancias
  });

  it('markStale + rebuildStale reconstruyen solo lo sucio', () => {
    const db = createTestDb();
    const aggregates = new DailyAggregatesRepository(db);
    const hydration = new HydrationRepository(db);

    hydration.log({ dayDate: DAY, loggedAt: 1, amountMl: 300 });
    aggregates.markStale(DAY);
    expect(aggregates.listStaleDays()).toEqual([DAY]);

    const rebuilt = aggregates.rebuildStale();
    expect(rebuilt).toBe(1);
    expect(aggregates.listStaleDays()).toEqual([]);
    expect(aggregates.getDay(DAY)?.waterMl).toBe(300);

    // segundo write → vuelve a quedar sucio y el rebuild refleja el nuevo total
    hydration.log({ dayDate: DAY, loggedAt: 2, amountMl: 200 });
    aggregates.markStale(DAY);
    aggregates.rebuildStale();
    expect(aggregates.getDay(DAY)?.waterMl).toBe(500);
  });

  it('adherencia de suplementos: null sin registros, % con tomas y omisiones', () => {
    const db = createTestDb();
    const compounds = new CompoundsRepository(db);
    const aggregates = new DailyAggregatesRepository(db);

    expect(aggregates.rebuildDay(DAY).supplementAdherencePct).toBeNull();

    const creatine = compounds.createDefinition({ kind: 'supplement', name: 'Creatina' });
    const vitD = compounds.createDefinition({
      kind: 'supplement',
      name: 'Vitamina D3',
      linkedNutrientKey: 'vitamin_d_ug',
    });
    compounds.logIntake({ compoundId: creatine.id, dayDate: DAY, takenAt: 1, doseAmount: 5, doseUnit: 'g' });
    compounds.logIntake({ compoundId: vitD.id, dayDate: DAY, takenAt: 2, doseAmount: 25, doseUnit: 'ug', skipped: 1 });

    expect(aggregates.rebuildDay(DAY).supplementAdherencePct).toBe(50);
  });
});
