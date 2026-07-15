import { Canvas, Circle, Path, Rect, Skia } from '@shopify/react-native-skia';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Text, View } from 'react-native';

import type { LabReferenceRange, LabResult } from '@/core/db/repositories/labs.repository';
import { palette } from '@/core/design-system/tokens/palette';

import { flagColor, formatLabValue } from './format';

const PAD_X = 10;

type MarkerChartProps = {
  /** Historial ascendente por fecha (como lo devuelve markerHistory). */
  history: (LabResult & { collectedAt: number })[];
  range: LabReferenceRange | null | undefined;
  width: number;
  height?: number | undefined;
};

/**
 * Gráfico Skia de la evolución de un marcador: línea con un punto por
 * resultado (color del flag), banda de referencia (tint α0.12) y banda
 * óptima (success α0.15) detrás. Labels min/max del eje Y como Text RN
 * posicionado; fechas primera/última abajo. Con <2 puntos: punto + bandas.
 */
export function MarkerChart({ history, range, width, height = 160 }: MarkerChartProps) {
  const values = history.map((h) => h.value);
  if (values.length === 0) return null;

  const bandBounds = [range?.low, range?.high, range?.optimalLow, range?.optimalHigh].filter(
    (b): b is number => b != null,
  );
  const dMin = Math.min(...values, ...bandBounds);
  const dMax = Math.max(...values, ...bandBounds);
  const pad = (dMax - dMin || Math.abs(dMax) * 0.2 || 1) * 0.12;
  const yMin = dMin - pad;
  const yMax = dMax + pad;

  const y = (v: number) => ((yMax - v) / (yMax - yMin)) * height;
  const x = (i: number) =>
    history.length < 2 ? width / 2 : PAD_X + (i / (history.length - 1)) * (width - PAD_X * 2);

  const path = Skia.Path.Make();
  history.forEach((h, i) => {
    if (i === 0) path.moveTo(x(i), y(h.value));
    else path.lineTo(x(i), y(h.value));
  });

  const refBand =
    range && (range.low != null || range.high != null)
      ? { top: y(range.high ?? yMax), bottom: y(range.low ?? yMin) }
      : null;
  const optBand =
    range && (range.optimalLow != null || range.optimalHigh != null)
      ? {
          top: y(range.optimalHigh ?? range.high ?? yMax),
          bottom: y(range.optimalLow ?? range.low ?? yMin),
        }
      : null;

  const first = history[0];
  const last = history[history.length - 1];
  const monthOf = (ms: number) => format(new Date(ms), 'MMM yyyy', { locale: es });

  return (
    <View style={{ width }}>
      <View style={{ width, height }}>
        <Canvas style={{ width, height }}>
          {refBand ? (
            <Rect
              x={0}
              y={refBand.top}
              width={width}
              height={Math.max(refBand.bottom - refBand.top, 0)}
              color={`${palette.tint}1F`}
            />
          ) : null}
          {optBand ? (
            <Rect
              x={0}
              y={optBand.top}
              width={width}
              height={Math.max(optBand.bottom - optBand.top, 0)}
              color={`${palette.success}26`}
            />
          ) : null}
          {history.length >= 2 ? (
            <Path
              path={path}
              color={palette.metric.labs}
              style="stroke"
              strokeWidth={2}
              strokeJoin="round"
              strokeCap="round"
            />
          ) : null}
          {history.map((h, i) => (
            <Circle key={h.id} cx={x(i)} cy={y(h.value)} r={5.5} color={palette.surface} />
          ))}
          {history.map((h, i) => (
            <Circle key={h.id} cx={x(i)} cy={y(h.value)} r={3.5} color={flagColor(h.flag)} />
          ))}
        </Canvas>

        <Text
          className="absolute left-0 top-0.5 text-caption text-txt-faint"
          style={{ fontVariant: ['tabular-nums'] }}
        >
          {formatLabValue(dMax)}
        </Text>
        <Text
          className="absolute bottom-0.5 left-0 text-caption text-txt-faint"
          style={{ fontVariant: ['tabular-nums'] }}
        >
          {formatLabValue(dMin)}
        </Text>
      </View>

      <View
        className={`mt-2 flex-row ${history.length < 2 ? 'justify-center' : 'justify-between'}`}
      >
        {first ? <Text className="text-caption text-txt-faint">{monthOf(first.collectedAt)}</Text> : null}
        {history.length >= 2 && last ? (
          <Text className="text-caption text-txt-faint">{monthOf(last.collectedAt)}</Text>
        ) : null}
      </View>
    </View>
  );
}
