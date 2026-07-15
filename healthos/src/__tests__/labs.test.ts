import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { LabsRepository, computeFlag } from '@/core/db/repositories/labs.repository';
import { labMarkers, userProfile } from '@/core/db/schema';
import { runSeeds } from '@/core/db/seeds/run';

import { createTestDb } from './helpers/test-db';

function setup() {
  const db = createTestDb();
  runSeeds(db);
  return { db, labs: new LabsRepository(db) };
}

function markerByCode(db: ReturnType<typeof createTestDb>, code: string) {
  return db.select().from(labMarkers).where(eq(labMarkers.code, code)).get()!;
}

describe('computeFlag', () => {
  const range = {
    low: 70,
    high: 100,
    optimalLow: 75,
    optimalHigh: 90,
  } as Parameters<typeof computeFlag>[1];

  it('clasifica low/high/in_range/optimal', () => {
    expect(computeFlag(60, range)).toBe('low');
    expect(computeFlag(110, range)).toBe('high');
    expect(computeFlag(72, range)).toBe('in_range'); // dentro de referencia, fuera de óptimo
    expect(computeFlag(85, range)).toBe('optimal');
    expect(computeFlag(85, undefined)).toBeNull();
  });

  it('rango solo con techo (ej. LDL): bajo el óptimo es optimal', () => {
    const ldl = { high: 130, optimalHigh: 100 } as Parameters<typeof computeFlag>[1];
    expect(computeFlag(80, ldl)).toBe('optimal');
    expect(computeFlag(120, ldl)).toBe('in_range');
    expect(computeFlag(150, ldl)).toBe('high');
  });
});

describe('LabsRepository', () => {
  it('el catálogo seedeado expone paneles y marcadores', () => {
    const { labs } = setup();
    expect(labs.listPanels().length).toBeGreaterThanOrEqual(9);
    expect(labs.listMarkers().length).toBeGreaterThanOrEqual(45);
  });

  it('addResult calcula flag con el rango del sexo del perfil', () => {
    const { db, labs } = setup();
    // perfil masculino → testosterona 300-1000 (óptimo 550-900)
    db.insert(userProfile)
      .values({
        id: 'self',
        createdAt: 1,
        updatedAt: 1,
        isDirty: 0,
        sex: 'male',
        timezone: 'America/Argentina/Buenos_Aires',
        unitSystem: 'metric',
      })
      .run();

    const testo = markerByCode(db, 'testosterone_total');
    const report = labs.createReport({ collectedAt: Date.now(), fasting: 1 });

    expect(labs.addResult(report.id, testo.id, 250).flag).toBe('low');
    expect(labs.addResult(report.id, testo.id, 400).flag).toBe('in_range');
    expect(labs.addResult(report.id, testo.id, 700).flag).toBe('optimal');
  });

  it('markerHistory ordena por fecha de extracción y markersWithLatest da último+anterior', () => {
    const { db, labs } = setup();
    const glucose = markerByCode(db, 'glucose');

    const r1 = labs.createReport({ collectedAt: new Date('2026-01-10').getTime() });
    const r2 = labs.createReport({ collectedAt: new Date('2026-06-10').getTime() });
    labs.addResult(r2.id, glucose.id, 92);
    labs.addResult(r1.id, glucose.id, 99);

    const history = labs.markerHistory(glucose.id);
    expect(history.map((h) => h.value)).toEqual([99, 92]);

    const withLatest = labs.markersWithLatest();
    expect(withLatest).toHaveLength(1);
    expect(withLatest[0]!.latest?.value).toBe(92);
    expect(withLatest[0]!.previous?.value).toBe(99);
    expect(withLatest[0]!.range?.low).toBe(70);
  });

  it('borrar un reporte oculta sus resultados del historial', () => {
    const { db, labs } = setup();
    const glucose = markerByCode(db, 'glucose');
    const report = labs.createReport({ collectedAt: Date.now() });
    labs.addResult(report.id, glucose.id, 95);
    expect(labs.markerHistory(glucose.id)).toHaveLength(1);
    labs.softDeleteReport(report.id);
    expect(labs.markerHistory(glucose.id)).toHaveLength(0);
    expect(labs.markersWithLatest()).toHaveLength(0);
  });

  it('marcador custom con rango propio queda flaggeable', () => {
    const { labs } = setup();
    const marker = labs.createCustomMarker({ name: 'Zinc sérico', unit: 'µg/dL', low: 70, high: 120 });
    const report = labs.createReport({ collectedAt: Date.now() });
    expect(labs.addResult(report.id, marker.id, 60).flag).toBe('low');
    expect(labs.addResult(report.id, marker.id, 95).flag).toBe('in_range');
  });
});
