import { and, asc, eq, like, or, sql } from 'drizzle-orm';

import { foodPortions, foods } from '../schema';
import type { AppSqliteDb } from '../types';
import { insertStamp, notDeleted, softDeleteStamp, updateStamp } from './base.repository';

export type Food = typeof foods.$inferSelect;
export type FoodPortion = typeof foodPortions.$inferSelect;

/** Alta/edición: name + nutrientes opcionales (todo por 100 g). */
export type FoodInput = Partial<Omit<Food, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'isDirty'>> & {
  name: string;
};

export class FoodsRepository {
  constructor(private readonly db: AppSqliteDb) {}

  create(input: FoodInput): Food {
    const row = { ...insertStamp(), source: 'user', ...input };
    this.db.insert(foods).values(row).run();
    return this.getById(row.id)!;
  }

  update(id: string, patch: Partial<FoodInput>): void {
    this.db
      .update(foods)
      .set({ ...patch, ...updateStamp() })
      .where(eq(foods.id, id))
      .run();
  }

  softDelete(id: string): void {
    this.db.update(foods).set(softDeleteStamp()).where(eq(foods.id, id)).run();
  }

  getById(id: string): Food | undefined {
    return this.db
      .select()
      .from(foods)
      .where(and(eq(foods.id, id), notDeleted(foods.deletedAt)))
      .get();
  }

  /**
   * Búsqueda por nombre/marca, insensible a mayúsculas, prefijos primero.
   * Suficiente para biblioteca local (~cientos de filas); FTS si escala.
   */
  search(query: string, limit = 30): Food[] {
    const trimmed = query.trim();
    if (!trimmed) {
      return this.db
        .select()
        .from(foods)
        .where(notDeleted(foods.deletedAt))
        .orderBy(asc(foods.name))
        .limit(limit)
        .all();
    }
    const pattern = `%${trimmed}%`;
    const prefix = `${trimmed}%`;
    return this.db
      .select()
      .from(foods)
      .where(
        and(or(like(foods.name, pattern), like(foods.brand, pattern)), notDeleted(foods.deletedAt)),
      )
      .orderBy(sql`CASE WHEN ${foods.name} LIKE ${prefix} THEN 0 ELSE 1 END`, asc(foods.name))
      .limit(limit)
      .all();
  }

  listPortions(foodId: string): FoodPortion[] {
    return this.db
      .select()
      .from(foodPortions)
      .where(and(eq(foodPortions.foodId, foodId), notDeleted(foodPortions.deletedAt)))
      .orderBy(asc(foodPortions.grams))
      .all();
  }

  addPortion(foodId: string, name: string, grams: number): FoodPortion {
    const row = { ...insertStamp(), foodId, name, grams };
    this.db.insert(foodPortions).values(row).run();
    return this.db.select().from(foodPortions).where(eq(foodPortions.id, row.id)).get()!;
  }
}
