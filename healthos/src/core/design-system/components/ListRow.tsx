import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { cn } from '../cn';
import { PressableScale } from './PressableScale';

type ListRowProps = {
  title: string;
  subtitle?: string | undefined;
  leading?: ReactNode | undefined;
  trailing?: ReactNode | undefined;
  onPress?: (() => void) | undefined;
  className?: string | undefined;
};

/** Fila de lista estándar (timeline de registro, ajustes, resultados de labs). */
export function ListRow({ title, subtitle, leading, trailing, onPress, className }: ListRowProps) {
  const content = (
    <View className={cn('flex-row items-center gap-3 py-3', className)}>
      {leading}
      <View className="flex-1">
        <Text className="text-body text-txt" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text className="mt-0.5 text-footnote text-txt-dim" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing}
    </View>
  );

  if (!onPress) return content;
  return <PressableScale onPress={onPress}>{content}</PressableScale>;
}
