import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Chip, SheetScaffold, Stepper } from '@/core/design-system/components';
import { todayLocal } from '@/core/lib/dates';
import { useLogMutation } from '@/queries/mutations';
import { repos } from '@/queries/repos';

const TYPES = [
  { key: 'alcohol', label: 'Alcohol' },
  { key: 'cigarette', label: 'Cigarrillo' },
  { key: 'vape', label: 'Vape' },
] as const;

/** Gramos de etanol puro y volumen por unidad de cada preset. */
const ALCOHOL_PRESETS = [
  { label: 'Cerveza lata (355 ml)', alcoholGrams: 14, volumeMl: 355 },
  { label: 'Cerveza pinta (500 ml)', alcoholGrams: 20, volumeMl: 500 },
  { label: 'Copa de vino (150 ml)', alcoholGrams: 15, volumeMl: 150 },
  { label: 'Trago (medida 45 ml)', alcoholGrams: 14, volumeMl: 45 },
] as const;

/** mg de nicotina estimados por cigarrillo. */
const NICOTINE_MG_PER_CIGARETTE = 1.2;

export default function LogSubstanceSheet() {
  const params = useLocalSearchParams<{ date?: string }>();
  const dayDate = params.date ?? todayLocal();

  const [type, setType] = useState<(typeof TYPES)[number]['key']>('alcohol');
  const [alcoholIdx, setAlcoholIdx] = useState(0);
  const [alcoholQty, setAlcoholQty] = useState(1);
  const [cigQty, setCigQty] = useState(1);
  const [vapeQty, setVapeQty] = useState(1);

  const mutation = useLogMutation(
    (args: {
      dayDate: string;
      consumedAt: number;
      type: 'alcohol' | 'cigarette' | 'vape';
      label?: string;
      quantity: number;
      volumeMl?: number;
      alcoholGrams?: number;
      nicotineMg?: number;
      kcal?: number;
    }) => repos.substances.log(args),
  );

  const alcoholPreset = ALCOHOL_PRESETS[alcoholIdx] ?? ALCOHOL_PRESETS[0];
  const totalAlcoholGrams = alcoholPreset.alcoholGrams * alcoholQty;
  const totalKcal = Math.round(totalAlcoholGrams * 7);
  const totalNicotineMg = Math.round(NICOTINE_MG_PER_CIGARETTE * cigQty * 10) / 10;

  const save = () => {
    const consumedAt = Date.now();
    if (type === 'alcohol') {
      mutation.mutate(
        {
          dayDate,
          consumedAt,
          type: 'alcohol',
          label: alcoholPreset.label,
          quantity: alcoholQty,
          volumeMl: alcoholPreset.volumeMl * alcoholQty,
          alcoholGrams: totalAlcoholGrams,
          kcal: totalKcal,
        },
        { onSuccess: () => router.back() },
      );
      return;
    }
    if (type === 'cigarette') {
      mutation.mutate(
        { dayDate, consumedAt, type: 'cigarette', quantity: cigQty, nicotineMg: totalNicotineMg },
        { onSuccess: () => router.back() },
      );
      return;
    }
    mutation.mutate(
      { dayDate, consumedAt, type: 'vape', quantity: vapeQty },
      { onSuccess: () => router.back() },
    );
  };

  return (
    <SheetScaffold title="Sustancias" onSave={save}>
      <View className="mb-6 flex-row justify-center gap-2">
        {TYPES.map((t) => (
          <Chip key={t.key} label={t.label} selected={type === t.key} onPress={() => setType(t.key)} />
        ))}
      </View>

      {type === 'alcohol' ? (
        <>
          <Text className="mb-2 text-subhead text-txt-dim">¿Qué tomaste?</Text>
          <View className="mb-4 flex-row flex-wrap gap-2">
            {ALCOHOL_PRESETS.map((preset, idx) => (
              <Chip
                key={preset.label}
                label={preset.label}
                selected={alcoholIdx === idx}
                onPress={() => setAlcoholIdx(idx)}
              />
            ))}
          </View>

          <Text className="mb-2 text-subhead text-txt-dim">Cantidad</Text>
          <Stepper value={alcoholQty} onChange={setAlcoholQty} min={1} max={10} />

          <Text className="mt-6 text-center text-footnote text-txt-faint">
            ≈ {totalAlcoholGrams} g de alcohol · {totalKcal} kcal
          </Text>
        </>
      ) : null}

      {type === 'cigarette' ? (
        <>
          <Text className="mb-2 text-subhead text-txt-dim">Cantidad</Text>
          <Stepper value={cigQty} onChange={setCigQty} min={1} max={40} />

          <Text className="mt-6 text-center text-footnote text-txt-faint">
            ≈ {String(totalNicotineMg).replace('.', ',')} mg de nicotina
          </Text>
        </>
      ) : null}

      {type === 'vape' ? (
        <>
          <Text className="mb-2 text-subhead text-txt-dim">Sesiones</Text>
          <Stepper value={vapeQty} onChange={setVapeQty} min={1} max={30} />
        </>
      ) : null}
    </SheetScaffold>
  );
}
