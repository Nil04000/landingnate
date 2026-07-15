import { type CorrelationResult, pairComplete, pearson } from './pearson';

/** Rangos con promedio en empates. */
export function ranks(values: number[]): number[] {
  const indexed = values.map((v, i) => ({ v, i }));
  indexed.sort((a, b) => a.v - b.v);
  const out = new Array<number>(values.length);
  let pos = 0;
  while (pos < indexed.length) {
    let end = pos;
    while (end + 1 < indexed.length && indexed[end + 1]!.v === indexed[pos]!.v) end++;
    const avgRank = (pos + end) / 2 + 1;
    for (let k = pos; k <= end; k++) out[indexed[k]!.i] = avgRank;
    pos = end + 1;
  }
  return out;
}

/**
 * Spearman = Pearson sobre rangos. Guarda anti-outliers del motor de
 * insights: una correlación solo se reporta si Pearson Y Spearman acuerdan.
 */
export function spearman(xs: (number | null)[], ys: (number | null)[]): CorrelationResult {
  const { x, y } = pairComplete(xs, ys);
  if (x.length < 3) return { r: NaN, n: x.length, p: 1 };
  return pearson(ranks(x), ranks(y));
}
