import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Chip, NumericKeypad, SheetScaffold } from '@/core/design-system/components';
import { todayLocal } from '@/core/lib/dates';
import { useLogMutation } from '@/queries/mutations';
import { repos } from '@/queries/repos';
import { useDayAggregate } from '@/queries/useDay';

const PRESETS = [5000, 8000, 10000] as const;

/** "8432" → "8.432" (separador de miles es-AR, solo para mostrar). */
function formatThousands(raw: string): string {
  return raw.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export default function LogStepsSheet() {
  const params = useLocalSearchParams<{ date?: string }>();
  const dayDate = params.date ?? todayLocal();
  const [raw, setRaw] = useState('');

  const { data: aggregate } = useDayAggregate(dayDate);
  const parsed = raw ? Number.parseInt(raw, 10) : null;

  const mutation = useLogMutation((args: { dayDate: string; steps: number }) =>
    repos.activity.upsertForDay({ dayDate: args.dayDate, steps: args.steps }),
  );

  const save = () => {
    if (parsed == null) return;
    mutation.mutate({ dayDate, steps: parsed }, { onSuccess: () => router.back() });
  };

  return (
    <SheetScaffold
      title="Pasos"
      subtitle={`Hoy llevás ${formatThousands(String(aggregate?.steps ?? 0))} pasos`}
      onSave={save}
      saveDisabled={parsed == null}
    >
      <View className="mb-4 h-16 flex-row items-baseline justify-center gap-1.5">
        <Text
          className={raw ? 'text-display text-txt' : 'text-display text-txt-faint'}
          style={{ fontVariant: ['tabular-nums'] }}
        >
          {raw ? formatThousands(raw) : '0'}
        </Text>
        <Text className="text-title2 text-txt-dim">pasos</Text>
      </View>

      <View className="mb-4 flex-row justify-center gap-2">
        {PRESETS.map((preset) => (
          <Chip
            key={preset}
            label={formatThousands(String(preset))}
            selected={raw === String(preset)}
            onPress={() => setRaw(String(preset))}
          />
        ))}
      </View>

      <NumericKeypad
        allowDecimal={false}
        onDigit={(d) => {
          setRaw((prev) => {
            if (prev.length >= 6) return prev;
            if (prev === '0') return d;
            return prev + d;
          });
        }}
        onDecimal={() => {}}
        onBackspace={() => setRaw((prev) => prev.slice(0, -1))}
      />
    </SheetScaffold>
  );
}
