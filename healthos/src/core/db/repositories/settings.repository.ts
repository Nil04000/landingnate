import { asc } from 'drizzle-orm';

import { nutrientTargets } from '../schema';
import type { AppSqliteDb } from '../types';
import { notDeleted } from './base.repository';

export type NutrientTargetRow = typeof nutrientTargets.$inferSelect;

export class SettingsRepository {
  constructor(private readonly db: AppSqliteDb) {}

  listNutrientTargets(): NutrientTargetRow[] {
    return this.db
      .select()
      .from(nutrientTargets)
      .where(notDeleted(nutrientTargets.deletedAt))
      .orderBy(asc(nutrientTargets.displayName))
      .all();
  }
}
