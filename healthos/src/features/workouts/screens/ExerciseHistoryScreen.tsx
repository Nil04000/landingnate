import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Text, useWindowDimensions, View } from 'react-native';

import type { MuscleGroup } from '@/core/db/repositories/exercises.repository';
import { MUSCLE_GROUP_LABELS } from '@/core/db/repositories/exercises.repository';
import {
  Card,
  EmptyState,
  ListRow,
  PressableScale,
  PrimaryButton,
  Screen,
  Section,
  Sparkline,
} from '@/core/design-system/components';
import { palette } from '@/core/design-system/tokens/palette';
import { fromLocalDate } from '@/core/lib/dates';
import { formatDecimal } from '@/core/lib/format';
import { useExerciseHistory } from '@/queries/useWorkouts';

import { EQUIPMENT_LABELS } from '../components/format';

const MAX_DAYS = 15;

/** Historial de un ejercicio (/workout/exercise/[id]): mejor e1RM + progresión. */
export default function ExerciseHistoryScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const exerciseId = params.id ?? '';
  const { width } = useWindowDimensions();

  const { data } = useExerciseHistory(exerciseId);

  if (data === undefined) return <Screen scroll={false}>{null}</Screen>;

  const { exercise, history, bestE1Rm } = data;

  if (exercise === null) {
    return (
      <Screen scroll={false} className="justify-center">
        <EmptyState
          title="No encontramos este ejercicio"
          subtitle="Puede que haya sido eliminado."
          action={<PrimaryButton label="Volver" variant="tonal" onPress={() => router.back()} />}
        />
      </Screen>
    );
  }

  const values = history.map((h) => h.e1Rm);
  const minE1 = values.length > 0 ? Math.min(...values) : 0;
  const maxE1 = values.length > 0 ? Math.max(...values) : 0;
  // Gutter de 20 por lado + padding interno de la card (p-4) + borde.
  const chartWidth = Math.max(160, width - 40 - 34);
  const recent = [...history].reverse().slice(0, MAX_DAYS);

  const badgeClass =
    'overflow-hidden rounded-chip border border-stroke bg-surface-2 px-2.5 py-1 text-footnote text-txt-dim';

  return (
    <Screen>
      <View className="mt-1 flex-row items-center gap-2">
        <PressableScale onPress={() => router.back()}>
          <View className="h-9 w-9 items-center justify-center rounded-full bg-surface-2">
            <ChevronLeft color={palette.text.primary} size={20} strokeWidth={2} />
          </View>
        </PressableScale>
        <Text className="flex-1 text-title2 text-txt" numberOfLines={2}>
          {exercise.name}
        </Text>
      </View>

      <View className="mb-4 ml-11 mt-1.5 flex-row flex-wrap gap-2">
        <Text className={badgeClass}>{MUSCLE_GROUP_LABELS[exercise.muscleGroup as MuscleGroup]}</Text>
        {exercise.equipment ? (
          <Text className={badgeClass}>
            {EQUIPMENT_LABELS[exercise.equipment] ?? exercise.equipment}
          </Text>
        ) : null}
      </View>

      <Card className="mb-6 items-center py-5">
        <Text className="text-caption uppercase text-txt-faint">Mejor e1RM</Text>
        <Text className="mt-1 text-title1 text-txt" style={{ fontVariant: ['tabular-nums'] }}>
          {bestE1Rm > 0 ? `${formatDecimal(bestE1Rm, 1)} kg` : '—'}
        </Text>
      </Card>

      <Section title="Progresión">
        {history.length < 2 ? (
          <Card flush>
            <EmptyState
              title="Todavía no hay historial suficiente"
              subtitle="Registrá al menos dos sesiones con este ejercicio para ver la progresión."
            />
          </Card>
        ) : (
          <Card>
            <View className="flex-row items-center justify-between">
              <Text className="text-caption uppercase text-txt-faint">e1RM</Text>
              <Text className="text-caption text-txt-faint" style={{ fontVariant: ['tabular-nums'] }}>
                Máx {formatDecimal(maxE1, 1)} kg
              </Text>
            </View>
            <View className="my-2">
              <Sparkline
                values={values}
                width={chartWidth}
                height={80}
                color={palette.metric.training}
              />
            </View>
            <View className="flex-row justify-end">
              <Text className="text-caption text-txt-faint" style={{ fontVariant: ['tabular-nums'] }}>
                Mín {formatDecimal(minE1, 1)} kg
              </Text>
            </View>
          </Card>
        )}
      </Section>

      <Section title="Últimos días">
        {recent.length === 0 ? (
          <Text className="py-2 text-footnote text-txt-faint">
            Todavía no registraste series efectivas de este ejercicio.
          </Text>
        ) : (
          <Card flush className="px-4">
            {recent.map((h, idx) => (
              <ListRow
                key={h.dayDate}
                title={format(fromLocalDate(h.dayDate), 'd MMM', { locale: es })}
                trailing={
                  <Text
                    className="text-subhead text-txt-dim"
                    style={{ fontVariant: ['tabular-nums'] }}
                  >
                    e1RM {formatDecimal(h.e1Rm, 1)} kg
                  </Text>
                }
                className={idx > 0 ? 'border-t border-separator/50' : undefined}
              />
            ))}
          </Card>
        )}
      </Section>
    </Screen>
  );
}
