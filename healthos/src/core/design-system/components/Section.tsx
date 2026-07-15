import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { cn } from '../cn';

type SectionProps = {
  title?: string;
  /** Acción a la derecha del título (ej. "Ver todo") */
  trailing?: ReactNode;
  children: ReactNode;
  className?: string;
};

/** Bloque de pantalla con label caption uppercase estilo iOS. */
export function Section({ title, trailing, children, className }: SectionProps) {
  return (
    <View className={cn('mb-6', className)}>
      {title ? (
        <View className="mb-3 flex-row items-center justify-between px-1">
          <Text className="text-caption uppercase text-txt-faint">{title}</Text>
          {trailing}
        </View>
      ) : null}
      {children}
    </View>
  );
}
