import { Plus } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';

import type { Exercise, MuscleGroup } from '@/core/db/repositories/exercises.repository';
import { MUSCLE_GROUP_LABELS } from '@/core/db/repositories/exercises.repository';
import { Chip, PressableScale } from '@/core/design-system/components';
import { palette } from '@/core/design-system/tokens/palette';
import { useExerciseSearch } from '@/queries/useWorkouts';

import { EQUIPMENT_LABELS } from './format';

const MAX_RESULTS = 15;
const GROUPS = Object.keys(MUSCLE_GROUP_LABELS) as MuscleGroup[];

type ExercisePickerProps = {
  /** Tap en un resultado: agrega el ejercicio a la sesión. */
  onSelect: (exercise: Exercise) => void;
};

/** Picker inline de ejercicios: búsqueda + chips de grupo muscular + resultados. */
export function ExercisePicker({ onSelect }: ExercisePickerProps) {
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<MuscleGroup | null>(null);
  const { data } = useExerciseSearch(query, group ?? undefined);

  const results = (data ?? []).slice(0, MAX_RESULTS);

  return (
    <View>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Buscar ejercicio…"
        placeholderTextColor={palette.text.tertiary}
        autoCorrect={false}
        className="mb-3 rounded-row bg-surface-2 px-4 py-3 text-body text-txt"
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-2"
        contentContainerClassName="gap-2 pb-1"
        keyboardShouldPersistTaps="handled"
      >
        {GROUPS.map((g) => (
          <Chip
            key={g}
            label={MUSCLE_GROUP_LABELS[g]}
            selected={g === group}
            onPress={() => setGroup((prev) => (prev === g ? null : g))}
          />
        ))}
      </ScrollView>

      {results.length === 0 ? (
        <Text className="py-4 text-center text-footnote text-txt-faint">
          Sin resultados. Probá con otro nombre o grupo.
        </Text>
      ) : (
        results.map((exercise, idx) => (
          <PressableScale key={exercise.id} onPress={() => onSelect(exercise)}>
            <View
              className={`flex-row items-center gap-3 py-3 ${idx > 0 ? 'border-t border-separator/50' : ''}`}
            >
              <View className="flex-1">
                <Text className="text-body text-txt" numberOfLines={1}>
                  {exercise.name}
                </Text>
                <Text className="mt-0.5 text-footnote text-txt-dim" numberOfLines={1}>
                  {MUSCLE_GROUP_LABELS[exercise.muscleGroup as MuscleGroup]}
                  {exercise.equipment
                    ? ` · ${EQUIPMENT_LABELS[exercise.equipment] ?? exercise.equipment}`
                    : ''}
                </Text>
              </View>
              <Plus color={palette.text.tertiary} size={18} strokeWidth={2} />
            </View>
          </PressableScale>
        ))
      )}
    </View>
  );
}
