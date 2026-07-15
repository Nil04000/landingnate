import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { Card, PressableScale, Screen, Section } from '@/core/design-system/components';
import { formatDecimal, formatInt, formatMinutes } from '@/core/lib/format';
import { fromLocalDate, todayLocal } from '@/core/lib/dates';
import { useDayAggregate } from '@/queries/useDay';

import { DayTimeline } from '../components/DayTimeline';

/** Resumen completo de un día (destino del calendario y de las cards). */
export default function DaySummaryScreen() {
  const params = useLocalSearchParams<{ date?: string }>();
  const date = params.date ?? todayLocal();
  const { data: agg } = useDayAggregate(date);

  const stats: { label: string; value: string }[] = [];
  if (agg) {
    if (agg.sleepMinutes != null) stats.push({ label: 'Sueño', value: formatMinutes(agg.sleepMinutes) });
    if (agg.napMinutes) stats.push({ label: 'Siesta', value: formatMinutes(agg.napMinutes) });
    if (agg.steps != null) stats.push({ label: 'Pasos', value: formatInt(agg.steps) });
    if (agg.waterMl != null) stats.push({ label: 'Agua', value: `${formatInt(agg.waterMl)} ml` });
    if (agg.caffeineMg != null) stats.push({ label: 'Cafeína', value: `${formatInt(agg.caffeineMg)} mg` });
    if (agg.alcoholUnits) stats.push({ label: 'Alcohol', value: `${formatDecimal(agg.alcoholUnits, 1)} u.` });
    if (agg.weightKg != null) stats.push({ label: 'Peso', value: `${formatDecimal(agg.weightKg, 1)} kg` });
    if (agg.workoutMinutes) stats.push({ label: 'Entrenamiento', value: formatMinutes(agg.workoutMinutes) });
    if (agg.mood != null) stats.push({ label: 'Ánimo', value: `${formatDecimal(agg.mood, 1)}/5` });
    if (agg.supplementAdherencePct != null)
      stats.push({ label: 'Suplementos', value: `${formatInt(agg.supplementAdherencePct)}%` });
  }

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

      {stats.length > 0 ? (
        <Section title="Resumen">
          <Card flush className="flex-row flex-wrap p-2">
            {stats.map((s) => (
              <View key={s.label} className="w-1/3 items-center py-3">
                <Text className="text-headline text-txt" style={{ fontVariant: ['tabular-nums'] }}>
                  {s.value}
                </Text>
                <Text className="mt-0.5 text-caption uppercase text-txt-faint">{s.label}</Text>
              </View>
            ))}
          </Card>
        </Section>
      ) : null}

      <Section title="Timeline">
        <DayTimeline date={date} />
      </Section>
    </Screen>
  );
}
