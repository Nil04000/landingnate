import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Text, View } from 'react-native';

import type { MuscleGroup } from '@/core/db/repositories/exercises.repository';
import { MUSCLE_GROUP_LABELS } from '@/core/db/repositories/exercises.repository';
import type { WorkoutExerciseWithSets } from '@/core/db/repositories/workouts.repository';
import { epleyE1Rm } from '@/core/db/repositories/workouts.repository';
import {
  Card,
  EmptyState,
  PressableScale,
  PrimaryButton,
  Screen,
  Section,
} from '@/core/design-system/components';
import { palette } from '@/core/design-system/tokens/palette';
import { fromLocalDate } from '@/core/lib/dates';
import { formatInt, formatMinutes, formatTime } from '@/core/lib/format';
import { repos } from '@/queries/repos';
import { useWorkoutMutation, useWorkoutSession } from '@/queries/useWorkouts';

import { formatKg } from '../components/format';

/** Resumen de una sesión (/workout/[id]): stats, ejercicios y series. */
export default function WorkoutSummaryScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const workoutId = params.id ?? '';

  const { data } = useWorkoutSession(workoutId);

  const deleteWorkout = useWorkoutMutation(
    (args: { dayDate: string; workoutId: string }) => repos.workouts.softDelete(args.workoutId),
    { silent: true },
  );

  if (data === undefined) return <Screen scroll={false}>{null}</Screen>;

  if (data === null) {
    return (
      <Screen scroll={false} className="justify-center">
        <EmptyState
          title="No encontramos esta sesión"
          subtitle="Puede que haya sido eliminada."
          action={<PrimaryButton label="Volver" variant="tonal" onPress={() => router.back()} />}
        />
      </Screen>
    );
  }

  const { workout, exercises } = data;
  const effectiveSets = exercises.flatMap((e) => e.sets).filter((s) => s.isWarmup === 0);
  const volume = effectiveSets.reduce((sum, s) => sum + (s.reps ?? 0) * (s.weightKg ?? 0), 0);
  const durationMin =
    workout.endedAt != null ? (workout.endedAt - workout.startedAt) / 60_000 : null;

  const stats = [
    { label: 'Volumen', value: `${formatInt(volume)} kg` },
    { label: 'Series', value: formatInt(effectiveSets.length) },
    { label: 'Ejercicios', value: formatInt(exercises.length) },
  ];

  return (
    <Screen>
      <View className="mt-1 flex-row items-center gap-2">
        <PressableScale onPress={() => router.back()}>
          <View className="h-9 w-9 items-center justify-center rounded-full bg-surface-2">
            <ChevronLeft color={palette.text.primary} size={20} strokeWidth={2} />
          </View>
        </PressableScale>
        <Text className="flex-1 text-title2 text-txt" numberOfLines={1}>
          {workout.title ?? 'Entrenamiento'}
        </Text>
      </View>
      <Text className="mb-4 ml-11 mt-0.5 text-footnote text-txt-dim">
        {format(fromLocalDate(workout.dayDate), "EEEE d 'de' MMMM", { locale: es })}
        {` · ${formatTime(workout.startedAt)}`}
        {durationMin != null ? ` · ${formatMinutes(durationMin)}` : ''}
      </Text>

      <Section title="Totales">
        <Card flush className="flex-row p-2">
          {stats.map((s) => (
            <View key={s.label} className="flex-1 items-center py-3">
              <Text className="text-headline text-txt" style={{ fontVariant: ['tabular-nums'] }}>
                {s.value}
              </Text>
              <Text className="mt-0.5 text-caption uppercase text-txt-faint">{s.label}</Text>
            </View>
          ))}
        </Card>
      </Section>

      <Section title="Ejercicios">
        {exercises.length === 0 ? (
          <Text className="py-2 text-footnote text-txt-faint">
            Esta sesión no tiene ejercicios registrados.
          </Text>
        ) : (
          exercises.map((item) => <SummaryExerciseCard key={item.id} item={item} />)
        )}
      </Section>

      <PressableScale
        onPress={() =>
          deleteWorkout.mutate(
            { dayDate: workout.dayDate, workoutId },
            { onSuccess: () => router.back() },
          )
        }
      >
        <Text className="mt-2 py-2 text-center text-subhead text-danger">Eliminar sesión</Text>
      </PressableScale>
    </Screen>
  );
}

/** Card de ejercicio del resumen: tap navega al historial del ejercicio. */
function SummaryExerciseCard({ item }: { item: WorkoutExerciseWithSets }) {
  return (
    <PressableScale onPress={() => router.push(`/workout/exercise/${item.exerciseId}`)}>
      <Card className="mb-3">
        <View className="flex-row items-center gap-2">
          <View className="flex-1">
            <Text className="text-headline text-txt" numberOfLines={1}>
              {item.exercise.name}
            </Text>
            <Text className="mt-0.5 text-footnote text-txt-dim">
              {MUSCLE_GROUP_LABELS[item.exercise.muscleGroup as MuscleGroup]}
            </Text>
          </View>
          <ChevronRight color={palette.text.tertiary} size={18} strokeWidth={2} />
        </View>

        <View className="mt-2">
          {item.sets.length === 0 ? (
            <Text className="py-2 text-footnote text-txt-faint">Sin series registradas.</Text>
          ) : (
            item.sets.map((set, idx) => {
              const e1Rm =
                set.isWarmup === 0 && set.reps != null && set.weightKg != null
                  ? epleyE1Rm(set.weightKg, set.reps)
                  : 0;
              return (
                <View
                  key={set.id}
                  className={`flex-row items-center gap-3 py-2 ${idx > 0 ? 'border-t border-separator/50' : ''}`}
                >
                  <Text
                    className="w-6 text-footnote text-txt-faint"
                    style={{ fontVariant: ['tabular-nums'] }}
                  >
                    {set.isWarmup === 1 ? 'W' : formatInt(idx + 1)}
                  </Text>
                  <Text
                    className={`flex-1 text-body ${set.isWarmup === 1 ? 'text-txt-faint' : 'text-txt'}`}
                    style={{ fontVariant: ['tabular-nums'] }}
                  >
                    {`${formatInt(set.reps ?? 0)} × ${formatKg(set.weightKg ?? 0)} kg`}
                  </Text>
                  {e1Rm > 0 ? (
                    <Text
                      className="text-footnote text-txt-dim"
                      style={{ fontVariant: ['tabular-nums'] }}
                    >
                      e1RM {formatInt(e1Rm)}
                    </Text>
                  ) : null}
                </View>
              );
            })
          )}
        </View>
      </Card>
    </PressableScale>
  );
}
