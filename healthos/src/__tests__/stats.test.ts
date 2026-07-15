import { describe, expect, it } from 'vitest';

import { pearson, studentTwoTailedP } from '@/core/lib/stats/pearson';
import { ranks, spearman } from '@/core/lib/stats/spearman';
import { bucketBy, rollingMean, streaks, summarize } from '@/core/lib/stats/series';
import { welch } from '@/core/lib/stats/welch';

describe('pearson', () => {
  it('correlación perfecta positiva y negativa', () => {
    const x = [1, 2, 3, 4, 5];
    expect(pearson(x, [2, 4, 6, 8, 10]).r).toBeCloseTo(1);
    expect(pearson(x, [10, 8, 6, 4, 2]).r).toBeCloseTo(-1);
  });

  it('Anscombe I: r ≈ 0.816', () => {
    const x = [10, 8, 13, 9, 11, 14, 6, 4, 12, 7, 5];
    const y = [8.04, 6.95, 7.58, 8.81, 8.33, 9.96, 7.24, 4.26, 10.84, 4.82, 5.68];
    const { r, n, p } = pearson(x, y);
    expect(n).toBe(11);
    expect(r).toBeCloseTo(0.816, 2);
    expect(p).toBeLessThan(0.01);
  });

  it('ignora pares con null y exige n≥3', () => {
    const { r, n } = pearson([1, null, 3, 4], [2, 5, null, 8]);
    expect(n).toBe(2);
    expect(Number.isNaN(r)).toBe(true);
  });

  it('serie constante no correlaciona (r NaN, p 1)', () => {
    const { r, p } = pearson([5, 5, 5, 5], [1, 2, 3, 4]);
    expect(Number.isNaN(r)).toBe(true);
    expect(p).toBe(1);
  });
});

describe('studentTwoTailedP', () => {
  it('valores de referencia de la distribución t', () => {
    // t=2.228, df=10 → p ≈ 0.05
    expect(studentTwoTailedP(2.228, 10)).toBeCloseTo(0.05, 2);
    // t=0 → p = 1
    expect(studentTwoTailedP(0, 10)).toBeCloseTo(1, 5);
    // |t| grande → p ~ 0
    expect(studentTwoTailedP(10, 20)).toBeLessThan(0.0001);
  });
});

describe('spearman', () => {
  it('ranks promedia empates', () => {
    expect(ranks([10, 20, 20, 30])).toEqual([1, 2.5, 2.5, 4]);
  });

  it('relación monótona no lineal: Spearman 1, Pearson < 1', () => {
    const x = [1, 2, 3, 4, 5, 6];
    const y = x.map((v) => v ** 3);
    expect(spearman(x, y).r).toBeCloseTo(1);
    expect(pearson(x, y).r).toBeLessThan(1);
  });

  it('outlier dispara Pearson pero no engaña a Spearman (guarda del motor)', () => {
    // sin relación real + un outlier extremo
    const x = [1, 2, 3, 4, 5, 6, 7, 100];
    const y = [3, 1, 4, 2, 5, 3, 4, 90];
    const p = pearson(x, y).r;
    const s = spearman(x, y).r;
    expect(p).toBeGreaterThan(0.9); // Pearson engañado por el outlier
    expect(s).toBeLessThan(0.75); // Spearman lo resiste → la regla no dispara
  });
});

describe('welch', () => {
  it('detecta diferencia clara de medias con effect size', () => {
    const withCaffeine = [380, 350, 400, 370, 360]; // min de sueño
    const without = [450, 460, 440, 470, 455, 445];
    const result = welch(withCaffeine, without)!;
    expect(result.meanA).toBeLessThan(result.meanB);
    expect(result.p).toBeLessThan(0.01);
    expect(Math.abs(result.cohenD)).toBeGreaterThan(1);
  });

  it('muestras insuficientes → null', () => {
    expect(welch([1], [2, 3, 4])).toBeNull();
  });

  it('sin diferencia real → p alto', () => {
    const a = [10, 12, 11, 13, 12];
    const b = [11, 12, 10, 13, 11];
    expect(welch(a, b)!.p).toBeGreaterThan(0.3);
  });
});

describe('series', () => {
  it('rollingMean con nulls', () => {
    expect(rollingMean([1, 2, null, 4], 2)).toEqual([1, 1.5, 2, 4]);
  });

  it('summarize da récords con índice', () => {
    const s = summarize([5, null, 9, 2, 7]);
    expect(s.n).toBe(4);
    expect(s.max).toEqual({ value: 9, index: 2 });
    expect(s.min).toEqual({ value: 2, index: 3 });
  });

  it('streaks: mejor racha y racha actual; null corta', () => {
    // objetivo: >= 8000 pasos
    const days = [9000, 8500, null, 8200, 8100, 9500];
    const { current, best } = streaks(days, (v) => v >= 8000);
    expect(best).toBe(3);
    expect(current).toBe(3);
    expect(streaks([9000, 7000], (v) => v >= 8000).current).toBe(0);
  });

  it('bucketBy agrupa por mes preservando orden', () => {
    const buckets = bucketBy(
      [
        { day: '2026-06-29', value: 10 },
        { day: '2026-06-30', value: 20 },
        { day: '2026-07-01', value: 30 },
        { day: '2026-07-02', value: null },
      ],
      (d) => d.slice(0, 7),
    );
    expect(buckets).toEqual([
      { key: '2026-06', mean: 15, n: 2 },
      { key: '2026-07', mean: 30, n: 1 },
    ]);
  });
});
