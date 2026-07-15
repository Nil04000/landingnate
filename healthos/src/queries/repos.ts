import { db } from '@/core/db/client';
import { ActivityRepository } from '@/core/db/repositories/activity.repository';
import { BodyRepository } from '@/core/db/repositories/body.repository';
import { CompoundsRepository } from '@/core/db/repositories/compounds.repository';
import { DailyAggregatesRepository } from '@/core/db/repositories/aggregates.repository';
import { ExercisesRepository } from '@/core/db/repositories/exercises.repository';
import { FoodsRepository } from '@/core/db/repositories/foods.repository';
import { HydrationRepository } from '@/core/db/repositories/hydration.repository';
import { InsightsRepository } from '@/core/db/repositories/insights.repository';
import { LabsRepository } from '@/core/db/repositories/labs.repository';
import { MealsRepository } from '@/core/db/repositories/meals.repository';
import { ScoresRepository } from '@/core/db/repositories/scores.repository';
import { SettingsRepository } from '@/core/db/repositories/settings.repository';
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
  exercises: new ExercisesRepository(db),
  foods: new FoodsRepository(db),
  meals: new MealsRepository(db),
  settings: new SettingsRepository(db),
  labs: new LabsRepository(db),
  scores: new ScoresRepository(db),
  insights: new InsightsRepository(db),
  aggregates: new DailyAggregatesRepository(db),
} as const;
