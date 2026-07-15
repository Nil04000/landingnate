import { and, asc, eq, gte, inArray, lte } from 'drizzle-orm';

import {
  foods,
  mealItems,
  mealTemplateItems,
  mealTemplates,
  meals,
} from '../schema';
import type { AppSqliteDb } from '../types';
import type { Food, NutrientTotals } from '@/core/lib/nutrition-math';
import { scaleFood, sumTotals } from '@/core/lib/nutrition-math';
import { insertStamp, notDeleted, softDeleteStamp, updateStamp } from './base.repository';

export type Meal = typeof meals.$inferSelect;
export type MealItem = typeof mealItems.$inferSelect;
export type MealTemplate = typeof mealTemplates.$inferSelect;

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type MealItemWithFood = MealItem & { food: Food };

export type MealWithItems = Meal & {
  items: MealItemWithFood[];
  totals: NutrientTotals;
};

export class MealsRepository {
  constructor(private readonly db: AppSqliteDb) {}

  // ── Comidas ────────────────────────────────────────────────────

  create(input: {
    dayDate: string;
    slot: MealSlot;
    eatenAt?: number | undefined;
    name?: string | undefined;
  }): Meal {
    const row = {
      ...insertStamp(),
      dayDate: input.dayDate,
      slot: input.slot,
      eatenAt: input.eatenAt ?? Date.now(),
      name: input.name ?? null,
    };
    this.db.insert(meals).values(row).run();
    return this.getById(row.id)!;
  }

  update(id: string, patch: Partial<{ slot: MealSlot; eatenAt: number; name: string }>): void {
    this.db
      .update(meals)
      .set({ ...patch, ...updateStamp() })
      .where(eq(meals.id, id))
      .run();
  }

  softDelete(id: string): void {
    this.db.update(meals).set(softDeleteStamp()).where(eq(meals.id, id)).run();
    // los items quedan huérfanos lógicos: se filtran por la comida borrada
  }

  getById(id: string): Meal | undefined {
    return this.db
      .select()
      .from(meals)
      .where(and(eq(meals.id, id), notDeleted(meals.deletedAt)))
      .get();
  }

  listByDay(dayDate: string): Meal[] {
    return this.db
      .select()
      .from(meals)
      .where(and(eq(meals.dayDate, dayDate), notDeleted(meals.deletedAt)))
      .orderBy(asc(meals.eatenAt))
      .all();
  }

  listRange(from: string, to: string): Meal[] {
    return this.db
      .select()
      .from(meals)
      .where(and(gte(meals.dayDate, from), lte(meals.dayDate, to), notDeleted(meals.deletedAt)))
      .orderBy(asc(meals.dayDate))
      .all();
  }

  // ── Items ──────────────────────────────────────────────────────

  addItem(mealId: string, foodId: string, grams: number, portionId?: string): MealItem {
    const row = { ...insertStamp(), mealId, foodId, grams, portionId: portionId ?? null };
    this.db.insert(mealItems).values(row).run();
    return this.db.select().from(mealItems).where(eq(mealItems.id, row.id)).get()!;
  }

  updateItemGrams(itemId: string, grams: number): void {
    this.db
      .update(mealItems)
      .set({ grams, ...updateStamp() })
      .where(eq(mealItems.id, itemId))
      .run();
  }

  removeItem(itemId: string): void {
    this.db.update(mealItems).set(softDeleteStamp()).where(eq(mealItems.id, itemId)).run();
  }

  listItems(mealId: string): MealItemWithFood[] {
    const rows = this.db
      .select({ item: mealItems, food: foods })
      .from(mealItems)
      .innerJoin(foods, eq(mealItems.foodId, foods.id))
      .where(and(eq(mealItems.mealId, mealId), notDeleted(mealItems.deletedAt)))
      .orderBy(asc(mealItems.createdAt))
      .all();
    return rows.map((r) => ({ ...r.item, food: r.food }));
  }

  /** Comida con items + totales computados en lectura (ADR-0004). */
  getWithItems(mealId: string): MealWithItems | undefined {
    const meal = this.getById(mealId);
    if (!meal) return undefined;
    const items = this.listItems(mealId);
    const totals = sumTotals(items.map((i) => scaleFood(i.food, i.grams)));
    return { ...meal, items, totals };
  }

  /** Todas las comidas del día con items y totales (tab Nutrición, agregados). */
  listByDayWithItems(dayDate: string): MealWithItems[] {
    const dayMeals = this.listByDay(dayDate);
    if (dayMeals.length === 0) return [];

    const rows = this.db
      .select({ item: mealItems, food: foods })
      .from(mealItems)
      .innerJoin(foods, eq(mealItems.foodId, foods.id))
      .where(
        and(
          inArray(
            mealItems.mealId,
            dayMeals.map((m) => m.id),
          ),
          notDeleted(mealItems.deletedAt),
        ),
      )
      .all();

    const byMeal = new Map<string, MealItemWithFood[]>();
    for (const r of rows) {
      const list = byMeal.get(r.item.mealId) ?? [];
      list.push({ ...r.item, food: r.food });
      byMeal.set(r.item.mealId, list);
    }

    return dayMeals.map((meal) => {
      const items = byMeal.get(meal.id) ?? [];
      return { ...meal, items, totals: sumTotals(items.map((i) => scaleFood(i.food, i.grams))) };
    });
  }

  /** Totales nutricionales del día (Σ comidas). */
  dayTotals(dayDate: string): { totals: NutrientTotals; mealCount: number } {
    const withItems = this.listByDayWithItems(dayDate);
    return {
      totals: sumTotals(withItems.map((m) => m.totals)),
      mealCount: withItems.length,
    };
  }

  // ── Templates (favoritos) ──────────────────────────────────────

  saveAsTemplate(mealId: string, name: string): MealTemplate {
    const meal = this.getById(mealId);
    const items = this.listItems(mealId);
    const row = { ...insertStamp(), name, slot: meal?.slot ?? null };
    this.db.insert(mealTemplates).values(row).run();
    for (const item of items) {
      this.db
        .insert(mealTemplateItems)
        .values({ ...insertStamp(), templateId: row.id, foodId: item.foodId, grams: item.grams })
        .run();
    }
    return this.db.select().from(mealTemplates).where(eq(mealTemplates.id, row.id)).get()!;
  }

  listTemplates(): MealTemplate[] {
    return this.db
      .select()
      .from(mealTemplates)
      .where(notDeleted(mealTemplates.deletedAt))
      .orderBy(asc(mealTemplates.name))
      .all();
  }

  /** Instancia un template como comida nueva del día. */
  applyTemplate(templateId: string, dayDate: string, slot: MealSlot): Meal {
    const template = this.db
      .select()
      .from(mealTemplates)
      .where(and(eq(mealTemplates.id, templateId), notDeleted(mealTemplates.deletedAt)))
      .get();
    const meal = this.create({ dayDate, slot, name: template?.name });
    const items = this.db
      .select()
      .from(mealTemplateItems)
      .where(and(eq(mealTemplateItems.templateId, templateId), notDeleted(mealTemplateItems.deletedAt)))
      .all();
    for (const item of items) this.addItem(meal.id, item.foodId, item.grams);
    return meal;
  }
}
