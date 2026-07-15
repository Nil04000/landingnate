import { router } from 'expo-router';
import { ChevronDown, ChevronUp, X } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { FoodInput } from '@/core/db/repositories/foods.repository';
import { Chip, PressableScale, PrimaryButton } from '@/core/design-system/components';
import { haptic } from '@/core/design-system/haptics';
import { palette } from '@/core/design-system/tokens/palette';
import { repos } from '@/queries/repos';
import { useFoodMutation } from '@/queries/useNutrition';

type NumericKey =
  | 'kcal'
  | 'proteinG'
  | 'carbsG'
  | 'fatG'
  | 'fiberG'
  | 'sugarG'
  | 'saturatedFatG'
  | 'sodiumMg'
  | 'potassiumMg'
  | 'calciumMg'
  | 'ironMg'
  | 'magnesiumMg'
  | 'zincMg'
  | 'vitaminCMg'
  | 'vitaminDUg'
  | 'vitaminB12Ug';

type FieldSpec = { key: NumericKey; label: string };

const MACRO_FIELDS: FieldSpec[] = [
  { key: 'kcal', label: 'Calorías (kcal)' },
  { key: 'proteinG', label: 'Proteína (g)' },
  { key: 'carbsG', label: 'Carbohidratos (g)' },
  { key: 'fatG', label: 'Grasas (g)' },
];

const MICRO_FIELDS: FieldSpec[] = [
  { key: 'fiberG', label: 'Fibra (g)' },
  { key: 'sugarG', label: 'Azúcares (g)' },
  { key: 'saturatedFatG', label: 'Grasas saturadas (g)' },
  { key: 'sodiumMg', label: 'Sodio (mg)' },
  { key: 'potassiumMg', label: 'Potasio (mg)' },
  { key: 'calciumMg', label: 'Calcio (mg)' },
  { key: 'ironMg', label: 'Hierro (mg)' },
  { key: 'magnesiumMg', label: 'Magnesio (mg)' },
  { key: 'zincMg', label: 'Zinc (mg)' },
  { key: 'vitaminCMg', label: 'Vitamina C (mg)' },
  { key: 'vitaminDUg', label: 'Vitamina D (µg)' },
  { key: 'vitaminB12Ug', label: 'Vitamina B12 (µg)' },
];

/** Acepta coma decimal es-AR ("12,5"). Vacío o inválido → undefined. */
function parseNum(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const value = Number(trimmed.replace(',', '.'));
  return Number.isFinite(value) ? value : undefined;
}

function emptyValues(): Record<NumericKey, string> {
  return Object.fromEntries(
    [...MACRO_FIELDS, ...MICRO_FIELDS].map((field) => [field.key, '']),
  ) as Record<NumericKey, string>;
}

/** Alta de alimento propio (modal /food/new): macros + micros opcionales. */
export default function FoodCreateScreen() {
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [isLiquid, setIsLiquid] = useState(false);
  const [values, setValues] = useState<Record<NumericKey, string>>(emptyValues);
  const [showMicros, setShowMicros] = useState(false);

  const mutation = useFoodMutation((input: FoodInput) => repos.foods.create(input));

  const canSave = name.trim() !== '' && parseNum(values.kcal) != null;

  const setValue = (key: NumericKey, raw: string) =>
    setValues((prev) => ({ ...prev, [key]: raw }));

  const save = () => {
    if (!canSave) return;
    const input: FoodInput = {
      name: name.trim(),
      isLiquid: isLiquid ? 1 : 0,
      kcal: parseNum(values.kcal) ?? 0,
      proteinG: parseNum(values.proteinG) ?? 0,
      carbsG: parseNum(values.carbsG) ?? 0,
      fatG: parseNum(values.fatG) ?? 0,
    };
    const trimmedBrand = brand.trim();
    if (trimmedBrand) input.brand = trimmedBrand;
    for (const field of MICRO_FIELDS) {
      const value = parseNum(values[field.key]);
      if (value != null) input[field.key] = value;
    }
    mutation.mutate(input, { onSuccess: () => router.back() });
  };

  return (
    <View className="flex-1 bg-canvas">
      <ScrollView
        contentContainerClassName="px-5 pb-6"
        contentContainerStyle={{ paddingTop: insets.top + 16 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center justify-between gap-3">
          <Text className="flex-1 text-title2 text-txt">Nuevo alimento</Text>
          <PressableScale onPress={() => router.back()} hitSlop={8}>
            <View className="h-9 w-9 items-center justify-center rounded-full bg-surface-2">
              <X color={palette.text.primary} size={20} strokeWidth={2} />
            </View>
          </PressableScale>
        </View>
        <Text className="mt-1 text-footnote text-txt-dim">
          Todos los valores son por 100 {isLiquid ? 'ml' : 'g'}.
        </Text>

        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Nombre (ej. Yogur griego)"
          placeholderTextColor={palette.text.tertiary}
          className="mt-5 rounded-row bg-surface-2 px-4 py-3 text-body text-txt"
        />
        <TextInput
          value={brand}
          onChangeText={setBrand}
          placeholder="Marca (opcional)"
          placeholderTextColor={palette.text.tertiary}
          className="mt-3 rounded-row bg-surface-2 px-4 py-3 text-body text-txt"
        />

        <View className="mt-3 flex-row">
          <Chip
            label="Es líquido (por 100 ml)"
            selected={isLiquid}
            onPress={() => setIsLiquid((prev) => !prev)}
          />
        </View>

        <Text className="mb-3 mt-6 text-caption uppercase text-txt-faint">Energía y macros</Text>
        <View className="flex-row flex-wrap justify-between">
          {MACRO_FIELDS.map((field) => (
            <NumericField
              key={field.key}
              label={field.label}
              value={values[field.key]}
              onChange={(raw) => setValue(field.key, raw)}
            />
          ))}
        </View>

        <PressableScale
          onPress={() => {
            haptic.select();
            setShowMicros((prev) => !prev);
          }}
        >
          <View className="mt-3 flex-row items-center justify-between rounded-row border border-stroke bg-surface px-4 py-3">
            <Text className="text-subhead text-txt">Micronutrientes (opcional)</Text>
            {showMicros ? (
              <ChevronUp color={palette.text.secondary} size={18} strokeWidth={2} />
            ) : (
              <ChevronDown color={palette.text.secondary} size={18} strokeWidth={2} />
            )}
          </View>
        </PressableScale>

        {showMicros ? (
          <View className="mt-4 flex-row flex-wrap justify-between">
            {MICRO_FIELDS.map((field) => (
              <NumericField
                key={field.key}
                label={field.label}
                value={values[field.key]}
                onChange={(raw) => setValue(field.key, raw)}
              />
            ))}
          </View>
        ) : null}
      </ScrollView>

      <View className="px-5 pt-3" style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
        <PrimaryButton label="Guardar alimento" onPress={save} disabled={!canSave} />
      </View>
    </View>
  );
}

type NumericFieldProps = {
  label: string;
  value: string;
  onChange: (raw: string) => void;
};

function NumericField({ label, value, onChange }: NumericFieldProps) {
  return (
    <View className="mb-3 w-[48.5%]">
      <Text className="mb-1.5 text-footnote text-txt-dim" numberOfLines={1}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType="decimal-pad"
        placeholder="0"
        placeholderTextColor={palette.text.tertiary}
        className="rounded-row bg-surface-2 px-4 py-3 text-body text-txt"
        style={{ fontVariant: ['tabular-nums'] }}
      />
    </View>
  );
}
