import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { router, type Href } from 'expo-router';
import {
  Beef,
  CalendarDays,
  Coffee,
  Droplets,
  Dumbbell,
  Flame,
  Footprints,
  Moon,
  Scale,
  Settings2,
  Smile,
} from 'lucide-react-native';
import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { brand } from '@/core/brand';
import { MetricCard, PressableScale, Screen, ScoreDial, Section } from '@/core/design-system/components';
import { haptic } from '@/core/design-system/haptics';
import { STAGGER_MS, durations } from '@/core/design-system/tokens/motion';
import { palette } from '@/core/design-system/tokens/palette';
import { todayLocal } from '@/core/lib/dates';
import { defaultGoals } from '@/core/lib/defaults';
import type { DailyAggregate } from '@/core/db/repositories/aggregates.repository';
import { InsightCard } from '@/features/insights/components/InsightCard';
import { useDayAggregate, useLast7Days, useLatestWeight } from '@/queries/useDay';
import { useInsightsList } from '@/queries/useInsights';

const ICON_SIZE = 14;

type CardSpec = {
  key: string;
  label: string;
  value: number | null;
  unit?: string;
  decimals?: number;
  color: string;
  icon: React.ReactNode;
  progress?: number | null;
  spark?: (number | null)[];
  href?: string;
};

function sparkOf(
  days: (DailyAggregate | null)[] | undefined,
  pick: (d: DailyAggregate) => number | null,
): (number | null)[] {
  return (days ?? []).map((d) => (d ? pick(d) : null));
}

