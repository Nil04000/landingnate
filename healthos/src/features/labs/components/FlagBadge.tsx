import { Text } from 'react-native';

import type { LabFlag } from '@/core/db/repositories/labs.repository';
import { cn } from '@/core/design-system/cn';

import { FLAG_LABELS, isLabFlag } from './format';

const FLAG_CLASSES: Record<LabFlag, string> = {
  optimal: 'bg-success/15 text-success',
  in_range: 'bg-tint/15 text-tint',
  low: 'bg-warning/15 text-warning',
  high: 'bg-danger/15 text-danger',
};

type FlagBadgeProps = {
  /** Flag tal como viene de la DB (string | null); null → "—". */
  flag: string | null | undefined;
  className?: string | undefined;
};

/** Pill de estado de un resultado: Óptimo / En rango / Bajo / Alto. */
export function FlagBadge({ flag, className }: FlagBadgeProps) {
  const known = isLabFlag(flag) ? flag : null;
  return (
    <Text
      className={cn(
        'overflow-hidden rounded-chip px-2 py-1 text-caption uppercase',
        known ? FLAG_CLASSES[known] : 'bg-surface-2 text-txt-faint',
        className,
      )}
    >
      {known ? FLAG_LABELS[known] : '—'}
    </Text>
  );
}
