import { asc, eq } from 'drizzle-orm';

import { nutrientTargets, userProfile } from '../schema';
import type { AppSqliteDb } from '../types';
import { insertStamp, notDeleted, updateStamp } from './base.repository';

export type NutrientTargetRow = typeof nutrientTargets.$inferSelect;
export type UserProfile = typeof userProfile.$inferSelect;

export type ProfilePatch = {
  sex?: 'male' | 'female' | null;
  birthDate?: string | null;
  heightCm?: number | null;
  unitSystem?: 'metric' | 'imperial';
};

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

  /** Perfil único (id='self'). Alimenta los rangos de labs por sexo. */
  getProfile(): UserProfile | undefined {
    return this.db.select().from(userProfile).where(eq(userProfile.id, 'self')).get();
  }

  upsertProfile(patch: ProfilePatch): UserProfile {
    const existing = this.getProfile();
    if (existing) {
      this.db
        .update(userProfile)
        .set({ ...patch, ...updateStamp() })
        .where(eq(userProfile.id, 'self'))
        .run();
      return this.getProfile()!;
    }
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Argentina/Buenos_Aires';
    this.db
      .insert(userProfile)
      .values({
        ...insertStamp(),
        id: 'self',
        timezone,
        unitSystem: 'metric',
        ...patch,
      })
      .run();
    return this.getProfile()!;
  }
}
