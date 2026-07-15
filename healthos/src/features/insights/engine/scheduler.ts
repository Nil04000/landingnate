import { InteractionManager } from 'react-native';

import { db } from '@/core/db/client';

import { runInsights } from './run';

/**
 * Scheduler del motor: corre al abrir la app, al volver a foreground si
 * pasaron >6 h, y con debounce de 20 s después de cualquier mutación.
 * La evaluación en sí es síncrona (<50 ms) pero se difiere a después de
 * las interacciones para no robarle frames a la UI.
 */

const DEBOUNCE_MS = 20_000;
const STALE_MS = 6 * 3_600_000;

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let lastRunAt = 0;

export function runInsightsNow(onDone?: () => void): void {
  void InteractionManager.runAfterInteractions(() => {
    runInsights(db);
    lastRunAt = Date.now();
    onDone?.();
  });
}

/** Debounced: la llaman las mutaciones después de cada write. */
export function scheduleInsightsRun(onDone?: () => void): void {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    runInsightsNow(onDone);
  }, DEBOUNCE_MS);
}

/** Al volver a foreground: solo si la última corrida quedó vieja. */
export function runInsightsIfStale(onDone?: () => void): void {
  if (Date.now() - lastRunAt > STALE_MS) runInsightsNow(onDone);
}
