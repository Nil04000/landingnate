/**
 * Correlación de Pearson sobre pares (x, y) donde ambos son no-null.
 * Devuelve r, n de pares válidos y p aproximado (dos colas, vía t de Student).
 */

export type CorrelationResult = { r: number; n: number; p: number };

/** Empareja series alineadas por índice descartando posiciones con null. */
export function pairComplete(
  xs: (number | null)[],
  ys: (number | null)[],
): { x: number[]; y: number[] } {
  const x: number[] = [];
  const y: number[] = [];
  const len = Math.min(xs.length, ys.length);
  for (let i = 0; i < len; i++) {
    const a = xs[i];
    const b = ys[i];
    if (a != null && b != null && Number.isFinite(a) && Number.isFinite(b)) {
      x.push(a);
      y.push(b);
    }
  }
  return { x, y };
}

export function mean(values: number[]): number {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : NaN;
}

export function variance(values: number[]): number {
  if (values.length < 2) return NaN;
  const m = mean(values);
  return values.reduce((s, v) => s + (v - m) ** 2, 0) / (values.length - 1);
}

export function stddev(values: number[]): number {
  return Math.sqrt(variance(values));
}

/**
 * P dos colas para una t de Student con df grados de libertad, vía la
 * función beta incompleta regularizada (fracción continua de Lentz).
 */
export function studentTwoTailedP(t: number, df: number): number {
  if (!Number.isFinite(t) || df <= 0) return 1;
  const x = df / (df + t * t);
  return regularizedIncompleteBeta(df / 2, 0.5, x);
}

function regularizedIncompleteBeta(a: number, b: number, x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const lnBeta =
    logGamma(a) + logGamma(b) - logGamma(a + b);
  const front = Math.exp(a * Math.log(x) + b * Math.log(1 - x) - lnBeta) / a;
  // Fracción continua (método de Lentz modificado)
  let f = 1;
  let c = 1;
  let d = 0;
  for (let i = 0; i <= 200; i++) {
    const m = Math.floor(i / 2);
    let numerator: number;
    if (i === 0) numerator = 1;
    else if (i % 2 === 0) numerator = (m * (b - m) * x) / ((a + 2 * m - 1) * (a + 2 * m));
    else numerator = -((a + m) * (a + b + m) * x) / ((a + 2 * m) * (a + 2 * m + 1));
    d = 1 + numerator * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    d = 1 / d;
    c = 1 + numerator / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    f *= c * d;
    if (Math.abs(1 - c * d) < 1e-8) break;
  }
  const result = front * (f - 1);
  // Simetría: I_x(a,b) = 1 − I_{1−x}(b,a) cuando converge mal
  return x < (a + 1) / (a + b + 2) ? result : 1 - regularizedIncompleteBeta(b, a, 1 - x);
}

function logGamma(z: number): number {
  // Aproximación de Lanczos
  const g = 7;
  const coefficients = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
    -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6,
    1.5056327351493116e-7,
  ];
  if (z < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  }
  const zz = z - 1;
  let x = coefficients[0]!;
  for (let i = 1; i < g + 2; i++) x += coefficients[i]! / (zz + i);
  const t = zz + g + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (zz + 0.5) * Math.log(t) - t + Math.log(x);
}

export function pearson(xs: (number | null)[], ys: (number | null)[]): CorrelationResult {
  const { x, y } = pairComplete(xs, ys);
  const n = x.length;
  if (n < 3) return { r: NaN, n, p: 1 };

  const mx = mean(x);
  const my = mean(y);
  let num = 0;
  let dx2 = 0;
  let dy2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i]! - mx;
    const dy = y[i]! - my;
    num += dx * dy;
    dx2 += dx * dx;
    dy2 += dy * dy;
  }
  if (dx2 === 0 || dy2 === 0) return { r: NaN, n, p: 1 };

  const r = num / Math.sqrt(dx2 * dy2);
  const clamped = Math.max(-0.999999, Math.min(0.999999, r));
  const t = clamped * Math.sqrt((n - 2) / (1 - clamped * clamped));
  return { r, n, p: studentTwoTailedP(t, n - 2) };
}
