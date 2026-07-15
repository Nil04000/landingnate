import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Chip, SheetScaffold, Stepper } from '@/core/design-system/components';
import { todayLocal } from '@/core/lib/dates';
import { useLogMutation } from '@/queries/mutations';
import { repos } from '@/queries/repos';
import { useDayAggregate } from '@/queries/useDay';

const PRESETS = [
  { key: 'espresso', label: 'Espresso', type: 'espresso', caffeineMg: 63, volumeMl: 30 },
  { key: 'cafe', label: 'Café', type: 'coffee', caffeineMg: 95, volumeMl: 240 },
  { key: 'mate', label: 'Mate', type: 'coffee', caffeineMg: 85, volumeMl: 500 },
  { key: 'monster', label: 'Monster', type: 'energy_drink', caffeineMg: 160, volumeMl: 473 },
  { key: 'preentreno', label: 'Pre-entreno', type: 'preworkout', caffeineMg: 200, volumeMl: 300 },
] as const;

const TIME_OPTIONS = [
  { label: 'Ahora', hoursAgo: 0 },
  { label: 'Hace 1 h', hoursAgo: 1 },
  { label: 'Hace 2 h', hoursAgo: 2 },
  { label: 'Hace 3 h', hoursAgo: 3 },
] as const;

type Selection = (typeof PRESETS)[number]['key'] | 'custom';

export default function LogCaffeineSheet() {
  const params = useLocalSearchParams<{ date?: string }>();
  const dayDate = params.date ?? todayLocal();

  const [selected, setSelected] = useState<Selection>('cafe');
  const [customMg, setCustomMg] = useState(100);
  const [quantity, setQuantity] = useState(1);
  const [hoursAgo, setHoursAgo] = useState(0);

  const { data: aggregate } = useDayAggregate(dayDate);

  const mutation = useLogMutation(
    (args: {
      dayDate: string;
      consumedAt: number;
      type: 'espresso' | 'coffee' | 'energy_drink' | 'preworkout' | 'other';
      label: string;
      quantity: number;
      caffeineMg: number;
      volumeMl?: number;
    }) => repos.substances.log(args),
  );

  const preset = selected === 'custom' ? undefined : PRESETS.find((p) => p.key === selected);
  const totalMg = (preset ? preset.caffeineMg : customMg) * quantity;

  const save = () => {
    const consumedAt = Date.now() - hoursAgo * 3_600_000;
    if (preset) {
      mutation.mutate(
        {
          dayDate,
          consumedAt,
          type: preset.type,
          label: preset.label,
          quantity,
          caffeineMg: preset.caffeineMg * quantity,
          volumeMl: preset.volumeMl * quantity,
        },
        { onSuccess: () => router.back() },
      );
      return;
    }
    mutation.mutate(
      {
        dayDate,
        consumedAt,
        type: 'other',
        label: 'Personalizado',
        quantity,
        caffeineMg: customMg * quantity,
      },
      { onSuccess: () => router.back() },
    );
  };

  return (
    <SheetScaffold
      title="Cafeína"
      subtitle={`Hoy llevás ${Math.round(aggregate?.caffeineMg ?? 0)} mg`}
      onSave={save}
    >
      <View className="mb-3 flex-row flex-wrap justify-center gap-2">
        {PRESETS.map((p) => (
          <Chip
            key={p.key}
            label={p.label}
            selected={selected === p.key}
            onPress={() => setSelected(p.key)}
          />
        ))}
        <Chip
          label="Personalizado"
          selected={selected === 'custom'}
          onPress={() => setSelected('custom')}
        />
      </View>

      {preset ? (
        <Text className="mb-4 text-center text-footnote text-txt-faint">
          {preset.caffeineMg} mg · {preset.volumeMl} ml por unidad
        </Text>
      ) : (
        <View className="mb-4 mt-2">
          <Text className="mb-2 text-subhead text-txt-dim">Cafeína por unidad</Text>
          <Stepper
            value={customMg}
            onChange={setCustomMg}
            step={10}
            min={10}
            max={500}
            display={`${customMg} mg`}
          />
        </View>
      )}

      <Text className="mb-2 text-subhead text-txt-dim">Cantidad</Text>
      <Stepper value={quantity} onChange={setQuantity} min={1} max={10} />

      <Text className="mb-2 mt-6 text-subhead text-txt-dim">¿Cuándo?</Text>
      <View className="flex-row flex-wrap gap-2">
        {TIME_OPTIONS.map((opt) => (
          <Chip
            key={opt.hoursAgo}
            label={opt.label}
            selected={hoursAgo === opt.hoursAgo}
            onPress={() => setHoursAgo(opt.hoursAgo)}
          />
        ))}
      </View>

      <Text className="mt-6 text-center text-footnote text-txt-faint">
        Vas a registrar {totalMg} mg de cafeína
      </Text>
    </SheetScaffold>
  );
}
