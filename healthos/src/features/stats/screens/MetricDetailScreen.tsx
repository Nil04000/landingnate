import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Flame, Trophy } from 'lucide-react-native';
import { useState } from 'react';
import { Text, View } from 'react-native';

import {
  Card,
  EmptyState,
  PressableScale,
  Screen,
  Section,
  SegmentedControl,
  TrendBadge,
} from '@/core/design-system/components';
import { palette } from '@/core/design-system/tokens/palette';
import { fromLocalDate } from '@/core/lib/dates';
import { metricByKey } from '@/features/stats/metrics';
import { PERIOD_OPTIONS, useMetricDetail, type StatsPeriod } from '@/queries/useStats';

import { MetricChart } from '../components/MetricChart';

/** Detalle de métrica: gráfico D/S/M/A + promedios, récords y rachas. */
export default function MetricDetailScreen() {
  const params = useLocalSearchParams<{ metric: string }>();
  const metric = metricByKey(params.metric ?? '');
  const [period, setPeriod] = useState<StatsPeriod>('D');
  const { data } = useMetricDetail(params.metric ?? '', period);

  if (!metric) {
    return (
      <Screen scroll={false} className="justify-center">
        <EmptyState title="Métrica desconocida" />
      </Screen>
    );
  }

  const fmt = (v: number | null | undefined) => (v == null ? '—' : metric.format(v));

  return (
    <Screen>
      <View className="mb-4 mt-1 flex-row items-center gap-2">
        <PressableScale onPress={() => router.back()}>
          <View className="h-9 w-9 items-center justify-center rounded-full bg-surface-2">
            <ChevronLeft color="#F5F5F7" size={20} strokeWidth={2} />
          </View>
        </PressableScale>
        <Text className="text-title2 text-txt">{metric.label}</Text>
      </View>

      <View className="mb-4 flex-row items-end justify-between">
        <View>
          <Text className="text-caption uppercase text-txt-faint">Último registro</Text>
          <Text className="text-title1 text-txt" style={{ fontVariant: ['tabular-nums'] }}>
            {fmt(data?.lastValue)}
          </Text>
        </View>
        {data?.trendPct != null ? (
          <View className="items-end pb-1">
            <TrendBadge
              pct={data.trendPct}
              goodDirection={metric.goodDirection === 'down' ? 'down' : 'up'}
            />
            <Text className="mt-1 text-caption text-txt-faint">vs. período anterior</Text>
          </View>
        ) : null}
      </View>

      <View className="mb-4">
        <SegmentedControl options={PERIOD_OPTIONS} selected={period} onChange={setPeriod} />
      </View>

      <Card flush className="mb-6 px-2 py-3">
        {data && data.points.some((p) => p.value != null) ? (
          <MetricChart
            points={data.points}
            period={period}
            color={metric.color}
            mode={metric.bucket === 'sum' && period !== 'D' ? 'bar' : 'line'}
          />
        ) : (
          <EmptyState title="Sin datos en este período" subtitle="Registrá para ver la curva." />
        )}
      </Card>

      <Section title="Resumen del período">
        <Card flush className="flex-row flex-wrap p-2">
          <Stat label="Promedio" value={fmt(data?.mean)} />
          <Stat
            label="Mínimo"
            value={fmt(data?.min?.value)}
            sub={data?.min ? format(fromLocalDate(data.min.day), 'd MMM', { locale: es }) : undefined}
          />
          <Stat
            label="Máximo"
            value={fmt(data?.max?.value)}
            sub={data?.max ? format(fromLocalDate(data.max.day), 'd MMM', { locale: es }) : undefined}
          />
          <Stat label="Días con datos" value={String(data?.daysWithData ?? 0)} />
        </Card>
      </Section>

      {data?.streak && metric.goal ? (
        <Section title="Rachas (vs. objetivo)">
          <Card flush className="flex-row p-2">
            <View className="w-1/2 items-center py-3">
              <View className="flex-row items-center gap-1.5">
                <Flame color={palette.metric.activity} size={16} strokeWidth={2} />
                <Text className="text-title2 text-txt" style={{ fontVariant: ['tabular-nums'] }}>
                  {data.streak.current}
                </Text>
              </View>
              <Text className="mt-0.5 text-caption uppercase text-txt-faint">Racha actual</Text>
            </View>
            <View className="w-1/2 items-center py-3">
              <View className="flex-row items-center gap-1.5">
                <Trophy color={palette.metric.score} size={16} strokeWidth={2} />
                <Text className="text-title2 text-txt" style={{ fontVariant: ['tabular-nums'] }}>
                  {data.streak.best}
                </Text>
              </View>
              <Text className="mt-0.5 text-caption uppercase text-txt-faint">Mejor racha</Text>
            </View>
          </Card>
        </Section>
      ) : null}
    </Screen>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string | undefined }) {
  return (
    <View className="w-1/2 items-center py-3">
      <Text className="text-headline text-txt" style={{ fontVariant: ['tabular-nums'] }}>
        {value}
      </Text>
      <Text className="mt-0.5 text-caption uppercase text-txt-faint">
        {label}
        {sub ? ` · ${sub}` : ''}
      </Text>
    </View>
  );
}
