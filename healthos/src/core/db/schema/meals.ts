import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { dayDate, syncColumns } from './_base';
import { foods } from './foods';

export const meals = sqliteTable(
  'meals',
  {
    ...syncColumns,
    dayDate: dayDate(),
    eatenAt: integer('eaten_at').notNull(),
    /** breakfast | lunch | dinner | snack */
    slot: text('slot').notNull(),
    name: text('name'),
  },
  (t) => [index('idx_meal_day').on(t.dayDate)],
);

export const mealItems = sqliteTable(
  'meal_items',
  {
    ...syncColumns,
    mealId: text('meal_id')
      .notNull()
      .references(() => meals.id),
    foodId: text('food_id')
      .notNull()
      .references(() => foods.id),
    grams: real('grams').notNull(),
    /** Porción con nombre usada al loguear (solo display) */
    portionId: text('portion_id'),
  },
  (t) => [index('idx_meal_item_meal').on(t.mealId)],
);

/** Favoritos: "Mi desayuno estándar". */
export const mealTemplates = sqliteTable('meal_templates', {
  ...syncColumns,
  name: text('name').notNull(),
  slot: text('slot'),
});

export const mealTemplateItems = sqliteTable(
  'meal_template_items',
  {
    ...syncColumns,
    templateId: text('template_id')
      .notNull()
      .references(() => mealTemplates.id),
    foodId: text('food_id')
      .notNull()
      .references(() => foods.id),
    grams: real('grams').notNull(),
  },
  (t) => [index('idx_tpl_item_tpl').on(t.templateId)],
);
