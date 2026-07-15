import { Text, View } from 'react-native';

import { Card } from '@/core/design-system/components';
import { palette } from '@/core/design-system/tokens/palette';
import { formatInt } from '@/core/lib/format';

type CoverageRow = {
  /** snake_case, matchea nutrient_targets */
  nutrientKey: string;
  displayName: string;
  /** 0..1 (clampeado) */
  coverage: number;
};

type MicroCoverageCardProps = {
  averagePct: number | null;
  /** Ordenados por menor cobertura (los déficits primero). */
  items: CoverageRow[];
};

const TOP_DEFICITS = 4;

function barColor(coverage: number): string {
  return coverage < 0.5 ? palette.metric.activity : palette.metric.nutrition;
}

/** Cobertura de micronutrientes del día: promedio general + top déficits. */
export function MicroCoverageCard({ averagePct, items }: MicroCoverageCardProps) {
  const deficits = items.slice(0, TOP_DEFICITS);

  return (
    <Card>
      <View className="flex-row items-baseline justify-between">
        <Text className="text-headline text-txt">Cobertura promedio</Text>
        <Text className="text-subhead text-txt-dim" style={{ fontVariant: ['tabular-nums'] }}>
          {averagePct != null ? `${formatInt(averagePct)}%` : '—'}
        </Text>
      </View>

      <View className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2">
        <View
          className="h-2 rounded-full"
          style={{
            width: `${Math.min(100, Math.max(0, averagePct ?? 0))}%`,
            backgroundColor: palette.metric.nutrition,
          }}
        />
      </View>

      {deficits.length > 0 ? (
        <View className="mt-4 gap-3">
          {deficits.map((item) => (
            <View key={item.nutrientKey}>
              <View className="flex-row items-baseline justify-between">
                <Text className="text-footnote text-txt-dim" numberOfLines={1}>
                  {item.displayName}
                </Text>
                <Text
                  className="text-footnote text-txt-faint"
                  style={{ fontVariant: ['tabular-nums'] }}
                >
                  {formatInt(item.coverage * 100)}%
                </Text>
              </View>
              <View className="mt-1 h-1 overflow-hidden rounded-full bg-surface-2">
                <View
                  className="h-1 rounded-full"
                  style={{
                    width: `${Math.min(100, item.coverage * 100)}%`,
                    backgroundColor: barColor(item.coverage),
                  }}
                />
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </Card>
  );
}
