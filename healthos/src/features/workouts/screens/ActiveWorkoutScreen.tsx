import { router, useLocalSearchParams } from 'expo-router';
import { Plus, Timer, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Exercise } from '@/core/db/repositories/exercises.repository';
import type { Workout } from '@/core/db/repositories/workouts.repository';
import { Card, EmptyState, PressableScale, PrimaryButton } from '@/core/design-system/components';
import { palette } from '@/core/design-system/tokens/palette';
import { repos } from '@/queries/repos';
import { useWorkoutMutation, useWorkoutSession } from '@/queries/useWorkouts';

import { ExerciseCard } from '../components/ExerciseCard';
import { ExercisePicker } from '../components/ExercisePicker';
import { RestTimer } from '../components/RestTimer';
import { formatClock } from '../components/format';

/** Logger en vivo (/workout/active?id=): título, cronómetro, series, PRs y descanso. */
export default function ActiveWorkoutScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const workoutId = params.id ?? '';
  const insets = useSafeAreaInsets();

  const { data } = useWorkoutSession(workoutId);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [lastPrSetId, setLastPrSetId] = useState<string | null>(null);
  const [restToken, setRestToken] = useState<number | null>(null);

  const saveTitle = useWorkoutMutation(
    (args: { dayDate: string; workoutId: string; title: string }) =>
      repos.workouts.update(args.workoutId, { title: args.title }),
    { silent: true },
  );
  const finishWorkout = useWorkoutMutation(
    (args: { dayDate: string; workoutId: string; endedAt: number }) =>
      repos.workouts.update(args.workoutId, { endedAt: args.endedAt }),
  );
  const discardWorkout = useWorkoutMutation(
    (args: { dayDate: string; workoutId: string }) => repos.workouts.softDelete(args.workoutId),
    { silent: true },
  );
  const addExercise = useWorkoutMutation(
    (args: { dayDate: string; workoutId: string; exerciseId: string }) =>
      repos.workouts.addExercise(args.workoutId, args.exerciseId),
  );

  if (data === undefined) return <View className="flex-1 bg-canvas" />;

  if (data === null) {
    return (
      <View className="flex-1 justify-center bg-canvas px-5">
        <EmptyState
          title="No encontramos esta sesión"
          subtitle="Puede que haya sido eliminada."
          action={<PrimaryButton label="Volver" variant="tonal" onPress={() => router.back()} />}
        />
      </View>
    );
  }

  const { workout, exercises } = data;
  const totalSets = exercises.reduce((sum, e) => sum + e.sets.length, 0);
  const showPicker = pickerOpen || exercises.length === 0;

  /** Cierra la sesión; una sesión sin series no se guarda. */
  const finish = () => {
    if (totalSets === 0) {
      discardWorkout.mutate(
        { dayDate: workout.dayDate, workoutId },
        { onSuccess: () => router.back() },
      );
    } else {
      finishWorkout.mutate(
        { dayDate: workout.dayDate, workoutId, endedAt: Date.now() },
        { onSuccess: () => router.replace(`/workout/${workoutId}`) },
      );
    }
  };

  const handleSelectExercise = (exercise: Exercise) => {
    addExercise.mutate(
      { dayDate: workout.dayDate, workoutId, exerciseId: exercise.id },
      { onSuccess: () => setPickerOpen(false) },
    );
  };

  return (
    <View className="flex-1 bg-canvas">
      <View className="border-b border-stroke px-5 pb-3" style={{ paddingTop: insets.top + 8 }}>
        <View className="flex-row items-center gap-3">
          <TitleInput
            key={workout.id}
            workout={workout}
            onSave={(title) => saveTitle.mutate({ dayDate: workout.dayDate, workoutId, title })}
          />
          <PressableScale onPress={finish}>
            <Text className="overflow-hidden rounded-chip bg-tint px-4 py-2 text-subhead text-white">
              Terminar
            </Text>
          </PressableScale>
        </View>
        <View className="mt-1 flex-row items-center gap-1.5">
          <Timer color={palette.text.secondary} size={13} strokeWidth={2} />
          <SessionClock startedAt={workout.startedAt} />
        </View>
      </View>

      <ScrollView
        contentContainerClassName="px-5 pt-4"
        contentContainerStyle={{ paddingBottom: insets.bottom + (restToken != null ? 140 : 40) }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {exercises.map((item) => (
          <ExerciseCard
            key={item.id}
            item={item}
            workoutId={workoutId}
            dayDate={workout.dayDate}
            lastPrSetId={lastPrSetId}
            onPr={setLastPrSetId}
            onRestStart={() => setRestToken(Date.now())}
          />
        ))}

        {showPicker ? (
          <Card className="mb-3">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-headline text-txt">Agregar ejercicio</Text>
              {exercises.length > 0 ? (
                <PressableScale onPress={() => setPickerOpen(false)} hitSlop={8}>
                  <X color={palette.text.tertiary} size={18} strokeWidth={2} />
                </PressableScale>
              ) : null}
            </View>
            <ExercisePicker onSelect={handleSelectExercise} />
          </Card>
        ) : (
          <PressableScale onPress={() => setPickerOpen(true)}>
            <View className="flex-row items-center justify-center gap-1.5 rounded-card border border-stroke bg-surface py-4">
              <Plus color={palette.tint} size={18} strokeWidth={2} />
              <Text className="text-headline text-tint">Ejercicio</Text>
            </View>
          </PressableScale>
        )}
      </ScrollView>

      {restToken != null ? (
        <View
          className="absolute bottom-0 left-0 right-0 px-5"
          style={{ paddingBottom: insets.bottom + 12 }}
        >
          <RestTimer key={restToken} onClose={() => setRestToken(null)} />
        </View>
      ) : null}
    </View>
  );
}

type TitleInputProps = {
  workout: Workout;
  onSave: (title: string) => void;
};

/** Título editable simple: guarda al terminar de editar (nunca vacío). */
function TitleInput({ workout, onSave }: TitleInputProps) {
  const [title, setTitle] = useState(workout.title ?? '');

  return (
    <TextInput
      value={title}
      onChangeText={setTitle}
      onEndEditing={() => {
        const trimmed = title.trim();
        if (trimmed && trimmed !== workout.title) onSave(trimmed);
      }}
      placeholder="Entrenamiento"
      placeholderTextColor={palette.text.tertiary}
      returnKeyType="done"
      className="flex-1 p-0 text-title2 text-txt"
    />
  );
}

/** Cronómetro de sesión mm:ss desde startedAt (tick local de 1 s). */
function SessionClock({ startedAt }: { startedAt: number }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <Text className="text-footnote text-txt-dim" style={{ fontVariant: ['tabular-nums'] }}>
      {formatClock((now - startedAt) / 1000)}
    </Text>
  );
}
