import type { LabFlag } from '@/core/db/repositories/labs.repository';
import { palette } from '@/core/design-system/tokens/palette';

/** Etiquetas es-AR por flag. */
export const FLAG_LABELS: Record<LabFlag, string> = {
  optimal: 'Óptimo',
  in_range: 'En rango',
  low: 'Bajo',
  high: 'Alto',
};

/** Color canónico por flag (RangeBar, puntos del gráfico, badges). */
export const FLAG_COLORS: Record<LabFlag, string> = {
  optimal: palette.success,
  in_range: palette.tint,
  low: palette.warning,
  high: palette.danger,
};

export function isLabFlag(flag: string | null | undefined): flag is LabFlag {
  return flag === 'optimal' || flag === 'in_range' || flag === 'low' || flag === 'high';
}

/** Color del flag; sin flag (sin rango) → terciario. */
export function flagColor(flag: string | null | undefined): string {
  return isLabFlag(flag) ? FLAG_COLORS[flag] : palette.text.tertiary;
}

/**
 * Valor de laboratorio es-AR: decimales según magnitud (92 → "92",
 * 4,5 → "4,5", 0,85 → "0,85"), sin ceros de cola.
 */
export function formatLabValue(value: number): string {
  const abs = Math.abs(value);
  const decimals = Number.isInteger(value) ? 0 : abs >= 100 ? 0 : abs >= 10 ? 1 : 2;
  let fixed = value.toFixed(decimals);
  if (decimals > 0) fixed = fixed.replace(/0+$/, '').replace(/\.$/, '');
  return fixed.replace('.', ',');
}

/** Acepta coma decimal es-AR ("12,5"). Vacío o inválido → undefined. */
export function parseDecimal(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const value = Number(trimmed.replace(',', '.'));
  return Number.isFinite(value) ? value : undefined;
}
