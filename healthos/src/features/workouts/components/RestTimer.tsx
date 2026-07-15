import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';

import { PressableScale } from '@/core/design-system/components';
import { haptic } from '@/core/design-system/haptics';

import { formatClock } from './format';

const REST_ADJUST_S = 15;

type RestTimerProps = {
  /** Duración inicial en segundos */
  duration?: number | undefined;
  /** Fin del descanso: countdown en 0, saltar o desmontar */
  onClose: () => void;
};

/**
 * Barra de descanso: countdown mm:ss con ±15 s y saltar.
 * haptic.tick() en los últimos 3 segundos; haptic.goal() al llegar a 0.
 */
export function RestTimer({ duration = 90, onClose }: RestTimerProps) {
  const [remaining, setRemaining] = useState(duration);
  const remainingRef = useRef(duration);
  const closeRef = useRef(onClose);

  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    const id = setInterval(() => {
      const next = remainingRef.current - 1;
      remainingRef.current = next;
      if (next <= 0) {
        clearInterval(id);
        haptic.goal();
        closeRef.current();
        return;
      }
      if (next <= 3) haptic.tick();
      setRemaining(next);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const adjust = (deltaS: number) => {
    haptic.select();
    const next = Math.max(1, remainingRef.current + deltaS);
    remainingRef.current = next;
    setRemaining(next);
  };

  const pill = 'overflow-hidden rounded-chip bg-surface-2 px-3 py-2 text-subhead text-txt-dim';

  return (
    <View className="flex-row items-center gap-2 rounded-card border border-stroke bg-surface px-4 py-3">
      <View className="flex-1">
        <Text className="text-caption uppercase text-txt-faint">Descanso</Text>
        <Text className="text-title1 text-txt" style={{ fontVariant: ['tabular-nums'] }}>
          {formatClock(remaining)}
        </Text>
      </View>
      <PressableScale onPress={() => adjust(-REST_ADJUST_S)}>
        <Text className={pill}>−15 s</Text>
      </PressableScale>
      <PressableScale onPress={() => adjust(REST_ADJUST_S)}>
        <Text className={pill}>+15 s</Text>
      </PressableScale>
      <PressableScale onPress={onClose}>
        <Text className="overflow-hidden rounded-chip bg-tint/15 px-3 py-2 text-subhead text-tint">
          Saltar
        </Text>
      </PressableScale>
    </View>
  );
}
