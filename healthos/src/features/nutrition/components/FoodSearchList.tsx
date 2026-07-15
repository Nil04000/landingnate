import { Plus } from 'lucide-react-native';
import { Text, View } from 'react-native';

import type { Food } from '@/core/db/repositories/foods.repository';
import { Card, PressableScale } from '@/core/design-system/components';
import { haptic } from '@/core/design-system/haptics';
import { palette } from '@/core/design-system/tokens/palette';
import { formatInt } from '@/core/lib/format';

type FoodSearchListProps = {
  foods: Food[];
  /** Tap: agrega el alimento a la comida. */
  onSelect: (food: Food) => void;
  /** Mantener apretado: inspecciona la ficha del alimento. */
  onInspect: (food: Food) => void;
};

const MAX_VISIBLE = 15;

/** Resultados de búsqueda de la biblioteca (tap agrega, long-press inspecciona). */
export function FoodSearchList({ foods, onSelect, onInspect }: FoodSearchListProps) {
  if (foods.length === 0) {
    return (
      <Text className="py-4 text-center text-footnote text-txt-faint">
        Sin resultados. Probá con otro nombre o creá el alimento.
      </Text>
    );
  }

  return (
    <Card flush className="px-4">
      {foods.slice(0, MAX_VISIBLE).map((food, idx) => (
        <PressableScale
          key={food.id}
          onPress={() => onSelect(food)}
          onLongPress={() => {
            haptic.select();
            onInspect(food);
          }}
        >
          <View
            className={`flex-row items-center gap-3 py-3 ${idx > 0 ? 'border-t border-separator/50' : ''}`}
          >
            <View className="flex-1">
              <Text className="text-body text-txt" numberOfLines={1}>
                {food.name}
              </Text>
              <Text className="mt-0.5 text-footnote text-txt-dim" numberOfLines={1}>
                {food.brand ? `${food.brand} · ` : ''}
                {formatInt(food.kcal)} kcal /100 {food.isLiquid ? 'ml' : 'g'}
              </Text>
            </View>
            <Plus color={palette.text.tertiary} size={18} strokeWidth={2} />
          </View>
        </PressableScale>
      ))}
    </Card>
  );
}
