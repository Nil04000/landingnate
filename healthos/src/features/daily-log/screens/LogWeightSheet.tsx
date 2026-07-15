import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { NumericKeypad, SheetScaffold } from '@/core/design-system/components';
import { todayLocal } from '@/core/lib/dates';
import { useLogMutation } from '@/queries/mutations';
import { repos } from '@/queries/repos';
import { useLatestWeight } from '@/queries/useDay';

/** Parseo de "82,4" → 82.4 (null si vacío/inválido). */
function parseWeight(raw: string): number | null {
  if (!raw) return null;
  const value = Number(raw.replace(',', '.'));
  return Number.isFinite(value) && value > 0 ? value : null;
}

export default function LogWeightSheet() {
  const params = useLocalSearchParams<{ date?: string }>();
  const dayDate = params.date ?? todayLocal();
  const [raw, setRaw] = useState('');

  const { data: latest } = useLatestWeight();
  const parsed = parseWeight(raw);

  const mutation = useLogMutation((args: { dayDate: string; weightKg: number }) =>
    repos.body.log({ dayDate: args.dayDate, measuredAt: Date.now(), weightKg: args.weightKg }),
  );

  const save = () => {
    if (parsed == null) return;
    mutation.mutate({ dayDate, weightKg: parsed }, { onSuccess: () => router.back() });
  };

  return (
    <SheetScaffold
      title="Peso"
      subtitle={latest?.weightKg != null ? `Último: ${String(latest.weightKg).replace('.', ',')} kg` : undefined}
      onSave={save}
      saveDisabled={parsed == null}
    >
      <View className="mb-4 h-16 flex-row items-baseline justify-center gap-1.5">
        <Text
          className={raw ? 'text-display text-txt' : 'text-display text-txt-faint'}
          style={{ fontVariant: ['tabular-nums'] }}
        >
          {raw || '0,0'}
        </Text>
        <Text className="text-title2 text-txt-dim">kg</Text>
      </View>

      <NumericKeypad
        onDigit={(d) => {
          setRaw((prev) => {
            if (prev.length >= 6) return prev;
            if (prev === '0') return d;
            // máx. 1 decimal
            const decimalIdx = prev.indexOf(',');
            if (decimalIdx !== -1 && prev.length - decimalIdx > 1) return prev;
            return prev + d;
          });
        }}
        onDecimal={() => {
          setRaw((prev) => {
            if (prev.includes(',')) return prev;
            return prev === '' ? '0,' : prev + ',';
          });
        }}
        onBackspace={() => setRaw((prev) => prev.slice(0, -1))}
      />
    </SheetScaffold>
  );
}
