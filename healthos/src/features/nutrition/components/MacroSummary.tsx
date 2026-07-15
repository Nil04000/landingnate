import { Text, View } from 'react-native';

import { Card, RingProgress } from '@/core/design-system/components';
import { palette } from '@/core/design-system/tokens/palette';
import { formatInt } from '@/core/lib/format';
import type { NutrientTotals } from '@/core/lib/nutrition-math';

// TODO objetivos reales via tabla goals
const MACRO_TARGETS = {
  proteinG: 150,
  carbsG: 250,
  fatG: 80,
} as const;

type MacroKey = keyof typeof MACRO_TARGETS;

const RINGS: { key: MacroKey; label: string; color: string }[] = [
  { key: 'proteinG', label: 'Proteína', color: palette.metric.nutrition },
  { key: 'carbsG', label: 'Carbos', color: '#FF9F0A' },
  { key: 'fatG', label: 'Grasas', color: '#FFD60A' },
];

type MacroSummaryProps = {
  totals: NutrientTotals;
  hasMeals: boolean;
};

/** Card resumen del día: kcal grandes + mini anillos de macros vs objetivo. */
export function MacroSummary({ totals, hasMeals }: MacroSummaryProps) {
  return (
    <Card>
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-caption uppercase text-txt-faint">Calorías</Text>
          <Text className="mt-1 text-display text-txt" style={{ fontVariant: ['tabular-nums'] }}>
            {hasMeals ? formatInt(totals.kcal) : '—'}
          </Text>
          <Text className="text-footnote text-txt-dim">kcal</Text>
        </View>

        <View className="flex-row gap-3">
          {RINGS.map((ring) => (
            <View key={ring.key} className="items-center">
              <RingProgress
                progress={hasMeals ? totals[ring.key] / MACRO_TARGETS[ring.key] : 0}
                size={46}
                strokeWidth={5}
                color={ring.color}
              />
              <Text className="mt-1.5 text-caption uppercase text-txt-faint">{ring.label}</Text>
              <Text
                className="mt-0.5 text-footnote text-txt-dim"
                style={{ fontVariant: ['tabular-nums'] }}
              >
                {hasMeals ? `${formatInt(totals[ring.key])}/${MACRO_TARGETS[ring.key]} g` : '—'}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </Card>
  );
}
