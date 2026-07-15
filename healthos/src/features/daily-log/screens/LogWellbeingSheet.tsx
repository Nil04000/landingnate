import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Chip, SheetScaffold } from '@/core/design-system/components';
import { todayLocal } from '@/core/lib/dates';
import { useLogMutation } from '@/queries/mutations';
import { repos } from '@/queries/repos';

type DimensionKey = 'mood' | 'energy' | 'stress' | 'libido' | 'soreness';

const DIMENSIONS: { key: DimensionKey; label: string; note?: string }[] = [
  { key: 'mood', label: 'Ánimo' },
  { key: 'energy', label: 'Energía' },
  { key: 'stress', label: 'Estrés', note: '5 = peor' },
  { key: 'libido', label: 'Libido' },
  { key: 'soreness', label: 'Dolor muscular', note: '5 = peor' },
];

const SCALE = [1, 2, 3, 4, 5] as const;

export default function LogWellbeingSheet() {
  const params = useLocalSearchParams<{ date?: string }>();
  const dayDate = params.date ?? todayLocal();

  const [values, setValues] = useState<Record<DimensionKey, number | null>>({
    mood: null,
    energy: null,
    stress: null,
    libido: null,
    soreness: null,
  });

  const mutation = useLogMutation(
    (args: {
      dayDate: string;
      loggedAt: number;
      mood?: number;
      energy?: number;
      stress?: number;
      libido?: number;
      soreness?: number;
    }) => repos.wellbeing.log(args),
  );

  const toggle = (key: DimensionKey, value: number) => {
    setValues((prev) => ({ ...prev, [key]: prev[key] === value ? null : value }));
  };

  const allUnset = Object.values(values).every((v) => v == null);

  const save = () => {
    mutation.mutate(
      {
        dayDate,
        loggedAt: Date.now(),
        ...(values.mood != null ? { mood: values.mood } : {}),
        ...(values.energy != null ? { energy: values.energy } : {}),
        ...(values.stress != null ? { stress: values.stress } : {}),
        ...(values.libido != null ? { libido: values.libido } : {}),
        ...(values.soreness != null ? { soreness: values.soreness } : {}),
      },
      { onSuccess: () => router.back() },
    );
  };

  return (
    <SheetScaffold title="¿Cómo te sentís?" onSave={save} saveDisabled={allUnset}>
      {DIMENSIONS.map((dim) => (
        <View key={dim.key} className="mb-5 flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-body text-txt">{dim.label}</Text>
            {dim.note ? (
              <Text className="mt-0.5 text-caption text-txt-faint">{dim.note}</Text>
            ) : null}
          </View>
          <View className="flex-row gap-1.5">
            {SCALE.map((value) => (
              <Chip
                key={value}
                label={String(value)}
                selected={values[dim.key] === value}
                onPress={() => toggle(dim.key, value)}
              />
            ))}
          </View>
        </View>
      ))}

      <Text className="mt-1 text-center text-footnote text-txt-faint">
        Tocá de nuevo un valor para quitarlo
      </Text>
    </SheetScaffold>
  );
}
