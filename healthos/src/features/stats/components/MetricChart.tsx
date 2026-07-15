import { matchFont } from '@shopify/react-native-skia';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useMemo } from 'react';
import { Platform, View } from 'react-native';
import { Bar, CartesianChart, Line } from 'victory-native';

import { palette } from '@/core/design-system/tokens/palette';
import { fromLocalDate } from '@/core/lib/dates';
import type { MetricPoint, StatsPeriod } from '@/queries/useStats';

const font = matchFont({
  fontFamily: Platform.select({ ios: 'Helvetica Neue', default: 'sans-serif' }),
  fontSize: 10,
});

type MetricChartProps = {
  points: MetricPoint[];
  period: StatsPeriod;
  color: string;
  /** 'bar' para acumulables (volumen semanal); 'line' para niveles */
  mode?: 'line' | 'bar' | undefined;
  height?: number | undefined;
};

function shortLabel(key: string, period: StatsPeriod): string {
  if (period === 'D') return format(fromLocalDate(key), 'd/M');
  if (period === 'S') return key.slice(5).replace('W', 'S');
  if (period === 'M') return format(fromLocalDate(`${key}-01`), 'MMM', { locale: es });
  return key;
}

/**
 * Gráfico cartesiano de una métrica (Victory Native XL sobre Skia).
 * Los huecos (null) se omiten manteniendo la posición temporal en X.
 */
export function MetricChart({ points, period, color, mode = 'line', height = 180 }: MetricChartProps) {
  const { data, labels } = useMemo(() => {
    const labelMap = new Map<number, string>();
    const rows: { x: number; y: number }[] = [];
    points.forEach((p, i) => {
      labelMap.set(i, shortLabel(p.key, period));
      if (p.value != null) rows.push({ x: i, y: p.value });
    });
    return { data: rows, labels: labelMap };
  }, [points, period]);

  if (data.length === 0) {
    return <View style={{ height }} />;
  }

  return (
    <View style={{ height }}>
      <CartesianChart
        data={data}
        xKey="x"
        yKeys={['y']}
        domainPadding={{ left: 12, right: 12, top: 16, bottom: 4 }}
        axisOptions={{
          font,
          labelColor: palette.text.tertiary,
          lineColor: palette.stroke,
          tickCount: { x: Math.min(5, data.length), y: 4 },
          formatXLabel: (x) => labels.get(Math.round(x as number)) ?? '',
        }}
      >
        {({ points: chartPoints, chartBounds }) =>
          mode === 'bar' ? (
            <Bar
              points={chartPoints.y}
              chartBounds={chartBounds}
              color={color}
              roundedCorners={{ topLeft: 4, topRight: 4 }}
              barWidth={Math.max(6, 200 / data.length)}
            />
          ) : (
            <Line
              points={chartPoints.y}
              color={color}
              strokeWidth={2.5}
              curveType="monotoneX"
              connectMissingData
              animate={{ type: 'timing', duration: 300 }}
            />
          )
        }
      </CartesianChart>
    </View>
  );
}
