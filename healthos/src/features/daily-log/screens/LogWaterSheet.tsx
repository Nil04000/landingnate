import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Chip, SheetScaffold, Stepper } from '@/core/design-system/components';
import { todayLocal } from '@/core/lib/dates';
import { useLogMutation } from '@/queries/mutations';
import { repos } from '@/queries/repos';
import { useDayAggregate } from '@/queries/useDay';

const PRESETS = [250, 500, 750] as const;

export default function LogWaterSheet() {
  const params = useLocalSearchParams<{ date?: string }>();
  const dayDate = params.date ?? todayLocal();
  const [amountMl, setAmountMl] = useState(250);

  const { data: aggregate } = useDayAggregate(dayDate);
  const mutation = useLogMutation((args: { dayDate: string; amountMl: number }) =>
    repos.hydration.log({ dayDate: args.dayDate, loggedAt: Date.now(), amountMl: args.amountMl }),
  );

  const save = () => {
    mutation.mutate(
      { dayDate, amountMl },
      {
        onSuccess: () => router.back(),
      },
    );
  };

  return (
    <SheetScaffold title="Agua" subtitle={`Hoy llevás ${aggregate?.waterMl ?? 0} ml`} onSave={save}>
      <View className="mb-6 flex-row justify-center gap-2">
        {PRESETS.map((preset) => (
          <Chip
            key={preset}
            label={`${preset} ml`}
            selected={amountMl === preset}
            onPress={() => setAmountMl(preset)}
          />
        ))}
      </View>

      <Stepper
        value={amountMl}
        onChange={setAmountMl}
        step={50}
        min={50}
        max={3000}
        display={`${amountMl} ml`}
      />

      <Text className="mt-6 text-center text-footnote text-txt-faint">
        Mantené presionado ± para avanzar rápido
      </Text>
    </SheetScaffold>
  );
}
