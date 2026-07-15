import { mean, studentTwoTailedP, variance } from './pearson';

export type WelchResult = {
  meanA: number;
  meanB: number;
  nA: number;
  nB: number;
  t: number;
  df: number;
  p: number;
  /** d de Cohen (pooled) — tamaño de efecto para los umbrales del catálogo */
  cohenD: number;
};

/**
 * t de Welch entre dos muestras independientes (varianzas desiguales).
 * Usado por las reglas threshold: "días con >450 mg de cafeína vs el resto".
 */
export function welch(a: number[], b: number[]): WelchResult | null {
  const nA = a.length;
  const nB = b.length;
  if (nA < 2 || nB < 2) return null;

  const meanA = mean(a);
  const meanB = mean(b);
  const varA = variance(a);
  const varB = variance(b);
  if (!Number.isFinite(varA) || !Number.isFinite(varB)) return null;

  const seA = varA / nA;
  const seB = varB / nB;
  const se = Math.sqrt(seA + seB);
  if (se === 0) return null;

  const t = (meanA - meanB) / se;
  const df = (seA + seB) ** 2 / ((seA * seA) / (nA - 1) + (seB * seB) / (nB - 1));

  const pooledSd = Math.sqrt(((nA - 1) * varA + (nB - 1) * varB) / (nA + nB - 2));
  const cohenD = pooledSd > 0 ? (meanA - meanB) / pooledSd : 0;

  return { meanA, meanB, nA, nB, t, df, p: studentTwoTailedP(t, df), cohenD };
}
