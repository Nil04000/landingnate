import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cn } from '../cn';

type ScreenProps = {
  children: ReactNode;
  /** true (default): contenido scrolleable con gutter; false: layout propio */
  scroll?: boolean;
  className?: string;
  /** Padding extra abajo para no chocar con la tab bar flotante */
  bottomInset?: boolean;
};

/**
 * Contenedor raíz de toda pantalla: fondo canvas, safe area y gutter de 20.
 */
export function Screen({ children, scroll = true, className, bottomInset = true }: ScreenProps) {
  const insets = useSafeAreaInsets();

  if (!scroll) {
    return (
      <View
        className={cn('flex-1 bg-canvas', className)}
        style={{ paddingTop: insets.top }}
      >
        {children}
      </View>
    );
  }

  return (
    <View className="flex-1 bg-canvas">
      <ScrollView
        contentContainerClassName={cn('px-5', className)}
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: bottomInset ? insets.bottom + 104 : insets.bottom + 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </View>
  );
}
