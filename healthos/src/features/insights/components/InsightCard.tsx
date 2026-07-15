import { router } from 'expo-router';
import { X } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { Card, PressableScale } from '@/core/design-system/components';
import { haptic } from '@/core/design-system/haptics';
import { palette } from '@/core/design-system/tokens/palette';
import type { ParsedInsight } from '@/queries/useInsights';
import { useInsightAction } from '@/queries/useInsights';

import { KIND_LABELS, severityColor } from './insight-ui';

type InsightCardProps = {
  insight: ParsedInsight;
  /** compact: card chica para Inicio (sin descartar) */
  compact?: boolean | undefined;
};

export function InsightCard({ insight, compact = false }: InsightCardProps) {
  const dismiss = useInsightAction('dismiss');

  return (
    <PressableScale
      onPress={() => {
        haptic.select();
        router.push(`/insights/${insight.id}`);
      }}
    >
      <Card>
        <View className="flex-row items-start justify-between gap-2">
          <View className="flex-1">
            <View className="flex-row items-center gap-1.5">
              <View
                style={{ backgroundColor: severityColor(insight.severity) }}
                className="h-1.5 w-1.5 rounded-full"
              />
              <Text className="text-caption uppercase text-txt-faint">
                {KIND_LABELS[insight.kind] ?? insight.kind}
              </Text>
              {insight.status === 'new' ? (
                <View className="rounded-full bg-tint/15 px-1.5 py-0.5">
                  <Text className="text-caption text-tint">Nuevo</Text>
                </View>
              ) : null}
            </View>
            <Text className="mt-1.5 text-headline text-txt">{insight.title}</Text>
            {!compact ? (
              <Text className="mt-1 text-subhead leading-5 text-txt-dim">{insight.body}</Text>
            ) : null}
          </View>
          {!compact ? (
            <PressableScale
              onPress={() => {
                haptic.select();
                dismiss.mutate(insight.id);
              }}
            >
              <View className="h-7 w-7 items-center justify-center rounded-full bg-surface-2">
                <X color={palette.text.tertiary} size={14} strokeWidth={2} />
              </View>
            </PressableScale>
          ) : null}
        </View>
      </Card>
    </PressableScale>
  );
}
