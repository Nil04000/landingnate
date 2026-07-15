import { router, useLocalSearchParams } from 'expo-router';
import { Trash2, X } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Food } from '@/core/db/repositories/foods.repository';
import type { MealItemWithFood, MealSlot } from '@/core/db/repositories/meals.repository';
import {
  Card,
  Chip,
  EmptyState,
  PressableScale,
  PrimaryButton,
  Screen,
  Section,
  Stepper,
} from '@/core/design-system/components';
import { haptic } from '@/core/design-system/haptics';
import { palette } from '@/core/design-system/tokens/palette';
import { formatInt } from '@/core/lib/format';
import { scaleFood } from '@/core/lib/nutrition-math';
import { repos } from '@/queries/repos';
import { useFoodSearch, useMeal, useMealMutation } from '@/queries/useNutrition';

import { FoodSearchList } from '../components/FoodSearchList';
import { SLOT_LABELS, SLOT_ORDER, slotOf } from '../components/slots';

const DEFAULT_GRAMS = 100;

/** Editor de comida (modal /meal/[id]): slot, items con gramos y búsqueda. */
export default function MealEditorScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const mealId = params.id ?? '';
  const insets = useSafeAreaInsets();

  const { data: meal } = useMeal(mealId);

  const [query, setQuery] = useState('');
  const { data: results } = useFoodSearch(query);

  const updateSlot = useMealMutation(
    (args: { dayDate: string; mealId: string; slot: MealSlot }) =>
      repos.meals.update(args.mealId, { slot: args.slot }),
  );
  const addItem = useMealMutation((args: { dayDate: string; mealId: string; foodId: string }) =>
    repos.meals.addItem(args.mealId, args.foodId, DEFAULT_GRAMS),
  );
  const updateGrams = useMealMutation(
    (args: { dayDate: string; mealId: string; itemId: string; grams: number }) =>
      repos.meals.updateItemGrams(args.itemId, args.grams),
  );
  const removeItem = useMealMutation(
    (args: { dayDate: string; mealId: string; itemId: string }) =>
      repos.meals.removeItem(args.itemId),
  );
  const saveTemplate = useMealMutation(
    (args: { dayDate: string; mealId: string; name: string }) =>
      repos.meals.saveAsTemplate(args.mealId, args.name),
  );
  const deleteMeal = useMealMutation((args: { dayDate: string; mealId: string }) =>
    repos.meals.softDelete(args.mealId),
  );

  if (meal === undefined) return <Screen scroll={false}>{null}</Screen>;

  if (meal === null) {
    return (
      <Screen scroll={false} className="justify-center">
        <EmptyState
          title="No encontramos esta comida"
          subtitle="Puede que haya sido eliminada."
          action={<PrimaryButton label="Volver" variant="tonal" onPress={() => router.back()} />}
        />
      </Screen>
    );
  }

  const slot = slotOf(meal.slot);
  const t = meal.totals;

  const selectFood = (food: Food) => {
    addItem.mutate(
      { dayDate: meal.dayDate, mealId: meal.id, foodId: food.id },
      { onSuccess: () => setQuery('') },
    );
  };

  return (
    <View className="flex-1 bg-canvas">
      <ScrollView
        contentContainerClassName="px-5"
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center justify-between gap-3">
          <Text className="flex-1 text-title2 text-txt" numberOfLines={1}>
            {meal.name ?? SLOT_LABELS[slot]}
          </Text>
          <PressableScale onPress={() => router.back()} hitSlop={8}>
            <View className="h-9 w-9 items-center justify-center rounded-full bg-surface-2">
              <X color={palette.text.primary} size={20} strokeWidth={2} />
            </View>
          </PressableScale>
        </View>

        <View className="mt-4 flex-row flex-wrap gap-2">
          {SLOT_ORDER.map((s) => (
            <Chip
              key={s}
              label={SLOT_LABELS[s]}
              selected={s === slot}
              onPress={() => {
                if (s !== slot) {
                  updateSlot.mutate({ dayDate: meal.dayDate, mealId: meal.id, slot: s });
                }
              }}
            />
          ))}
        </View>

        <Card flush className="mt-4 flex-row px-2 py-1">
          {[
            { label: 'kcal', value: formatInt(t.kcal) },
            { label: 'Proteína', value: `${formatInt(t.proteinG)} g` },
            { label: 'Carbos', value: `${formatInt(t.carbsG)} g` },
            { label: 'Grasas', value: `${formatInt(t.fatG)} g` },
          ].map((stat) => (
            <View key={stat.label} className="flex-1 items-center py-2.5">
              <Text className="text-headline text-txt" style={{ fontVariant: ['tabular-nums'] }}>
                {stat.value}
              </Text>
              <Text className="mt-0.5 text-caption uppercase text-txt-faint">{stat.label}</Text>
            </View>
          ))}
        </Card>

        <View className="mt-6">
          <Section title="Alimentos">
            {meal.items.length === 0 ? (
              <Text className="py-2 text-footnote text-txt-faint">
                Todavía no agregaste alimentos. Buscá abajo para sumar el primero.
              </Text>
            ) : (
              <Card flush className="px-4">
                {meal.items.map((item, idx) => (
                  <MealItemRow
                    key={item.id}
                    item={item}
                    first={idx === 0}
                    onSaveGrams={(grams) =>
                      updateGrams.mutate({
                        dayDate: meal.dayDate,
                        mealId: meal.id,
                        itemId: item.id,
                        grams,
                      })
                    }
                    onRemove={() =>
                      removeItem.mutate({ dayDate: meal.dayDate, mealId: meal.id, itemId: item.id })
                    }
                  />
                ))}
              </Card>
            )}
          </Section>

          <Section title="Agregar alimento">
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar alimento…"
              placeholderTextColor={palette.text.tertiary}
              autoCorrect={false}
              className="mb-3 rounded-row bg-surface-2 px-4 py-3 text-body text-txt"
            />
            <FoodSearchList
              foods={results ?? []}
              onSelect={selectFood}
              onInspect={(food) => router.push(`/food/${food.id}`)}
            />
            <PressableScale onPress={() => router.push('/food/new')}>
              <Text className="mt-3 py-2 text-center text-subhead text-tint">
                Crear alimento nuevo
              </Text>
            </PressableScale>
          </Section>

          <PrimaryButton
            label="Guardar como plantilla"
            variant="tonal"
            disabled={meal.items.length === 0}
            onPress={() =>
              saveTemplate.mutate({
                dayDate: meal.dayDate,
                mealId: meal.id,
                name: meal.name ?? `${SLOT_LABELS[slot]} ${meal.dayDate}`,
              })
            }
          />
          <PressableScale
            onPress={() =>
              deleteMeal.mutate(
                { dayDate: meal.dayDate, mealId: meal.id },
                { onSuccess: () => router.back() },
              )
            }
          >
            <Text className="mt-3 py-2 text-center text-subhead text-danger">Eliminar comida</Text>
          </PressableScale>
        </View>
      </ScrollView>
    </View>
  );
}

