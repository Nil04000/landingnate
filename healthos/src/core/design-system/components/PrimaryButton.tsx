import { Text } from 'react-native';

import { cn } from '../cn';
import { PressableScale } from './PressableScale';

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean | undefined;
  variant?: 'filled' | 'tonal' | undefined;
  className?: string | undefined;
};

/** Botón principal de acción (guardar, confirmar). */
export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  variant = 'filled',
  className,
}: PrimaryButtonProps) {
  return (
    <PressableScale onPress={disabled ? undefined : onPress} className={cn(className)}>
      <Text
        className={cn(
          'overflow-hidden rounded-row py-3.5 text-center text-headline',
          variant === 'filled' && !disabled && 'bg-tint text-white',
          variant === 'tonal' && !disabled && 'bg-surface-2 text-txt',
          disabled && 'bg-surface-2 text-txt-faint',
        )}
      >
        {label}
      </Text>
    </PressableScale>
  );
}
