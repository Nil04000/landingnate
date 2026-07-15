import { Text } from 'react-native';

import { cn } from '../cn';
import { haptic } from '../haptics';
import { PressableScale } from './PressableScale';

type ChipProps = {
  label: string;
  selected?: boolean | undefined;
  onPress: () => void;
  className?: string | undefined;
};

/** Chip seleccionable (presets: +250 ml, "Espresso", slots de comida...). */
export function Chip({ label, selected = false, onPress, className }: ChipProps) {
  return (
    <PressableScale
      onPress={() => {
        haptic.select();
        onPress();
      }}
      className={cn(className)}
    >
      <Text
        className={cn(
          'overflow-hidden rounded-chip border px-3.5 py-2 text-subhead',
          selected ? 'border-tint/40 bg-tint/15 text-tint' : 'border-stroke bg-surface-2 text-txt-dim',
        )}
      >
        {label}
      </Text>
    </PressableScale>
  );
}
