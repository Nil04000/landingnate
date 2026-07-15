import type { ReactNode } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from './PrimaryButton';

type SheetScaffoldProps = {
  title: string;
  subtitle?: string | undefined;
  children: ReactNode;
  /** Si está presente, muestra el botón de guardar pinneado abajo */
  onSave?: (() => void) | undefined;
  saveLabel?: string | undefined;
  saveDisabled?: boolean | undefined;
};

/**
 * Esqueleto de todo sheet de registro rápido (rutas (sheets)/* con
 * presentation formSheet): grab handle, título, contenido y guardar pinneado.
 */
export function SheetScaffold({
  title,
  subtitle,
  children,
  onSave,
  saveLabel = 'Guardar',
  saveDisabled = false,
}: SheetScaffoldProps) {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-surface">
      <View className="items-center pt-2.5">
        <View className="h-1 w-9 rounded-full bg-surface-2" />
      </View>

      <View className="items-center px-5 pb-2 pt-4">
        <Text className="text-title2 text-txt">{title}</Text>
        {subtitle ? <Text className="mt-0.5 text-footnote text-txt-dim">{subtitle}</Text> : null}
      </View>

      <ScrollView
        contentContainerClassName="px-5 pb-6 pt-2"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>

      {onSave ? (
        <View className="px-5" style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
          <PrimaryButton label={saveLabel} onPress={onSave} disabled={saveDisabled} />
        </View>
      ) : null}
    </View>
  );
}
