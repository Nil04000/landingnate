import { eq } from 'drizzle-orm';

import * as schema from '../schema';
import type { AppSqliteDb } from '../types';
import { exerciseSeeds } from './exercises.seed';
import { foodSeeds } from './foods.seed';
import { labPanelSeeds } from './lab-catalog.seed';
import { nutrientTargetSeeds } from './nutrient-targets.seed';
import type { FoodSeed } from './types';

/**
 * Subir cuando cambie cualquier *.seed.ts para que las instalaciones
 * existentes re-siembren (los inserts son ON CONFLICT DO NOTHING, así que
 * re-correr nunca pisa datos del usuario).
 */
export const SEED_VERSION = 1;

const SEED_VERSION_KEY = 'seed_version';

/** Troceo para no exceder el límite de variables de SQLite en inserts masivos. */
function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

function foodRow(seed: FoodSeed, now: number) {
  const { slug, name, brand, isLiquid, portions: _portions, ...nutrients } = seed;
  return {
    id: `seed-food-${slug}`,
    createdAt: now,
    updatedAt: now,
    isDirty: 0,
    name,
    brand: brand ?? null,
    isLiquid: isLiquid ? 1 : 0,
    source: 'seed',
    ...nutrients,
  };
}

/**
 * Siembra el catálogo (labs, ejercicios, alimentos, RDAs). Idempotente:
 * ids determinísticos + ON CONFLICT DO NOTHING; skip total si la versión
 * ya corrió. Los seeds nacen con isDirty=0 (catálogo, no data del usuario).
 */
export function runSeeds(db: AppSqliteDb): void {
  const existing = db
    .select()
    .from(schema.appMeta)
    .where(eq(schema.appMeta.key, SEED_VERSION_KEY))
    .get();
  if (existing && Number(existing.value) >= SEED_VERSION) return;

  const now = Date.now();

  db.transaction((tx) => {
    // ── Targets de nutrientes ────────────────────────────────────
    tx.insert(schema.nutrientTargets)
      .values(
        nutrientTargetSeeds.map((n) => ({
          id: `seed-nutrient-${n.nutrientKey}`,
          createdAt: now,
          updatedAt: now,
          isDirty: 0,
          nutrientKey: n.nutrientKey,
          displayName: n.displayName,
          rdaAmount: n.rdaAmount,
          upperLimit: n.upperLimit ?? null,
          unit: n.unit,
        })),
      )
      .onConflictDoNothing()
      .run();

    // ── Catálogo de laboratorios ─────────────────────────────────
    labPanelSeeds.forEach((panel, panelIdx) => {
      tx.insert(schema.labPanels)
        .values({
          id: `seed-panel-${panel.code}`,
          createdAt: now,
          updatedAt: now,
          isDirty: 0,
          code: panel.code,
          name: panel.name,
          sortIndex: panelIdx,
        })
        .onConflictDoNothing()
        .run();

      for (const marker of panel.markers) {
        tx.insert(schema.labMarkers)
          .values({
            id: `seed-marker-${marker.code}`,
            createdAt: now,
            updatedAt: now,
            isDirty: 0,
            panelId: `seed-panel-${panel.code}`,
            code: marker.code,
            name: marker.name,
            unit: marker.unit,
            description: marker.description ?? null,
            higherIsWorse: marker.higherIsWorse ?? null,
          })
          .onConflictDoNothing()
          .run();

        marker.ranges.forEach((range, rangeIdx) => {
          tx.insert(schema.labReferenceRanges)
            .values({
              id: `seed-range-${marker.code}-${rangeIdx}`,
              createdAt: now,
              updatedAt: now,
              isDirty: 0,
              markerId: `seed-marker-${marker.code}`,
              low: range.low ?? null,
              high: range.high ?? null,
              optimalLow: range.optimalLow ?? null,
              optimalHigh: range.optimalHigh ?? null,
              sex: range.sex ?? null,
              sourceLabel: 'seed',
            })
            .onConflictDoNothing()
            .run();
        });
      }
    });

    // ── Ejercicios ───────────────────────────────────────────────
    for (const batch of chunk(exerciseSeeds, 100)) {
      tx.insert(schema.exercises)
        .values(
          batch.map((e) => ({
            id: `seed-ex-${e.slug}`,
            createdAt: now,
            updatedAt: now,
            isDirty: 0,
            name: e.name,
            muscleGroup: e.muscleGroup,
            equipment: e.equipment,
            isCustom: 0,
          })),
        )
        .onConflictDoNothing()
        .run();
    }

    // ── Alimentos + porciones ────────────────────────────────────
    for (const batch of chunk(foodSeeds, 20)) {
      tx.insert(schema.foods)
        .values(batch.map((f) => foodRow(f, now)))
        .onConflictDoNothing()
        .run();
    }
    const portionRows = foodSeeds.flatMap(
      (f) =>
        f.portions?.map(([name, grams], i) => ({
          id: `seed-portion-${f.slug}-${i}`,
          createdAt: now,
          updatedAt: now,
          isDirty: 0,
          foodId: `seed-food-${f.slug}`,
          name,
          grams,
        })) ?? [],
    );
    for (const batch of chunk(portionRows, 100)) {
      tx.insert(schema.foodPortions).values(batch).onConflictDoNothing().run();
    }

    // ── Versión ──────────────────────────────────────────────────
    tx.insert(schema.appMeta)
      .values({ key: SEED_VERSION_KEY, value: String(SEED_VERSION) })
      .onConflictDoUpdate({
        target: schema.appMeta.key,
        set: { value: String(SEED_VERSION) },
      })
      .run();
  });
}
