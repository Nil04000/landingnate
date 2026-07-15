import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Beef,
  Coffee,
  Droplets,
  Dumbbell,
  Flame,
  Footprints,
  Moon,
  Scale,
  Smile,
} from 'lucide-react-native';
import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { brand } from '@/core/brand';
import { MetricCard, Screen, ScoreDial, Section } from '@/core/design-system/components';
import { STAGGER_MS, durations } from '@/core/design-system/tokens/motion';
import { palette } from '@/core/design-system/tokens/palette';

/**
 * Dashboard de Inicio.
 * FASE 1: datos de ejemplo estáticos para validar el sistema de diseño.
 * En Fase 2 cada card se conecta a React Query sobre daily_aggregates.
 */

type DemoMetric = {
  key: string;
  label: string;
  value: number | null;
  unit?: string;
  decimals?: number;
  color: string;
  icon: React.ReactNode;
  progress?: number;
  spark?: (number | null)[];
  trendPct?: number;
  trendGoodDirection?: 'up' | 'down';
};

const ICON_SIZE = 14;

const DEMO_METRICS: DemoMetric[] = [
  {
    key: 'weight',
    label: 'Peso',
    value: 82.4,
    unit: 'kg',
    decimals: 1,
    color: palette.metric.score,
    icon: <Scale color={palette.metric.score} size={ICON_SIZE} strokeWidth={2} />,
    spark: [83.6, 83.4, 83.1, 83.2, 82.9, 82.6, 82.4],
  },
  {
    key: 'steps',
    label: 'Pasos',
    value: 8432,
    color: palette.metric.activity,
    icon: <Footprints color={palette.metric.activity} size={ICON_SIZE} strokeWidth={2} />,
    progress: 0.84,
  },
  {
    key: 'sleep',
    label: 'Sueño',
    value: 7.3,
    unit: 'h',
    decimals: 1,
    color: palette.metric.sleep,
    icon: <Moon color={palette.metric.sleep} size={ICON_SIZE} strokeWidth={2} />,
    spark: [6.5, 7.1, 6.8, 7.9, 7.2, 6.9, 7.3],
  },
  {
    key: 'water',
    label: 'Agua',
    value: 1750,
    unit: 'ml',
    color: palette.metric.hydration,
    icon: <Droplets color={palette.metric.hydration} size={ICON_SIZE} strokeWidth={2} />,
    progress: 0.58,
  },
  {
    key: 'kcal',
    label: 'Calorías',
    value: 2140,
    unit: 'kcal',
    color: palette.metric.nutrition,
    icon: <Flame color={palette.metric.nutrition} size={ICON_SIZE} strokeWidth={2} />,
    progress: 0.82,
  },
  {
    key: 'protein',
    label: 'Proteína',
    value: 148,
    unit: 'g',
    color: palette.metric.nutrition,
    icon: <Beef color={palette.metric.nutrition} size={ICON_SIZE} strokeWidth={2} />,
    progress: 0.92,
  },
  {
    key: 'caffeine',
    label: 'Cafeína',
    value: 220,
    unit: 'mg',
    color: palette.metric.caffeine,
    icon: <Coffee color={palette.metric.caffeine} size={ICON_SIZE} strokeWidth={2} />,
    trendPct: -18,
    trendGoodDirection: 'down',
  },
  {
    key: 'training',
    label: 'Entrenamiento',
    value: 52,
    unit: 'min',
    color: palette.metric.training,
    icon: <Dumbbell color={palette.metric.training} size={ICON_SIZE} strokeWidth={2} />,
    trendPct: 12,
  },
  {
    key: 'mood',
    label: 'Ánimo',
    value: 4,
    unit: '/ 5',
    color: palette.metric.mood,
    icon: <Smile color={palette.metric.mood} size={ICON_SIZE} strokeWidth={2} />,
    spark: [3, 4, 3, 3, 4, 5, 4],
  },
];

export default function HomeScreen() {
  const today = format(new Date(), "EEEE d 'de' MMMM", { locale: es });

  return (
    <Screen>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(durations.base)} className="mb-6 mt-2">
        <Text className="text-footnote capitalize text-txt-dim">{today}</Text>
        <Text className="text-title1 text-txt">{brand.name}</Text>
      </Animated.View>

      {/* Health Score */}
      <Animated.View
        entering={FadeInDown.duration(durations.base).delay(STAGGER_MS)}
        className="mb-8 items-center"
      >
        <ScoreDial score={78} />
        <Text className="mt-3 text-footnote text-txt-dim">
          Datos de ejemplo — Fase 1 del roadmap
        </Text>
      </Animated.View>

      {/* Grilla de métricas */}
      <Section title="Hoy">
        <View className="flex-row flex-wrap justify-between">
          {DEMO_METRICS.map((m, i) => (
            <Animated.View
              key={m.key}
              entering={FadeInDown.duration(durations.base).delay((i + 2) * STAGGER_MS)}
              className="mb-3 w-[48.5%]"
            >
              <MetricCard
                label={m.label}
                value={m.value}
                unit={m.unit}
                decimals={m.decimals ?? 0}
                color={m.color}
                icon={m.icon}
                progress={m.progress ?? null}
                spark={m.spark ?? []}
                trendPct={m.trendPct ?? null}
                trendGoodDirection={m.trendGoodDirection ?? 'up'}
              />
            </Animated.View>
          ))}
        </View>
      </Section>
    </Screen>
  );
}
