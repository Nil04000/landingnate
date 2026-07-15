import { db } from '@/core/db/client';
import { ActivityRepository } from '@/core/db/repositories/activity.repository';
import { BodyRepository } from '@/core/db/repositories/body.repository';
import { CompoundsRepository } from '@/core/db/repositories/compounds.repository';
import { DailyAggregatesRepository } from '@/core/db/repositories/aggregates.repository';
import { HydrationRepository } from '@/core/db/repositories/hydration.repository';
import { SleepRepository } from '@/core/db/repositories/sleep.repository';
import { SubstancesRepository } from '@/core/db/repositories/substances.repository';
import { WellbeingRepository } from '@/core/db/repositories/wellbeing.repository';
import { WorkoutsRepository } from '@/core/db/repositories/workouts.repository';

/**
 * Singletons de repositorios ligados a la DB de la app.
 * La UI NUNCA importa repos directo: pasa por los hooks de src/queries/.
 */
export const repos = {
  body: new BodyRepository(db),
  sleep: new SleepRepository(db),
  hydration: new HydrationRepository(db),
  substances: new SubstancesRepository(db),
  activity: new ActivityRepository(db),
  wellbeing: new WellbeingRepository(db),
  compounds: new CompoundsRepository(db),
  workouts: new WorkoutsRepository(db),
  aggregates: new DailyAggregatesRepository(db),
} as const;
