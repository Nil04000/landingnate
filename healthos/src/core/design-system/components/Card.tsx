import type { ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';

import { cn } from '../cn';

type CardProps = ViewProps & {
  children: ReactNode;
  /** Sin padding interno (para contenido edge-to-edge como gráficos) */
  flush?: boolean;
};

/**
 * Card canónica: fill surface + borde 1px, radio 20, sin sombras en dark
 * (la elevación se comunica con pasos de fill: canvas → surface → surface-2).
 */
export function Card({ children, className, flush = false, ...rest }: CardProps) {
  return (
    <View
      {...rest}
      className={cn('rounded-card border border-stroke bg-surface', !flush && 'p-4', className)}
    >
      {children}
    </View>
  );
}
