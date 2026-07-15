import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Chip, SheetScaffold, Stepper } from '@/core/design-system/components';
import { addDaysLocal, fromLocalDate, todayLocal } from '@/core/lib/dates';
import { useLogMutation } from '@/queries/mutations';
import { repos } from '@/queries/repos';
import { useDayAggregate } from '@/queries/useDay';

const BED_PRESETS = [22 * 60, 23 * 60, 0] as const;
const WAKE_PRESETS = [6 * 60, 7 * 60, 8 * 60] as const;
const NAP_START_PRESETS = [13 * 60, 14 * 60, 15 * 60, 16 * 60] as const;
const QUALITY_OPTIONS = [1, 2, 3, 4, 5] as const;
const DAY_MS = 24 * 60 * 60_000;

/** Normaliza minutos del día al rango [0, 1440) — permite cruzar medianoche con el stepper. */
function wrapMinutes(value: number): number {
  return ((value % 1440) + 1440) % 1440;
}

/** Minutos del día → "HH:MM". */
function formatTime(minutesOfDay: number): string {
  const m = wrapMinutes(minutesOfDay);
  const hh = String(Math.floor(m / 60)).padStart(2, '0');
  const mm = String(m % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

/** Minutos totales → "7 h 30 min". */
function formatDuration(totalMinutes: number): string {
  const rounded = Math.round(totalMinutes);
  const h = Math.floor(rounded / 60);
  const m = rounded % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

export default function LogSleepSheet() {
  const params = useLocalSearchParams<{ date?: string }>();
  const dayDate = params.date ?? todayLocal();

  const [mode, setMode] = useState<'sleep' | 'nap'>('sleep');
  const [bedMinutes, setBedMinutes] = useState(23 * 60);
  const [wakeMinutes, setWakeMinutes] = useState(7 * 60);
  const [quality, setQuality] = useState<number | null>(null);
  const [napDuration, setNapDuration] = useState(30);
  const [napStart, setNapStart] = useState(14 * 60);

  const { data: aggregate } = useDayAggregate(dayDate);
  const totalMinutes = aggregate?.sleepMinutes;

  const mutation = useLogMutation(
    (args: {
      dayDate: string;
      startAt: number;
      endAt: number;
      isNap?: number;
      qualityRating?: number;
    }) => repos.sleep.log(args),
  );

  const save = () => {
    const dayStart = fromLocalDate(dayDate).getTime();

    if (mode === 'nap') {
      const startAt = dayStart + napStart * 60_000;
      const endAt = startAt + napDuration * 60_000;
      mutation.mutate({ dayDate, startAt, endAt, isNap: 1 }, { onSuccess: () => router.back() });
      return;
    }

    // El sueño se acredita al día del despertar: despertar en `dayDate`,
    // acostarse la noche anterior si fue después de las 18:00.
    const startAt =
      bedMinutes >= 18 * 60
        ? fromLocalDate(addDaysLocal(dayDate, -1)).getTime() + bedMinutes * 60_000
        : dayStart + bedMinutes * 60_000;
    let endAt = dayStart + wakeMinutes * 60_000;
    if (endAt <= startAt) endAt += DAY_MS;

    mutation.mutate(
      { dayDate, startAt, endAt, ...(quality != null ? { qualityRating: quality } : {}) },
      { onSuccess: () => router.back() },
    );
  };

  const sleepPreview = wrapMinutes(wakeMinutes - bedMinutes) || 1440;

  return (
    <SheetScaffold
      title="Sueño"
      subtitle={
        totalMinutes != null && totalMinutes > 0 ? `Hoy: ${formatDuration(totalMinutes)}` : undefined
      }
      onSave={save}
    >
      <View className="mb-6 flex-row justify-center gap-2">
        <Chip label="Sueño" selected={mode === 'sleep'} onPress={() => setMode('sleep')} />
        <Chip label="Siesta" selected={mode === 'nap'} onPress={() => setMode('nap')} />
      </View>

      {mode === 'sleep' ? (
        <>
          <Text className="mb-2 text-subhead text-txt-dim">Me acosté</Text>
          <View className="mb-3 flex-row gap-2">
            {BED_PRESETS.map((preset) => (
              <Chip
                key={preset}
                label={formatTime(preset)}
                selected={bedMinutes === preset}
                onPress={() => setBedMinutes(preset)}
              />
            ))}
          </View>
          <Stepper
            value={bedMinutes}
            onChange={(next) => setBedMinutes(wrapMinutes(next))}
            step={15}
            min={-15}
            max={1440}
            display={formatTime(bedMinutes)}
          />

          <Text className="mb-2 mt-6 text-subhead text-txt-dim">Me desperté</Text>
          <View className="mb-3 flex-row gap-2">
            {WAKE_PRESETS.map((preset) => (
              <Chip
                key={preset}
                label={formatTime(preset)}
                selected={wakeMinutes === preset}
                onPress={() => setWakeMinutes(preset)}
              />
            ))}
          </View>
          <Stepper
            value={wakeMinutes}
            onChange={(next) => setWakeMinutes(wrapMinutes(next))}
            step={15}
            min={-15}
            max={1440}
            display={formatTime(wakeMinutes)}
          />

          <Text className="mb-2 mt-6 text-subhead text-txt-dim">¿Cómo dormiste?</Text>
          <View className="flex-row gap-2">
            {QUALITY_OPTIONS.map((q) => (
              <Chip
                key={q}
                label={String(q)}
                selected={quality === q}
                onPress={() => setQuality((prev) => (prev === q ? null : q))}
              />
            ))}
          </View>

          <Text className="mt-6 text-center text-footnote text-txt-faint">
            Duración: {formatDuration(sleepPreview)}
          </Text>
        </>
      ) : (
        <>
          <Text className="mb-2 text-subhead text-txt-dim">Duración</Text>
          <Stepper
            value={napDuration}
            onChange={setNapDuration}
            step={15}
            min={15}
            max={240}
            display={formatDuration(napDuration)}
          />

          <Text className="mb-2 mt-6 text-subhead text-txt-dim">Empezó</Text>
          <View className="mb-3 flex-row flex-wrap gap-2">
            {NAP_START_PRESETS.map((preset) => (
              <Chip
                key={preset}
                label={formatTime(preset)}
                selected={napStart === preset}
                onPress={() => setNapStart(preset)}
              />
            ))}
          </View>
          <Stepper
            value={napStart}
            onChange={(next) => setNapStart(wrapMinutes(next))}
            step={15}
            min={-15}
            max={1440}
            display={formatTime(napStart)}
          />
        </>
      )}
    </SheetScaffold>
  );
}
