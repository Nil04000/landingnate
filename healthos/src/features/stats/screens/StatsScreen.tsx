import { router } from 'expo-router';
import { ChevronRight, FlaskConical } from 'lucide-react-native';
import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import type { DailyAggregate } from '@/core/db/repositories/aggregates.repository';
import { Card, ListRow, PressableScale, Screen, Section, Sparkline } from '@/core/design-system/components';
import { haptic } from '@/core/design-system/haptics';
import { durations, STAGGER_MS } from '@/core/design-system/tokens/motion';
import { palette } from '@/core/design-system/tokens/palette';
import { METRIC_GROUPS, METRICS, type MetricDef } from '@/features/stats/metrics';
import { useStatsHub } from '@/queries/useStats';

/** Hub de Estadísticas: todas las métricas con sparkline 14d + Laboratorios. */
export default function StatsScreen() {
  const { data: days } = useStatsHub();

  return (
    <Screen>
      <View className="mb-6 mt-2">
        <Text className="text-title1 text-txt">Estadísticas</Text>
      </View>

      <Animated.View entering={FadeInDown.duration(durations.base)}>
        <Section title="Salud">
          <Card flush className="px-4">
            <ListRow
              title="Laboratorios"
              subtitle="Análisis de sangre: historial, rangos y tendencias"
              leading={
                <View className="h-9 w-9 items-center justify-center rounded-full bg-surface-2">
                  <FlaskConical color={palette.metric.labs} size={16} strokeWidth={1.8} />
                </View>
              }
              trailing={<ChevronRight color={palette.text.tertiary} size={18} strokeWidth={2} />}
              onPress={() => router.push('/labs')}
            />
          </Card>
        </Section>
      </Animated.View>

      {METRIC_GROUPS.map((group, gi) => {
        const groupMetrics = METRICS.filter((m) => m.group === group.key);
        return (
          <Animated.View
            key={group.key}
            entering={FadeInDown.duration(durations.base).delay((gi + 1) * STAGGER_MS)}
          >
            <Section title={group.label}>
              <Card flush className="px-4">
                {groupMetrics.map((metric, i) => (
                  <View key={metric.key} className={i > 0 ? 'border-t border-separator/50' : ''}>
                    <MetricRow metric={metric} days={days ?? []} />
                  </View>
                ))}
              </Card>
            </Section>
          </Animated.View>
        );
      })}
    </Screen>
  );
}

function MetricRow({ metric, days }: { metric: MetricDef; days: (DailyAggregate | null)[] }) {
  const values = days.map((d) => (d ? metric.getValue(d) : null));
  const last = [...values].reverse().find((v) => v != null) ?? null;

  return (
    <PressableScale
      onPress={() => {
        haptic.select();
        router.push(`/stats/${metric.key}`);
      }}
    >
      <View className="flex-row items-center justify-between py-3">
        <View className="flex-1">
          <Text className="text-body text-txt">{metric.label}</Text>
          <Text
            className="mt-0.5 text-footnote text-txt-dim"
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {last != null ? metric.format(last) : 'Sin datos'}
          </Text>
        </View>
        <Sparkline values={values} color={metric.color} width={84} height={30} />
        <ChevronRight color={palette.text.tertiary} size={16} strokeWidth={2} className="ml-2" />
      </View>
    </PressableScale>
  );
}
