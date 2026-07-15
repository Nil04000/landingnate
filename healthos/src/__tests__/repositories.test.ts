import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';

import { bodyMeasurements } from '@/core/db/schema';
import { BodyRepository } from '@/core/db/repositories/body.repository';
import { HydrationRepository } from '@/core/db/repositories/hydration.repository';
import { SleepRepository } from '@/core/db/repositories/sleep.repository';
import type { AppSqliteDb } from '@/core/db/types';

import { createTestDb } from './helpers/test-db';

const DAY = '2026-07-15';

describe('contrato sync-ready (base.repository)', () => {
  let db: AppSqliteDb;
  let body: BodyRepository;

  beforeEach(() => {
    db = createTestDb();
    body = new BodyRepository(db);
  });

  it('insert estampa id uuid, timestamps e isDirty=1', () => {
    const row = body.log({ dayDate: DAY, measuredAt: Date.now(), weightKg: 82.4 });
    expect(row.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(row.createdAt).toBeGreaterThan(0);
    expect(row.updatedAt).toBe(row.createdAt);
    expect(row.isDirty).toBe(1);
    expect(row.deletedAt).toBeNull();
  });

  it('update bumpea updatedAt y marca isDirty', async () => {
    const row = body.log({ dayDate: DAY, measuredAt: Date.now(), weightKg: 82.4 });
    await new Promise((r) => setTimeout(r, 5));
    body.update(row.id, { weightKg: 81.9 });
    const updated = body.getById(row.id)!;
    expect(updated.weightKg).toBe(81.9);
    expect(updated.updatedAt).toBeGreaterThan(row.updatedAt);
    expect(updated.isDirty).toBe(1);
  });

  it('softDelete oculta la fila de toda lectura pero no la borra físicamente', () => {
    const row = body.log({ dayDate: DAY, measuredAt: Date.now(), weightKg: 82.4 });
    body.softDelete(row.id);
    expect(body.getById(row.id)).toBeUndefined();
    expect(body.listByDay(DAY)).toHaveLength(0);
    // sigue existiendo físicamente (para el push del sync futuro)
    const raw = db.select().from(bodyMeasurements).where(eq(bodyMeasurements.id, row.id)).get()!;
    expect(raw.deletedAt).toBeGreaterThan(0);
    expect(raw.isDirty).toBe(1);
  });
});

describe('BodyRepository', () => {
  it('latestWeight devuelve la medición con peso más reciente', () => {
    const body = new BodyRepository(createTestDb());
    body.log({ dayDate: '2026-07-13', measuredAt: 1000, weightKg: 83 });
    body.log({ dayDate: '2026-07-14', measuredAt: 2000, weightKg: 82.5 });
    body.log({ dayDate: DAY, measuredAt: 3000 }); // sin peso (solo % graso p.ej.)
    expect(new BodyRepository(createTestDb()).latestWeight()).toBeUndefined();
    expect(body.latestWeight()?.weightKg).toBe(82.5);
  });

  it('listRange filtra por day_date inclusive', () => {
    const body = new BodyRepository(createTestDb());
    body.log({ dayDate: '2026-07-10', measuredAt: 1, weightKg: 84 });
    body.log({ dayDate: '2026-07-12', measuredAt: 2, weightKg: 83 });
    body.log({ dayDate: '2026-07-20', measuredAt: 3, weightKg: 82 });
    const rows = body.listRange('2026-07-10', '2026-07-15');
    expect(rows.map((r) => r.dayDate)).toEqual(['2026-07-10', '2026-07-12']);
  });
});

describe('SleepRepository', () => {
  it('minutesForDay separa sueño principal de siestas', () => {
    const sleep = new SleepRepository(createTestDb());
    const base = new Date('2026-07-15T00:00:00Z').getTime();
    // 7h30 de sueño nocturno
    sleep.log({ dayDate: DAY, startAt: base - 7.5 * 3_600_000, endAt: base });
    // siesta de 40 min
    sleep.log({
      dayDate: DAY,
      startAt: base + 14 * 3_600_000,
      endAt: base + 14 * 3_600_000 + 40 * 60_000,
      isNap: 1,
    });
    const { sleepMinutes, napMinutes } = sleep.minutesForDay(DAY);
    expect(sleepMinutes).toBe(450);
    expect(napMinutes).toBe(40);
  });
});

describe('HydrationRepository', () => {
  it('totalMlForDay suma solo entradas vivas del día', () => {
    const hydration = new HydrationRepository(createTestDb());
    const a = hydration.log({ dayDate: DAY, loggedAt: 1, amountMl: 500 });
    hydration.log({ dayDate: DAY, loggedAt: 2, amountMl: 250 });
    hydration.log({ dayDate: '2026-07-14', loggedAt: 3, amountMl: 1000 });
    expect(hydration.totalMlForDay(DAY)).toBe(750);
    hydration.softDelete(a.id);
    expect(hydration.totalMlForDay(DAY)).toBe(250);
  });
});
