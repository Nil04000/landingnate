import { DailyAggregatesRepository, type DailyAggregate } from '@/core/db/repositories/aggregates.repository';
import { InsightsRepository } from '@/core/db/repositories/insights.repository';
import type { AppSqliteDb } from '@/core/db/types';
import { daysAgoLocal, eachDayLocal, isoWeekOf, todayLocal } from '@/core/lib/dates';

import { evaluateRule, type DayRow } from './evaluators';
import { buildCatalog } from './rules';

const WINDOW_DAYS = 120;

/** Agregado vacío para días sin fila (mantiene la alineación temporal de los lags). */
function emptyAggregate(dayDate: string): DailyAggregate {
  return {
    dayDate,
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
  };
}

/**
 * Serie DENSA de días [hoy-windowDays+1 .. hoy]: días sin fila entran como
 * agregados vacíos (mantiene alineación temporal). La usan el motor de
 * insights y las herramientas del asistente.
 */
export function loadDenseDays(db: AppSqliteDb, windowDays: number, now = Date.now()): DayRow[] {
  const aggregates = new DailyAggregatesRepository(db);
  aggregates.rebuildStale();
  const today = todayLocal(new Date(now));
  const from = daysAgoLocal(windowDays - 1, new Date(now));
  const rows = aggregates.getRange(from, today);
  const byDay = new Map(rows.map((r) => [r.dayDate, r]));
  return eachDayLocal(from, today).map((day) => ({
    day,
    agg: byDay.get(day) ?? emptyAggregate(day),
  }));
}

export type InsightsRunResult = {
  evaluated: number;
  findings: number;
  inserted: number;
  updated: number;
  skipped: number;
  expired: number;
};

/**
 * Pipeline del motor de insights:
 * 1. reconstruye agregados sucios
 * 2. carga la ventana de 120 días en memoria (serie DENSA: días faltantes
 *    entran como agregados vacíos para que los lags no se desalineen)
 * 3. evalúa el catálogo completo (~250 reglas, síncrono, <50 ms)
 * 4. upsert con dedupe semanal + respeto de descartes
 * 5. expira hallazgos vencidos
 */
export function runInsights(db: AppSqliteDb, now = Date.now()): InsightsRunResult {
  const insightsRepo = new InsightsRepository(db);
  const days = loadDenseDays(db, WINDOW_DAYS, now);
  const today = todayLocal(new Date(now));

  const catalog = buildCatalog();
  const week = isoWeekOf(today);

  const result: InsightsRunResult = {
    evaluated: catalog.length,
    findings: 0,
    inserted: 0,
    updated: 0,
    skipped: 0,
    expired: 0,
  };

  for (const rule of catalog) {
    const finding = evaluateRule(rule, days);
    if (!finding) continue;
    result.findings++;
    const outcome = insightsRepo.upsert(finding, `${rule.id}:${week}`, now);
    result[outcome]++;
  }

  result.expired = insightsRepo.expireOld(now);
  return result;
}
