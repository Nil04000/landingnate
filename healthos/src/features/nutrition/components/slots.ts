import type { MealSlot } from '@/core/db/repositories/meals.repository';

/** Orden canónico de los slots en el tab Nutrición. */
export const SLOT_ORDER: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snack'];

/** Copy es-AR de cada slot. */
export const SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: 'Desayuno',
  lunch: 'Almuerzo',
  dinner: 'Cena',
  snack: 'Snack',
};

/** La DB guarda `slot` como text: normaliza a MealSlot (fallback snack). */
export function slotOf(raw: string | null | undefined): MealSlot {
  return raw != null && raw in SLOT_LABELS ? (raw as MealSlot) : 'snack';
}
