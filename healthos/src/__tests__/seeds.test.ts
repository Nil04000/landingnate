import { count, eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import * as schema from '@/core/db/schema';
import { runSeeds } from '@/core/db/seeds/run';

import { createTestDb } from './helpers/test-db';

function rowCount(db: ReturnType<typeof createTestDb>, table: Parameters<typeof count>[0] & object) {
  return db.select({ n: count() }).from(table as any).get()!.n;
}

describe('runSeeds', () => {
  it('siembra catálogo completo: labs, ejercicios, alimentos, RDAs', () => {
    const db = createTestDb();
    runSeeds(db);

    expect(rowCount(db, schema.labPanels)).toBeGreaterThanOrEqual(9);
    expect(rowCount(db, schema.labMarkers)).toBeGreaterThanOrEqual(45);
    expect(rowCount(db, schema.labReferenceRanges)).toBeGreaterThanOrEqual(45);
    expect(rowCount(db, schema.exercises)).toBeGreaterThanOrEqual(130);
    expect(rowCount(db, schema.foods)).toBeGreaterThanOrEqual(100);
    expect(rowCount(db, schema.foodPortions)).toBeGreaterThan(20);
    expect(rowCount(db, schema.nutrientTargets)).toBe(26);
  });

  it('es idempotente: correr dos veces no duplica nada', () => {
    const db = createTestDb();
    runSeeds(db);
    const markers = rowCount(db, schema.labMarkers);
    const foods = rowCount(db, schema.foods);
    runSeeds(db);
    expect(rowCount(db, schema.labMarkers)).toBe(markers);
    expect(rowCount(db, schema.foods)).toBe(foods);
  });

  it('los marcadores clave del spec existen con rangos', () => {
    const db = createTestDb();
    runSeeds(db);
    for (const code of [
      'glucose',
      'hba1c',
      'insulin',
      'creatinine',
      'egfr',
      'alt',
      'ast',
      'ggt',
      'testosterone_total',
      'testosterone_free',
      'shbg',
      'lh',
      'fsh',
      'estradiol',
      'prolactin',
      'tsh',
      'ft3',
      'ft4',
      'vitamin_d',
      'ferritin',
      'crp',
      'ldl',
      'hdl',
      'triglycerides',
    ]) {
      const marker = db
        .select()
        .from(schema.labMarkers)
        .where(eq(schema.labMarkers.code, code))
        .get();
      expect(marker, `falta marcador ${code}`).toBeDefined();
      const ranges = db
        .select()
        .from(schema.labReferenceRanges)
        .where(eq(schema.labReferenceRanges.markerId, marker!.id))
        .all();
      expect(ranges.length, `marcador ${code} sin rangos`).toBeGreaterThan(0);
    }
  });

  it('los seeds nacen con isDirty=0 (no se pushean al sync futuro)', () => {
    const db = createTestDb();
    runSeeds(db);
    const dirty = db
      .select({ n: count() })
      .from(schema.foods)
      .where(eq(schema.foods.isDirty, 1))
      .get()!.n;
    expect(dirty).toBe(0);
  });
});
