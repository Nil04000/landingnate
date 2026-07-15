import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

/** Estado vacío centrado, discreto, con acción opcional. */
export function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <View className="items-center justify-center px-8 py-12">
      {icon ? <View className="mb-4">{icon}</View> : null}
      <Text className="text-center text-headline text-txt">{title}</Text>
      {subtitle ? (
        <Text className="mt-1.5 text-center text-subhead text-txt-dim">{subtitle}</Text>
      ) : null}
      {action ? <View className="mt-5">{action}</View> : null}
    </View>
  );
}
