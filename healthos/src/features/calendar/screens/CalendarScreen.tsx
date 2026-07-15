import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { Card, HeatmapCalendar, PressableScale, Screen, Section } from '@/core/design-system/components';
import { scoreRamp } from '@/core/design-system/tokens/palette';
import { addDaysLocal, todayLocal } from '@/core/lib/dates';
import { useScoreRange } from '@/queries/useScore';

const WEEKS = 26;

/** Calendario estilo GitHub coloreado por Health Score. */
export default function CalendarScreen() {
  const today = todayLocal();
  const from = addDaysLocal(today, -7 * WEEKS);
  const { data: scores } = useScoreRange(from, today);

  return (
    <Screen>
      <View className="mb-6 mt-1 flex-row items-center gap-2">
        <PressableScale onPress={() => router.back()}>
          <View className="h-9 w-9 items-center justify-center rounded-full bg-surface-2">
            <ChevronLeft color="#F5F5F7" size={20} strokeWidth={2} />
          </View>
        </PressableScale>
        <Text className="text-title2 text-txt">Calendario</Text>
      </View>

      <Section title="Últimos 6 meses">
        <Card>
          <HeatmapCalendar
            scores={scores ?? {}}
            weeks={WEEKS}
            onDayPress={(day) => router.push(`/day/${day}`)}
          />
          <View className="mt-4 flex-row items-center justify-end gap-1.5">
            <Text className="mr-1 text-caption text-txt-faint">Peor</Text>
            {[scoreRamp.none, ...scoreRamp.bands.map((b) => b.color)].map((color) => (
              <View key={color} style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: color }} />
            ))}
            <Text className="ml-1 text-caption text-txt-faint">Mejor</Text>
          </View>
        </Card>
      </Section>

      <Text className="px-1 text-footnote text-txt-dim">
        Cada día toma el color de su Health Score. Tocá un día para ver el resumen completo.
      </Text>
    </Screen>
  );
}
