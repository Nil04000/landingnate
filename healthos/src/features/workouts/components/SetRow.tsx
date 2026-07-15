import { Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { Text, View } from 'react-native';

import type { WorkoutSet } from '@/core/db/repositories/workouts.repository';
import { epleyE1Rm } from '@/core/db/repositories/workouts.repository';
import { Chip, PressableScale, Stepper } from '@/core/design-system/components';
import { haptic } from '@/core/design-system/haptics';
import { palette } from '@/core/design-system/tokens/palette';
import { formatInt } from '@/core/lib/format';

import { formatKg } from './format';

type SetRowProps = {
  set: WorkoutSet;
  /** Número de serie 1-based dentro del ejercicio */
  index: number;
  first: boolean;
  /** Récord recién logrado en esta sesión (badge "PR" dorado) */
  isPr: boolean;
  onSave: (patch: { reps: number; weightKg: number; isWarmup: boolean }) => void;
  onRemove: () => void;
};

/** Fila de serie "N · reps × kg · e1RM" con editor inline de Steppers. */
export function SetRow({ set, index, first, isPr, onSave, onRemove }: SetRowProps) {
  const [editing, setEditing] = useState(false);
  const [reps, setReps] = useState(set.reps ?? 0);
  const [weightKg, setWeightKg] = useState(set.weightKg ?? 0);
  const [warmup, setWarmup] = useState(set.isWarmup === 1);

  const toggleEdit = () => {
    haptic.select();
    setReps(set.reps ?? 0);
    setWeightKg(set.weightKg ?? 0);
    setWarmup(set.isWarmup === 1);
    setEditing((prev) => !prev);
  };

  const confirm = () => {
    setEditing(false);
    const unchanged =
      reps === (set.reps ?? 0) && weightKg === (set.weightKg ?? 0) && warmup === (set.isWarmup === 1);
    if (!unchanged) onSave({ reps, weightKg, isWarmup: warmup });
  };

  const e1Rm =
    set.isWarmup === 0 && set.reps != null && set.weightKg != null
      ? epleyE1Rm(set.weightKg, set.reps)
      : 0;

  return (
    <View className={first ? '' : 'border-t border-separator/50'}>
      <PressableScale onPress={toggleEdit}>
        <View className="flex-row items-center gap-3 py-3">
          <Text
            className="w-6 text-footnote text-txt-faint"
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {set.isWarmup === 1 ? 'W' : formatInt(index)}
          </Text>
          <Text
            className={`flex-1 text-body ${set.isWarmup === 1 ? 'text-txt-faint' : 'text-txt'}`}
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {`${formatInt(set.reps ?? 0)} × ${formatKg(set.weightKg ?? 0)} kg`}
          </Text>
          {isPr ? (
            <Text className="overflow-hidden rounded-chip bg-warning/15 px-2 py-0.5 text-caption uppercase text-warning">
              PR
            </Text>
          ) : null}
          {e1Rm > 0 ? (
            <Text className="text-footnote text-txt-dim" style={{ fontVariant: ['tabular-nums'] }}>
              e1RM {formatInt(e1Rm)}
            </Text>
          ) : null}
        </View>
      </PressableScale>

      {editing ? (
        <View className="gap-3 pb-3">
          <View className="flex-row items-center gap-3">
            <Text className="w-12 text-footnote text-txt-dim">Reps</Text>
            <View className="flex-1">
              <Stepper value={reps} onChange={setReps} step={1} min={0} max={50} display={formatInt(reps)} />
            </View>
          </View>
          <View className="flex-row items-center gap-3">
            <Text className="w-12 text-footnote text-txt-dim">Peso</Text>
            <View className="flex-1">
              <Stepper
                value={weightKg}
                onChange={setWeightKg}
                step={2.5}
                min={0}
                max={500}
                display={`${formatKg(weightKg)} kg`}
              />
            </View>
          </View>
          <View className="flex-row items-center gap-2">
            <Chip label="Calentamiento" selected={warmup} onPress={() => setWarmup((prev) => !prev)} />
            <View className="flex-1" />
            <PressableScale onPress={onRemove} hitSlop={8}>
              <Trash2 color={palette.text.tertiary} size={18} strokeWidth={2} />
            </PressableScale>
            <PressableScale onPress={confirm}>
              <Text className="overflow-hidden rounded-chip bg-tint/15 px-4 py-2.5 text-subhead text-tint">
                OK
              </Text>
            </PressableScale>
          </View>
        </View>
      ) : null}
    </View>
  );
}
