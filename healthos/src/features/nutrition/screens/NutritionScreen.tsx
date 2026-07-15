import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { router } from 'expo-router';
import { Leaf, Plus } from 'lucide-react-native';
import { ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import type {
  Meal,
  MealSlot,
  MealTemplate,
  MealWithItems,
} from '@/core/db/repositories/meals.repository';
import {
  Card,
  Chip,
  DateStrip,
  EmptyState,
  PressableScale,
  Screen,
  Section,
} from '@/core/design-system/components';
import { haptic } from '@/core/design-system/haptics';
import { STAGGER_MS, durations } from '@/core/design-system/tokens/motion';
import { palette } from '@/core/design-system/tokens/palette';
import { fromLocalDate, todayLocal } from '@/core/lib/dates';
import { formatInt } from '@/core/lib/format';
import { sumTotals } from '@/core/lib/nutrition-math';
import { useUiStore } from '@/core/state/ui.store';
import { repos } from '@/queries/repos';
import {
  useDayMeals,
  useMealMutation,
  useMealTemplates,
  useMicroCoverage,
} from '@/queries/useNutrition';

import { MacroSummary } from '../components/MacroSummary';
import { MicroCoverageCard } from '../components/MicroCoverageCard';
import { SLOT_LABELS, SLOT_ORDER, slotOf } from '../components/slots';

/** Tab Nutrición: macros del día, comidas por slot, plantillas y micros. */
export default function NutritionScreen() {
  const selectedDate = useUiStore((s) => s.selectedDate);
  const setSelectedDate = useUiStore((s) => s.setSelectedDate);

  const { data: meals } = useDayMeals(selectedDate);
  const { data: templates } = useMealTemplates();
  const { data: coverage } = useMicroCoverage(selectedDate);

  const createMeal = useMealMutation((args: { dayDate: string; slot: MealSlot }) =>
    repos.meals.create({ dayDate: args.dayDate, slot: args.slot }),
  );

  const applyTemplate = useMealMutation(
    (args: { dayDate: string; templateId: string; slot: MealSlot }) =>
      repos.meals.applyTemplate(args.templateId, args.dayDate, args.slot),
  );

  const hasMeals = (meals?.length ?? 0) > 0;
  const dayTotals = sumTotals((meals ?? []).map((m) => m.totals));

  const isToday = selectedDate === todayLocal();
  const dateLabel = isToday
    ? 'Hoy'
    : format(fromLocalDate(selectedDate), "EEEE d 'de' MMMM", { locale: es });

  const openCreated = ({ result }: { result: unknown }) => {
    router.push(`/meal/${(result as Meal).id}`);
  };

  const addMeal = (slot: MealSlot) => {
    createMeal.mutate({ dayDate: selectedDate, slot }, { onSuccess: openCreated });
  };

  const applyTemplateToDay = (template: MealTemplate) => {
    applyTemplate.mutate(
      { dayDate: selectedDate, templateId: template.id, slot: slotOf(template.slot) },
      { onSuccess: openCreated },
    );
  };

  return (
    <Screen className="px-0">
      <Animated.View
        entering={FadeInDown.duration(durations.base)}
        className="mb-2 mt-2 flex-row items-end justify-between px-5"
      >
        <Text className="text-title1 text-txt">Nutrición</Text>
        <Text className="pb-1 text-footnote capitalize text-txt-dim">{dateLabel}</Text>
      </Animated.View>

      <View className="mb-4">
        <DateStrip selected={selectedDate} onChange={setSelectedDate} />
      </View>

      <View className="px-5">
        <Animated.View
          entering={FadeInDown.duration(durations.base).delay(STAGGER_MS)}
          className="mb-6"
        >
          <MacroSummary totals={dayTotals} hasMeals={hasMeals} />
        </Animated.View>

        {SLOT_ORDER.map((slot, i) => {
          const slotMeals = (meals ?? []).filter((m) => m.slot === slot);
          return (
            <Animated.View
              key={slot}
              entering={FadeInDown.duration(durations.base).delay((i + 2) * STAGGER_MS)}
            >
              <Section title={SLOT_LABELS[slot]}>
                <View className="gap-2">
                  {slotMeals.map((meal) => (
                    <MealCard key={meal.id} meal={meal} fallbackName={SLOT_LABELS[slot]} />
                  ))}
                  <PressableScale onPress={() => addMeal(slot)}>
                    <View className="flex-row items-center justify-center gap-1.5 rounded-row border border-dashed border-stroke py-3">
                      <Plus color={palette.text.tertiary} size={16} strokeWidth={2} />
                      <Text className="text-subhead text-txt-dim">Agregar</Text>
                    </View>
                  </PressableScale>
                </View>
              </Section>
            </Animated.View>
          );
        })}

        {templates != null && templates.length > 0 ? (
          <Animated.View entering={FadeInDown.duration(durations.base).delay(6 * STAGGER_MS)}>
            <Section title="Plantillas">
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  {templates.map((template) => (
                    <Chip
                      key={template.id}
                      label={template.name}
                      onPress={() => applyTemplateToDay(template)}
                    />
                  ))}
                </View>
              </ScrollView>
            </Section>
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInDown.duration(durations.base).delay(7 * STAGGER_MS)}>
          {hasMeals && coverage ? (
            <Section title="Micronutrientes">
              <MicroCoverageCard averagePct={coverage.averagePct} items={coverage.items} />
            </Section>
          ) : (
            <EmptyState
              icon={<Leaf color={palette.text.tertiary} size={32} strokeWidth={1.5} />}
              title="Registrá tu primera comida"
              subtitle="La cobertura de micronutrientes del día aparece acá."
            />
          )}
        </Animated.View>
      </View>
    </Screen>
  );
}

function MealCard({ meal, fallbackName }: { meal: MealWithItems; fallbackName: string }) {
  const t = meal.totals;
  return (
    <PressableScale
      onPress={() => {
        haptic.select();
        router.push(`/meal/${meal.id}`);
      }}
    >
      <Card>
        <Text className="text-body text-txt" numberOfLines={1}>
          {meal.name ?? fallbackName}
        </Text>
        <Text
          className="mt-1 text-footnote text-txt-dim"
          style={{ fontVariant: ['tabular-nums'] }}
        >
          {`${formatInt(t.kcal)} kcal · P ${formatInt(t.proteinG)} · C ${formatInt(t.carbsG)} · G ${formatInt(t.fatG)}`}
        </Text>
      </Card>
    </PressableScale>
  );
}
