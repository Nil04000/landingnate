import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Card, PressableScale, Screen, ScoreDial, Section } from '@/core/design-system/components';
import { durations, STAGGER_MS } from '@/core/design-system/tokens/motion';
import { scoreColor } from '@/core/design-system/tokens/palette';
import { formatDecimal } from '@/core/lib/format';
import { fromLocalDate, todayLocal } from '@/core/lib/dates';
import { COMPONENT_LABELS, type ScoreComponent } from '@/features/health-score/engine/types';
import { useScoreBreakdown, useYesterdayScore } from '@/queries/useScore';

/** Desglose del Health Score: contribuciones por componente + razones. */
export default function ScoreBreakdownScreen() {
  const params = useLocalSearchParams<{ date?: string }>();
  const date = params.date ?? todayLocal();

  const { data: breakdown } = useScoreBreakdown(date);
  const { data: yesterdayScore } = useYesterdayScore(date);

  if (!breakdown) return <Screen scroll={false}>{null}</Screen>;

  const available = breakdown.components.filter((c) => c.available && c.score != null);
  const sortedByContribution = [...available].sort((a, b) => b.contribution - a.contribution);

  // Top razones por |impacto| a través de todos los componentes
  const allReasons = available
    .flatMap((c) => c.reasons.map((r) => ({ ...r, component: c.key })))
    .filter((r) => r.impact !== 0)
    .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
    .slice(0, 6);

  const delta =
    breakdown.score != null && yesterdayScore != null ? breakdown.score - yesterdayScore : null;

  return (
    <Screen>
      <View className="mb-4 mt-1 flex-row items-center gap-2">
        <PressableScale onPress={() => router.back()}>
          <View className="h-9 w-9 items-center justify-center rounded-full bg-surface-2">
            <ChevronLeft color="#F5F5F7" size={20} strokeWidth={2} />
          </View>
        </PressableScale>
        <Text className="text-title2 capitalize text-txt">
          {format(fromLocalDate(date), "EEEE d 'de' MMMM", { locale: es })}
        </Text>
      </View>

      <Animated.View entering={FadeInDown.duration(durations.base)} className="mb-2 items-center">
        <ScoreDial score={breakdown.score} />
        {delta != null && delta !== 0 ? (
          <Text
            className={`mt-3 text-subhead ${delta > 0 ? 'text-success' : 'text-danger'}`}
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {delta > 0 ? '▲' : '▼'} {Math.abs(delta)} puntos vs. ayer
          </Text>
        ) : breakdown.score == null ? (
          <Text className="mt-3 px-8 text-center text-footnote text-txt-dim">
            Datos insuficientes: registrá al menos 3 áreas (sueño, agua, actividad, ánimo…) para
            calcular el score del día.
          </Text>
        ) : null}
      </Animated.View>

      {available.length > 0 ? (
        <Animated.View entering={FadeInDown.duration(durations.base).delay(STAGGER_MS)}>
          <Section title="Contribución por componente">
            <Card>
              <View className="gap-3.5">
                {sortedByContribution.map((component) => (
                  <ComponentBar key={component.key} component={component} />
                ))}
              </View>
            </Card>
          </Section>
        </Animated.View>
      ) : null}

      {allReasons.length > 0 ? (
        <Animated.View entering={FadeInDown.duration(durations.base).delay(2 * STAGGER_MS)}>
          <Section title="Por qué">
            <Card flush className="px-4">
              {allReasons.map((reason, i) => (
                <View
                  key={`${reason.component}-${reason.code}-${i}`}
                  className={`flex-row items-center justify-between py-3 ${i > 0 ? 'border-t border-separator/50' : ''}`}
                >
                  <View className="flex-1 pr-3">
                    <Text className="text-caption uppercase text-txt-faint">
                      {COMPONENT_LABELS[reason.component]}
                    </Text>
                    <Text className="mt-0.5 text-subhead text-txt">{reason.text}</Text>
                  </View>
                  <Text
                    className={`text-headline ${reason.impact < 0 ? 'text-danger' : 'text-success'}`}
                    style={{ fontVariant: ['tabular-nums'] }}
                  >
                    {reason.impact > 0 ? '+' : ''}
                    {formatDecimal(reason.impact, Math.abs(reason.impact) < 10 ? 1 : 0)}
                  </Text>
                </View>
              ))}
            </Card>
          </Section>
        </Animated.View>
      ) : null}

      <Text className="px-1 text-footnote text-txt-faint">
        Los componentes sin datos no restan: se excluyen y el resto se repondera. Los impactos
        están en puntos del componente (peso {'≠'} 1).
      </Text>
    </Screen>
  );
}

function ComponentBar({ component }: { component: ScoreComponent }) {
  const color = scoreColor(component.score);
  const widthPct = Math.max(2, component.score ?? 0);
  return (
    <View>
      <View className="mb-1 flex-row items-baseline justify-between">
        <Text className="text-subhead text-txt">{COMPONENT_LABELS[component.key]}</Text>
        <View className="flex-row items-baseline gap-2">
          {component.deltaVs7dAvg != null && Math.abs(component.deltaVs7dAvg) >= 3 ? (
            <Text
              className={`text-caption ${component.deltaVs7dAvg > 0 ? 'text-success' : 'text-danger'}`}
            >
              {component.deltaVs7dAvg > 0 ? '▲' : '▼'} {Math.abs(Math.round(component.deltaVs7dAvg))} vs 7d
            </Text>
          ) : null}
          <Text className="text-headline text-txt" style={{ fontVariant: ['tabular-nums'] }}>
            {Math.round(component.score ?? 0)}
          </Text>
        </View>
      </View>
      <View className="h-1.5 overflow-hidden rounded-full bg-surface-2">
        <View
          style={{ width: `${widthPct}%`, backgroundColor: color }}
          className="h-full rounded-full"
        />
      </View>
      <Text className="mt-1 text-caption text-txt-faint">
        peso {Math.round(component.weight * 100)}% · aporta {formatDecimal(component.contribution, 1)} pts
      </Text>
    </View>
  );
}
