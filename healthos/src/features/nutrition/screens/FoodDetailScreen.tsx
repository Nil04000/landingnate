import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { Card, EmptyState, PressableScale, Screen, Section } from '@/core/design-system/components';
import { formatDecimal, formatInt } from '@/core/lib/format';
import type { NutrientKey } from '@/core/lib/nutrition-math';
import { useFood } from '@/queries/useNutrition';

const NUTRIENT_LABELS: Record<NutrientKey, string> = {
  kcal: 'Calorías',
  proteinG: 'Proteína',
  carbsG: 'Carbohidratos',
  fatG: 'Grasas',
  fiberG: 'Fibra',
  sugarG: 'Azúcares',
  saturatedFatG: 'Grasas saturadas',
  monounsatFatG: 'Monoinsaturadas',
  polyunsatFatG: 'Poliinsaturadas',
  transFatG: 'Grasas trans',
  cholesterolMg: 'Colesterol',
  sodiumMg: 'Sodio',
  potassiumMg: 'Potasio',
  calciumMg: 'Calcio',
  ironMg: 'Hierro',
  magnesiumMg: 'Magnesio',
  zincMg: 'Zinc',
  phosphorusMg: 'Fósforo',
  seleniumUg: 'Selenio',
  copperMg: 'Cobre',
  manganeseMg: 'Manganeso',
  iodineUg: 'Yodo',
  vitaminAUg: 'Vitamina A',
  vitaminB1Mg: 'Vitamina B1 (tiamina)',
  vitaminB2Mg: 'Vitamina B2 (riboflavina)',
  vitaminB3Mg: 'Vitamina B3 (niacina)',
  vitaminB5Mg: 'Vitamina B5',
  vitaminB6Mg: 'Vitamina B6',
  vitaminB7Ug: 'Biotina (B7)',
  vitaminB9Ug: 'Folato (B9)',
  vitaminB12Ug: 'Vitamina B12',
  vitaminCMg: 'Vitamina C',
  vitaminDUg: 'Vitamina D',
  vitaminEMg: 'Vitamina E',
  vitaminKUg: 'Vitamina K',
  cholineMg: 'Colina',
  caffeineMg: 'Cafeína',
  alcoholG: 'Alcohol',
  waterG: 'Agua',
};

const GROUPS: { title: string; keys: NutrientKey[] }[] = [
  {
    title: 'Energía y macros',
    keys: ['kcal', 'proteinG', 'carbsG', 'fatG', 'fiberG', 'sugarG', 'saturatedFatG'],
  },
  {
    title: 'Grasas detalle',
    keys: ['monounsatFatG', 'polyunsatFatG', 'transFatG', 'cholesterolMg'],
  },
  {
    title: 'Minerales',
    keys: [
      'sodiumMg',
      'potassiumMg',
      'calciumMg',
      'ironMg',
      'magnesiumMg',
      'zincMg',
      'phosphorusMg',
      'seleniumUg',
      'copperMg',
      'manganeseMg',
      'iodineUg',
    ],
  },
  {
    title: 'Vitaminas',
    keys: [
      'vitaminAUg',
      'vitaminB1Mg',
      'vitaminB2Mg',
      'vitaminB3Mg',
      'vitaminB5Mg',
      'vitaminB6Mg',
      'vitaminB7Ug',
      'vitaminB9Ug',
      'vitaminB12Ug',
      'vitaminCMg',
      'vitaminDUg',
      'vitaminEMg',
      'vitaminKUg',
      'cholineMg',
    ],
  },
];

function unitOf(key: NutrientKey): string {
  if (key === 'kcal') return 'kcal';
  if (key.endsWith('Mg')) return 'mg';
  if (key.endsWith('Ug')) return 'µg';
  return 'g';
}

function formatValue(value: number): string {
  return Number.isInteger(value) ? formatInt(value) : formatDecimal(value, 1);
}

/** Ficha de alimento (push /food/[id]): tabla de nutrientes por 100 g/ml. */
export default function FoodDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { data } = useFood(params.id ?? '');

  if (!data) return <Screen scroll={false}>{null}</Screen>;

  const { food, portions } = data;

  if (!food) {
    return (
      <Screen scroll={false} className="justify-center">
        <EmptyState
          title="No encontramos este alimento"
          subtitle="Puede que haya sido eliminado de la biblioteca."
        />
      </Screen>
    );
  }

  const per100 = food.isLiquid ? '/100 ml' : '/100 g';

  return (
    <Screen>
      <View className="mb-4 mt-1 flex-row items-center gap-2">
        <PressableScale onPress={() => router.back()}>
          <View className="h-9 w-9 items-center justify-center rounded-full bg-surface-2">
            <ChevronLeft color="#F5F5F7" size={20} strokeWidth={2} />
          </View>
        </PressableScale>
        <View className="flex-1">
          <Text className="text-title2 text-txt" numberOfLines={2}>
            {food.name}
          </Text>
          {food.brand ? (
            <Text className="text-footnote text-txt-dim" numberOfLines={1}>
              {food.brand}
            </Text>
          ) : null}
        </View>
        <Text className="overflow-hidden rounded-chip bg-surface-2 px-2.5 py-1 text-caption uppercase text-txt-dim">
          {food.source === 'seed' ? 'Biblioteca' : 'Propio'}
        </Text>
      </View>

      {GROUPS.map((group) => {
        const rows = group.keys
          .map((key) => ({ key, value: food[key] }))
          .filter((row): row is { key: NutrientKey; value: number } => row.value != null);
        if (rows.length === 0) return null;
        return (
          <Section key={group.title} title={group.title}>
            <Card flush className="px-4">
              {rows.map((row, idx) => (
                <View
                  key={row.key}
                  className={`flex-row items-center justify-between gap-3 py-3 ${idx > 0 ? 'border-t border-separator/50' : ''}`}
                >
                  <Text className="flex-1 text-body text-txt" numberOfLines={1}>
                    {NUTRIENT_LABELS[row.key]}
                  </Text>
                  <Text
                    className="text-body text-txt-dim"
                    style={{ fontVariant: ['tabular-nums'] }}
                  >
                    {`${formatValue(row.value)} ${unitOf(row.key)} ${per100}`}
                  </Text>
                </View>
              ))}
            </Card>
          </Section>
        );
      })}

      {portions.length > 0 ? (
        <Section title="Porciones">
          <Card flush className="px-4">
            {portions.map((portion, idx) => (
              <View
                key={portion.id}
                className={`flex-row items-center justify-between gap-3 py-3 ${idx > 0 ? 'border-t border-separator/50' : ''}`}
              >
                <Text className="flex-1 text-body text-txt" numberOfLines={1}>
                  {portion.name}
                </Text>
                <Text className="text-body text-txt-dim" style={{ fontVariant: ['tabular-nums'] }}>
                  {`${formatInt(portion.grams)} g`}
                </Text>
              </View>
            ))}
          </Card>
        </Section>
      ) : null}
    </Screen>
  );
}