type MealItemRowProps = {
  item: MealItemWithFood;
  first: boolean;
  onSaveGrams: (grams: number) => void;
  onRemove: () => void;
};

/** Fila de item: nombre + kcal computadas, gramos editables inline y borrar. */
function MealItemRow({ item, first, onSaveGrams, onRemove }: MealItemRowProps) {
  const [editing, setEditing] = useState(false);
  const [grams, setGrams] = useState(item.grams);

  const shownGrams = editing ? grams : item.grams;
  const kcal = scaleFood(item.food, shownGrams).kcal;
  const unit = item.food.isLiquid ? 'ml' : 'g';

  const toggleEdit = () => {
    haptic.select();
    setGrams(item.grams);
    setEditing((prev) => !prev);
  };

  const confirm = () => {
    setEditing(false);
    if (grams !== item.grams) onSaveGrams(grams);
  };

  return (
    <View className={first ? '' : 'border-t border-separator/50'}>
      <View className="flex-row items-center gap-3 py-3">
        <View className="flex-1">
          <Text className="text-body text-txt" numberOfLines={1}>
            {item.food.name}
          </Text>
          <Text
            className="mt-0.5 text-footnote text-txt-dim"
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {formatInt(kcal)} kcal
          </Text>
        </View>
        <PressableScale onPress={toggleEdit}>
          <Text
            className="overflow-hidden rounded-chip bg-surface-2 px-3 py-1.5 text-footnote text-txt"
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {`${formatInt(shownGrams)} ${unit}`}
          </Text>
        </PressableScale>
        <PressableScale onPress={onRemove} hitSlop={8}>
          <Trash2 color={palette.text.tertiary} size={18} strokeWidth={2} />
        </PressableScale>
      </View>

      {editing ? (
        <View className="flex-row items-center gap-3 pb-3">
          <View className="flex-1">
            <Stepper
              value={grams}
              onChange={setGrams}
              step={10}
              min={5}
              max={1000}
              display={`${formatInt(grams)} ${unit}`}
            />
          </View>
          <PressableScale onPress={confirm}>
            <Text className="overflow-hidden rounded-chip bg-tint/15 px-4 py-2.5 text-subhead text-tint">
              OK
            </Text>
          </PressableScale>
        </View>
      ) : null}
    </View>
  );
}
