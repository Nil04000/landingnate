/** Utilidades de series diarias: rolling, récords, rachas, buckets de período. */

export function rollingMean(values: (number | null)[], window: number): (number | null)[] {
  return values.map((_, i) => {
    const slice = values.slice(Math.max(0, i - window + 1), i + 1).filter((v): v is number => v != null);
    if (slice.length === 0) return null;
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  });
}

export type SeriesSummary = {
  n: number;
  mean: number | null;
  min: { value: number; index: number } | null;
  max: { value: number; index: number } | null;
};

export function summarize(values: (number | null)[]): SeriesSummary {
  let sum = 0;
  let n = 0;
  let min: { value: number; index: number } | null = null;
  let max: { value: number; index: number } | null = null;
  values.forEach((v, index) => {
    if (v == null) return;
    n++;
    sum += v;
    if (!min || v < min.value) min = { value: v, index };
    if (!max || v > max.value) max = { value: v, index };
  });
  return { n, mean: n ? sum / n : null, min, max };
}

/**
 * Racha actual y mejor racha de días que cumplen el predicado, recorriendo
 * la serie en orden cronológico. Los null cortan la racha (día sin dato ≠
 * día cumplido).
 */
export function streaks(
  values: (number | null)[],
  predicate: (v: number) => boolean,
): { current: number; best: number } {
  let current = 0;
  let best = 0;
  let run = 0;
  for (const v of values) {
    if (v != null && predicate(v)) {
      run++;
      if (run > best) best = run;
    } else {
      run = 0;
    }
  }
  // racha actual: contar desde el final
  for (let i = values.length - 1; i >= 0; i--) {
    const v = values[i];
    if (v != null && predicate(v)) current++;
    else break;
  }
  return { current, best };
}

export type PeriodBucket = {
  /** Clave del bucket: '2026-W29' | '2026-07' | '2026' */
  key: string;
  mean: number | null;
  n: number;
};

/**
 * Agrupa una serie diaria [{day, value}] en buckets por período con media.
 * `keyOf` decide el bucket (semana ISO, mes 'YYYY-MM', año 'YYYY').
 */
export function bucketBy(
  days: { day: string; value: number | null }[],
  keyOf: (day: string) => string,
): PeriodBucket[] {
  const map = new Map<string, { sum: number; n: number }>();
  const order: string[] = [];
  for (const { day, value } of days) {
    const key = keyOf(day);
    if (!map.has(key)) {
      map.set(key, { sum: 0, n: 0 });
      order.push(key);
    }
    if (value != null) {
      const bucket = map.get(key)!;
      bucket.sum += value;
      bucket.n++;
    }
  }
  return order.map((key) => {
    const { sum, n } = map.get(key)!;
    return { key, mean: n ? sum / n : null, n };
  });
}