/** Dashboard de Inicio conectado a daily_aggregates (hoy + sparklines 7d). */
export default function HomeScreen() {
  const today = todayLocal();
  const { data: agg } = useDayAggregate(today);
  const { data: week } = useLast7Days();
  const { data: latestWeight } = useLatestWeight();
  const { data: topInsights } = useInsightsList(2);

  const cards: CardSpec[] = [
    {
      key: 'weight',
      label: 'Peso',
      value: latestWeight?.weightKg ?? null,
      unit: 'kg',
      decimals: 1,
      color: palette.metric.score,
      icon: <Scale color={palette.metric.score} size={ICON_SIZE} strokeWidth={2} />,
      spark: sparkOf(week, (d) => d.weightKg),
      href: '/log-weight',
    },
    {
      key: 'steps',
      label: 'Pasos',
      value: agg?.steps ?? null,
      color: palette.metric.activity,
      icon: <Footprints color={palette.metric.activity} size={ICON_SIZE} strokeWidth={2} />,
      progress: agg?.steps != null ? agg.steps / defaultGoals.stepsPerDay : null,
      href: '/log-steps',
    },
    {
      key: 'sleep',
      label: 'Sueño',
      value: agg?.sleepMinutes != null ? agg.sleepMinutes / 60 : null,
      unit: 'h',
      decimals: 1,
      color: palette.metric.sleep,
      icon: <Moon color={palette.metric.sleep} size={ICON_SIZE} strokeWidth={2} />,
      spark: sparkOf(week, (d) => (d.sleepMinutes != null ? d.sleepMinutes / 60 : null)),
      href: '/log-sleep',
    },
    {
      key: 'water',
      label: 'Agua',
      value: agg?.waterMl ?? null,
      unit: 'ml',
      color: palette.metric.hydration,
      icon: <Droplets color={palette.metric.hydration} size={ICON_SIZE} strokeWidth={2} />,
      progress: agg?.waterMl != null ? agg.waterMl / defaultGoals.waterMlPerDay : null,
      href: '/log-water',
    },
    {
      key: 'kcal',
      label: 'Calorías',
      value: agg?.kcal ?? null,
      unit: 'kcal',
      color: palette.metric.nutrition,
      icon: <Flame color={palette.metric.nutrition} size={ICON_SIZE} strokeWidth={2} />,
    },
    {
      key: 'protein',
      label: 'Proteína',
      value: agg?.proteinG ?? null,
      unit: 'g',
      color: palette.metric.nutrition,
      icon: <Beef color={palette.metric.nutrition} size={ICON_SIZE} strokeWidth={2} />,
    },
    {
      key: 'caffeine',
      label: 'Cafeína',
      value: agg?.caffeineMg ?? null,
      unit: 'mg',
      color: palette.metric.caffeine,
      icon: <Coffee color={palette.metric.caffeine} size={ICON_SIZE} strokeWidth={2} />,
      spark: sparkOf(week, (d) => d.caffeineMg),
      href: '/log-caffeine',
    },
    {
      key: 'training',
      label: 'Entrenamiento',
      value: agg?.workoutCount ? agg.workoutMinutes : null,
      unit: 'min',
      color: palette.metric.training,
      icon: <Dumbbell color={palette.metric.training} size={ICON_SIZE} strokeWidth={2} />,
    },
    {
      key: 'mood',
      label: 'Ánimo',
      value: agg?.mood ?? null,
      unit: '/ 5',
      decimals: 1,
      color: palette.metric.mood,
      icon: <Smile color={palette.metric.mood} size={ICON_SIZE} strokeWidth={2} />,
      spark: sparkOf(week, (d) => d.mood),
      href: '/log-wellbeing',
    },
  ];

  return (
    <Screen>
      <Animated.View
        entering={FadeInDown.duration(durations.base)}
        className="mb-6 mt-2 flex-row items-end justify-between"
      >
        <View>
          <Text className="text-footnote capitalize text-txt-dim">
            {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
          </Text>
          <Text className="text-title1 text-txt">{brand.name}</Text>
        </View>
        <View className="flex-row gap-2">
          <PressableScale
            onPress={() => {
              haptic.select();
              router.push('/calendar');
            }}
          >
            <View className="h-9 w-9 items-center justify-center rounded-full bg-surface-2">
              <CalendarDays color="#A1A1AA" size={18} strokeWidth={1.8} />
            </View>
          </PressableScale>
          <PressableScale
            onPress={() => {
              haptic.select();
              router.push('/settings');
            }}
          >
            <View className="h-9 w-9 items-center justify-center rounded-full bg-surface-2">
              <Settings2 color="#A1A1AA" size={18} strokeWidth={1.8} />
            </View>
          </PressableScale>
        </View>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.duration(durations.base).delay(STAGGER_MS)}
        className="mb-8 items-center"
      >
        <PressableScale
          onPress={() => {
            haptic.select();
            router.push(`/score/${today}`);
          }}
        >
          <ScoreDial score={agg?.healthScore ?? null} />
        </PressableScale>
        {agg?.healthScore == null ? (
          <Text className="mt-3 text-footnote text-txt-dim">
            Registrá sueño, agua, actividad y ánimo para activar tu Health Score
          </Text>
        ) : (
          <Text className="mt-3 text-footnote text-txt-faint">Tocá el dial para ver el porqué</Text>
        )}
      </Animated.View>

      {topInsights && topInsights.length > 0 ? (
        <Animated.View entering={FadeInDown.duration(durations.base).delay(2 * STAGGER_MS)}>
          <Section
            title="Insights"
            trailing={
              <PressableScale onPress={() => router.push('/insights')}>
                <Text className="text-footnote text-tint">Ver todos</Text>
              </PressableScale>
            }
          >
            <View className="gap-2">
              {topInsights.map((insight) => (
                <InsightCard key={insight.id} insight={insight} compact />
              ))}
            </View>
          </Section>
        </Animated.View>
      ) : null}

      <Section title="Hoy">
        <View className="flex-row flex-wrap justify-between">
          {cards.map((card, i) => (
            <Animated.View
              key={card.key}
              entering={FadeInDown.duration(durations.base).delay((i + 2) * STAGGER_MS)}
              className="mb-3 w-[48.5%]"
            >
              <MetricCard
                label={card.label}
                value={card.value}
                unit={card.unit}
                decimals={card.decimals ?? 0}
                color={card.color}
                icon={card.icon}
                progress={card.progress ?? null}
                spark={card.spark ?? []}
                onPress={
                  card.href
                    ? () => router.push({ pathname: card.href, params: { date: today } } as Href)
                    : undefined
                }
              />
            </Animated.View>
          ))}
        </View>
      </Section>
    </Screen>
  );
}
