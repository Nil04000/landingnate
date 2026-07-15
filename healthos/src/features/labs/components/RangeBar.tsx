import { View } from 'react-native';

import type { LabReferenceRange } from '@/core/db/repositories/labs.repository';
import { cn } from '@/core/design-system/cn';
import { palette } from '@/core/design-system/tokens/palette';

import { flagColor } from './format';

type RangeBarProps = {
  value: number;
  range: LabReferenceRange | null | undefined;
  /** Flag del resultado (colorea el marcador del valor). */
  flag: string | null | undefined;
  className?: string | undefined;
};

/**
 * Dominio visual de la barra: [low − 15%·span, high + 15%·span].
 * Si falta un borde del rango, se inventa con el 30% del otro o del valor.
 */
function domain(value: number, range: LabReferenceRange): [number, number] {
  let lo = range.low ?? range.optimalLow ?? null;
  let hi = range.high ?? range.optimalHigh ?? null;
  const pad30 = (anchor: number) => Math.abs(anchor) * 0.3 || 1;
  if (lo == null && hi == null) {
    lo = value - pad30(value);
    hi = value + pad30(value);
  } else if (lo == null) {
    lo = Math.min(value, hi!) - pad30(hi!);
  } else if (hi == null) {
    hi = Math.max(value, lo) + pad30(lo);
  }
  const span = hi! - lo! || 1;
  return [lo! - span * 0.15, hi! + span * 0.15];
}

/**
 * Barra horizontal de posición del valor contra su rango: pista surface-2,
 * banda de referencia (low..high) en tint, banda óptima en success y un
 * punto del color del flag con borde canvas. Views por % — sin Skia.
 */
export function RangeBar({ value, range, flag, className }: RangeBarProps) {
  if (!range) return null;

  const [d0, d1] = domain(value, range);
  const pct = (x: number) => Math.min(100, Math.max(0, ((x - d0) / (d1 - d0)) * 100));

  const refStart = range.low != null || range.high != null ? pct(range.low ?? d0) : null;
  const refEnd = refStart != null ? pct(range.high ?? d1) : null;

  const hasOptimal = range.optimalLow != null || range.optimalHigh != null;
  const optStart = hasOptimal ? pct(range.optimalLow ?? range.low ?? d0) : null;
  const optEnd = hasOptimal ? pct(range.optimalHigh ?? range.high ?? d1) : null;

  return (
    <View className={cn('h-2.5 justify-center', className)}>
      <View className="h-1.5 overflow-hidden rounded-full bg-surface-2">
        {refStart != null && refEnd != null ? (
          <View
            className="absolute bottom-0 top-0 rounded-full bg-tint/25"
            style={{ left: `${refStart}%`, width: `${Math.max(refEnd - refStart, 1)}%` }}
          />
        ) : null}
        {optStart != null && optEnd != null ? (
          <View
            className="absolute bottom-0 top-0 rounded-full bg-success/35"
            style={{ left: `${optStart}%`, width: `${Math.max(optEnd - optStart, 1)}%` }}
          />
        ) : null}
      </View>
      <View
        className="absolute h-2.5 w-2.5 rounded-full"
        style={{
          left: `${pct(value)}%`,
          marginLeft: -5,
          backgroundColor: flagColor(flag),
          borderWidth: 1.5,
          borderColor: palette.canvas,
        }}
      />
    </View>
  );
}
