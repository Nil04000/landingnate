import { Plus, X } from 'lucide-react-native';
import { Text, View } from 'react-native';

import type { MuscleGroup } from '@/core/db/repositories/exercises.repository';
import { MUSCLE_GROUP_LABELS } from '@/core/db/repositories/exercises.repository';
import type { WorkoutExerciseWithSets, WorkoutSet } from '@/core/db/repositories/workouts.repository';
import { Card, PressableScale } from '@/core/design-system/components';
import { palette } from '@/core/design-system/tokens/palette';
import { formatInt } from '@/core/lib/format';
import { repos } from '@/queries/repos';
import { useGhostSets, useWorkoutMutation } from '@/queries/useWorkouts';

import { formatKg } from './format';
import { SetRow } from './SetRow';

type ExerciseCardProps = {
  item: WorkoutExerciseWithSets;
  workoutId: string;
  dayDate: string;
  /** Set que acaba de marcar PR en esta sesión (badge dorado) */
  lastPrSetId: string | null;
  onPr: (setId: string) => void;
  onRestStart: () => void;
};

/** Card de ejercicio del logger en vivo: ghost values, series editables y "+ Serie". */
export function ExerciseCard({
  item,
  workoutId,
  dayDate,
  lastPrSetId,
  onPr,
  onRestStart,
}: ExerciseCardProps) {
  const { data: ghostSets } = useGhostSets(item.exerciseId, workoutId);

  const addSet = useWorkoutMutation(
    (args: {
      dayDate: string;
      workoutId: string;
      workoutExerciseId: string;
      exerciseId: string;
      reps: number;
      weightKg: number;
    }) => repos.workouts.addSet(args.workoutExerciseId, { reps: args.reps, weightKg: args.weightKg }),
    { checkPr: (args) => ({ exerciseId: args.exerciseId, weightKg: args.weightKg, reps: args.reps }) },
  );
  const updateSet = useWorkoutMutation(
    (args: {
      dayDate: string;
      workoutId: string;
      setId: string;
      exerciseId: string;
      reps: number;
      weightKg: number;
      isWarmup: boolean;
    }) =>
      repos.workouts.updateSet(args.setId, {
        reps: args.reps,
        weightKg: args.weightKg,
        isWarmup: args.isWarmup ? 1 : 0,
      }),
    {
      checkPr: (args) =>
        args.isWarmup ? null : { exerciseId: args.exerciseId, weightKg: args.weightKg, reps: args.reps },
    },
  );
  const removeSet = useWorkoutMutation(
    (args: { dayDate: string; workoutId: string; setId: string }) =>
      repos.workouts.removeSet(args.setId),
    { silent: true },
  );
  const removeExercise = useWorkoutMutation(
    (args: { dayDate: string; workoutId: string; workoutExerciseId: string }) =>
      repos.workouts.removeExercise(args.workoutExerciseId),
    { silent: true },
  );

  /** Resumen de la última sesión con este ejercicio ("3×8 · 80 kg"). */
  const ghost = (() => {
    if (!ghostSets || ghostSets.length === 0) return null;
    const effective = ghostSets.filter((s) => s.isWarmup === 0);
    const source = effective.length > 0 ? effective : ghostSets;
    const last = source[source.length - 1];
    if (!last || last.reps == null || last.weightKg == null) return null;
    return { count: source.length, reps: last.reps, weightKg: last.weightKg };
  })();

  const handleAddSet = () => {
    const lastSet = item.sets[item.sets.length - 1];
    addSet.mutate(
      {
        dayDate,
        workoutId,
        workoutExerciseId: item.id,
        exerciseId: item.exerciseId,
        reps: lastSet?.reps ?? ghost?.reps ?? 8,
        weightKg: lastSet?.weightKg ?? ghost?.weightKg ?? 0,
      },
      {
        onSuccess: (data) => {
          if (data.isPr) onPr((data.result as WorkoutSet).id);
          onRestStart();
        },
      },
    );
  };

  return (
    <Card className="mb-3">
      <View className="flex-row items-start gap-3">
        <View className="flex-1">
          <Text className="text-headline text-txt" numberOfLines={1}>
            {item.exercise.name}
          </Text>
          <Text className="mt-0.5 text-footnote text-txt-dim">
            {MUSCLE_GROUP_LABELS[item.exercise.muscleGroup as MuscleGroup]}
          </Text>
          {ghost ? (
            <Text
              className="mt-0.5 text-footnote text-txt-faint"
              style={{ fontVariant: ['tabular-nums'] }}
            >
              {`Última vez: ${formatInt(ghost.count)}×${formatInt(ghost.reps)} · ${formatKg(ghost.weightKg)} kg`}
            </Text>
          ) : null}
        </View>
        <PressableScale
          onPress={() => removeExercise.mutate({ dayDate, workoutId, workoutExerciseId: item.id })}
          hitSlop={8}
        >
          <X color={palette.text.tertiary} size={18} strokeWidth={2} />
        </PressableScale>
      </View>

      <View className="mt-2">
        {item.sets.map((set, idx) => (
          <SetRow
            key={set.id}
            set={set}
            index={idx + 1}
            first={idx === 0}
            isPr={set.id === lastPrSetId}
            onSave={(patch) =>
              updateSet.mutate(
                { dayDate, workoutId, setId: set.id, exerciseId: item.exerciseId, ...patch },
                {
                  onSuccess: (data) => {
                    if (data.isPr) onPr(set.id);
                    onRestStart();
                  },
                },
              )
            }
            onRemove={() => removeSet.mutate({ dayDate, workoutId, setId: set.id })}
          />
        ))}
      </View>

      <PressableScale onPress={handleAddSet}>
        <View className="mt-1 flex-row items-center justify-center gap-1.5 rounded-row bg-surface-2 py-2.5">
          <Plus color={palette.tint} size={16} strokeWidth={2} />
          <Text className="text-subhead text-tint">Serie</Text>
        </View>
      </PressableScale>
    </Card>
  );
}
