import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Chip, SheetScaffold, Stepper } from '@/core/design-system/components';
import { formatDecimal } from '@/core/lib/format';
import { todayLocal } from '@/core/lib/dates';
import { repos } from '@/queries/repos';
import { useWorkoutMutation } from '@/queries/useWorkouts';

const KINDS = ['Correr', 'Caminata', 'Bici', 'Remo', 'Nadar', 'Otro'] as const;

/** Registro rápido de cardio: tipo + duración + distancia/kcal opcionales. */
export default function LogCardioSheet() {
  const params = useLocalSearchParams<{ date?: string }>();
  const dayDate = params.date ?? todayLocal();

  const [kind, setKind] = useState<(typeof KINDS)[number]>('Correr');
  const [minutes, setMinutes] = useState(30);
  /** décimas de km para stepper entero (25 = 2,5 km); 0 = sin distancia */
  const [distanceHm, setDistanceHm] = useState(0);
  const [kcal, setKcal] = useState(0);

  const mutation = useWorkoutMutation((args: { dayDate: string }) => {
    const now = Date.now();
    repos.workouts.create({
      dayDate: args.dayDate,
      type: 'cardio',
      title: kind,
      startedAt: now - minutes * 60_000,
      endedAt: now,
      ...(distanceHm > 0 ? { distanceM: distanceHm * 100 } : {}),
      ...(kcal > 0 ? { kcalBurned: kcal } : {}),
    });
  });

  const save = () => {
    mutation.mutate({ dayDate }, { onSuccess: () => router.back() });
  };

  return (
    <SheetScaffold title="Cardio" onSave={save}>
      <View className="mb-6 flex-row flex-wrap justify-center gap-2">
        {KINDS.map((k) => (
          <Chip key={k} label={k} selected={kind === k} onPress={() => setKind(k)} />
        ))}
      </View>

      <Text className="mb-2 text-caption uppercase text-txt-faint">Duración</Text>
      <Stepper value={minutes} onChange={setMinutes} step={5} min={5} max={360} display={`${minutes} min`} />

      <Text className="mb-2 mt-6 text-caption uppercase text-txt-faint">Distancia (opcional)</Text>
      <Stepper
        value={distanceHm}
        onChange={setDistanceHm}
        step={5}
        min={0}
        max={500}
        display={distanceHm > 0 ? `${formatDecimal(distanceHm / 10, 1)} km` : '—'}
      />

      <Text className="mb-2 mt-6 text-caption uppercase text-txt-faint">Calorías (opcional)</Text>
      <Stepper
        value={kcal}
        onChange={setKcal}
        step={25}
        min={0}
        max={2000}
        display={kcal > 0 ? `${kcal} kcal` : '—'}
      />
    </SheetScaffold>
  );
}
