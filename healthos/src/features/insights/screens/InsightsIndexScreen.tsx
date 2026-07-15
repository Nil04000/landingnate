import { router } from 'expo-router';
import { ChevronLeft, Lightbulb } from 'lucide-react-native';
import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { EmptyState, PressableScale, Screen } from '@/core/design-system/components';
import { durations, STAGGER_MS } from '@/core/design-system/tokens/motion';
import { palette } from '@/core/design-system/tokens/palette';
import { useInsightsList } from '@/queries/useInsights';

import { InsightCard } from '../components/InsightCard';

/** Todos los insights vigentes, ordenados por relevancia. */
export default function InsightsIndexScreen() {
  const { data: insights } = useInsightsList(100);

  return (
    <Screen>
      <View className="mb-5 mt-1 flex-row items-center gap-2">
        <PressableScale onPress={() => router.back()}>
          <View className="h-9 w-9 items-center justify-center rounded-full bg-surface-2">
            <ChevronLeft color="#F5F5F7" size={20} strokeWidth={2} />
          </View>
        </PressableScale>
        <Text className="text-title2 text-txt">Insights</Text>
        {insights && insights.length > 0 ? (
          <Text className="text-footnote text-txt-faint">({insights.length})</Text>
        ) : null}
      </View>

      {!insights || insights.length === 0 ? (
        <EmptyState
          icon={<Lightbulb color={palette.text.tertiary} size={32} strokeWidth={1.5} />}
          title="Todavía no hay patrones"
          subtitle="Con ~2 semanas de registros, la app empieza a detectar correlaciones, tendencias y rachas automáticamente."
        />
      ) : (
        <View className="gap-3">
          {insights.map((insight, i) => (
            <Animated.View
              key={insight.id}
              entering={FadeInDown.duration(durations.base).delay(Math.min(i, 8) * STAGGER_MS)}
            >
              <InsightCard insight={insight} />
            </Animated.View>
          ))}
        </View>
      )}
    </Screen>
  );
}
