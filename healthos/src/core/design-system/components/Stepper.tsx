import { Minus, Plus } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { Text, View } from 'react-native';

import { haptic } from '../haptics';
import { palette } from '../tokens/palette';
import { PressableScale } from './PressableScale';

type StepperProps = {
  value: number;
  onChange: (next: number) => void;
  step?: number | undefined;
  min?: number | undefined;
  max?: number | undefined;
  /** Texto grande central (ej. "500 ml"); si falta, muestra el valor crudo */
  display?: string | undefined;
};

/** Stepper ± con aceleración al mantener presionado y háptico por paso. */
export function Stepper({ value, onChange, step = 1, min = 0, max = 9999, display }: StepperProps) {
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const current = useRef(value);

  useEffect(() => {
    current.current = value;
  }, [value]);

  const bump = (dir: 1 | -1) => {
    const next = Math.min(max, Math.max(min, current.current + dir * step));
    if (next !== current.current) {
      haptic.select();
      onChange(next);
    }
  };

  const startHold = (dir: 1 | -1) => {
    stopHold();
    timer.current = setInterval(() => bump(dir), 110);
  };

  const stopHold = () => {
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
  };

  const buttonClass =
    'h-12 w-12 items-center justify-center rounded-full border border-stroke bg-surface-2';

  return (
    <View className="flex-row items-center justify-between">
      <PressableScale
        onPress={() => bump(-1)}
        onLongPress={() => startHold(-1)}
        onPressOut={stopHold}
        className={buttonClass}
      >
        <Minus color={palette.text.secondary} size={22} strokeWidth={2} />
      </PressableScale>

      <Text className="text-title1 text-txt" style={{ fontVariant: ['tabular-nums'] }}>
        {display ?? String(value)}
      </Text>

      <PressableScale
        onPress={() => bump(1)}
        onLongPress={() => startHold(1)}
        onPressOut={stopHold}
        className={buttonClass}
      >
        <Plus color={palette.text.secondary} size={22} strokeWidth={2} />
      </PressableScale>
    </View>
  );
}
