import { and, eq, gte, isNotNull, lte, sql } from 'drizzle-orm';

import { microCoverage } from '@/core/lib/nutrition-math';

import { compoundDefinitions, compoundIntakes, dailyAggregates, nutrientTargets } from '../schema';
import type { AppSqliteDb } from '../types';
import { ActivityRepository } from './activity.repository';
import { BodyRepository } from './body.repository';
import { CompoundsRepository } from './compounds.repository';
import { HydrationRepository } from './hydration.repository';
import { MealsRepository } from './meals.repository';
import { SleepRepository } from './sleep.repository';
import { SubstancesRepository } from './substances.repository';
import { WellbeingRepository } from './wellbeing.repository';
import { WorkoutsRepository } from './workouts.repository';

export type DailyAggregate = typeof dailyAggregates.$inferSelect;

/**
 * Cache analítica por día. Cada write de dominio llama `markStale(day)`;
 * `rebuildDay` recalcula TODO el día desde las tablas fuente (idempotente,
 * la fila es 100% derivada). Los campos de nutrición quedan null hasta la
 * Fase 3 (módulo de comidas); healthScore hasta la Fase 7.
 */
export class DailyAggregatesRepository {
  private readonly sleep: SleepRepository;
  private readonly hydration: HydrationRepository;
  private readonly substances: SubstancesRepository;
  private readonly activity: ActivityRepository;
  private readonly body: BodyRepository;
  private readonly wellbeing: WellbeingRepository;
  private readonly compounds: CompoundsRepository;
  private readonly workouts: WorkoutsRepository;
  private readonly meals: MealsRepository;

  constructor(private readonly db: AppSqliteDb) {
    this.sleep = new SleepRepository(db);
    this.hydration = new HydrationRepository(db);
    this.substances = new SubstancesRepository(db);
    this.activity = new ActivityRepository(db);
    this.body = new BodyRepository(db);
    this.wellbeing = new WellbeingRepository(db);
    this.compounds = new CompoundsRepository(db);
    this.workouts = new WorkoutsRepository(db);
    this.meals = new MealsRepository(db);
  }

  /** Marca el día como sucio (lo llama toda mutación de dominio). */
  markStale(dayDate: string): void {
    this.db
      .insert(dailyAggregates)
      .values({ dayDate, isStale: 1 })
      .onConflictDoUpdate({ target: dailyAggregates.dayDate, set: { isStale: 1 } })
      .run();
  }

  getDay(dayDate: string): DailyAggregate | undefined {
    return this.db.select().from(dailyAggregates).where(eq(dailyAggregates.dayDate, dayDate)).get();
  }

  getRange(from: string, to: string): DailyAggregate[] {
    return this.db
      .select()
      .from(dailyAggregates)
      .where(and(gte(dailyAggregates.dayDate, from), lte(dailyAggregates.dayDate, to)))
      .orderBy(dailyAggregates.dayDate)
      .all();
  }

  listStaleDays(): string[] {
    return this.db
      .select({ dayDate: dailyAggregates.dayDate })
      .from(dailyAggregates)
      .where(eq(dailyAggregates.isStale, 1))
      .all()
      .map((r) => r.dayDate);
  }

  rebuildStale(): number {
    const days = this.listStaleDays();
    for (const day of days) this.rebuildDay(day);
    return days.length;
  }

  /** Recalcula la fila completa del día desde las tablas fuente. */
  rebuildDay(dayDate: string): DailyAggregate {
    // ── Sueño ────────────────────────────────────────────────────
    const sessions = this.sleep.listByDay(dayDate);
    const { sleepMinutes, napMinutes } = this.sleep.minutesForDay(dayDate);
    const mainSessions = sessions.filter((s) => !s.isNap);
    const qualities = mainSessions
      .map((s) => s.qualityRating)
      .filter((q): q is number => q != null);
    const sleepQuality = qualities.length
      ? qualities.reduce((a, b) => a + b, 0) / qualities.length
      : null;
    // Acostarse: inicio del sueño principal más largo, en minutos desde las
    // 18:00 (evita el wrap de medianoche en la stddev de consistencia)
    let bedtimeMinute: number | null = null;
    if (mainSessions.length > 0) {
      const longest = mainSessions.reduce((a, b) => (b.endAt - b.startAt > a.endAt - a.startAt ? b : a));
      const start = new Date(longest.startAt);
      bedtimeMinute = (start.getHours() * 60 + start.getMinutes() - 18 * 60 + 1440) % 1440;
    }

    // ── Actividad y entrenamiento ────────────────────────────────
    const activity = this.activity.getForDay(dayDate);
    const dayWorkouts = this.workouts.listByDay(dayDate);
    const workoutMinutes = this.workouts.minutesForDay(dayDate);
    const strengthVolumeKg = this.workouts.strengthVolumeForDay(dayDate);

    // ── Hidratación y sustancias ─────────────────────────────────
    const waterMl = this.hydration.totalMlForDay(dayDate);
    const hydrationCount = this.hydration.listByDay(dayDate).length;
    const subs = this.substances.listByDay(dayDate);
    const caffeineMg = subs.reduce((s, e) => s + (e.caffeineMg ?? 0), 0);
    const caffeinated = subs.filter((e) => (e.caffeineMg ?? 0) > 0);
    let lastCaffeineHour: number | null = null;
    if (caffeinated.length > 0) {
      const last = new Date(Math.max(...caffeinated.map((e) => e.consumedAt)));
      lastCaffeineHour = last.getHours() + last.getMinutes() / 60;
    }
    const alcoholUnits = subs.reduce((s, e) => s + (e.alcoholGrams ?? 0), 0) / 10;
    const cigarettes = subs
      .filter((e) => e.type === 'cigarette')
      .reduce((s, e) => s + e.quantity, 0);
    const vapeSessions = subs.filter((e) => e.type === 'vape').reduce((s, e) => s + e.quantity, 0);

    // ── Nutrición (comidas + kcal/cafeína/alcohol de sustancias) ─
    const { totals: mealTotals, mealCount } = this.meals.dayTotals(dayDate);
    const substanceKcal = subs.reduce((s, e) => s + (e.kcal ?? 0), 0);
    const hasNutrition = mealCount > 0;
    const totalCaffeineMg = caffeineMg + mealTotals.caffeineMg;
    const totalAlcoholUnits = alcoholUnits + mealTotals.alcoholG / 10;

    let microCoveragePct: number | null = null;
    if (hasNutrition) {
      const targets = this.db
        .select({ nutrientKey: nutrientTargets.nutrientKey, rdaAmount: nutrientTargets.rdaAmount })
        .from(nutrientTargets)
        .all();
      // Aportes de suplementos linkeados a un nutriente (dosis en la unidad
      // canónica del target; conversión IU↔µg pendiente para fase posterior)
      const linkedIntakes = this.db
        .select({
          nutrientKey: compoundDefinitions.linkedNutrientKey,
          doseAmount: compoundIntakes.doseAmount,
          skipped: compoundIntakes.skipped,
          deletedAt: compoundIntakes.deletedAt,
        })
        .from(compoundIntakes)
        .innerJoin(compoundDefinitions, eq(compoundIntakes.compoundId, compoundDefinitions.id))
        .where(
          and(eq(compoundIntakes.dayDate, dayDate), isNotNull(compoundDefinitions.linkedNutrientKey)),
        )
        .all();
      const supplementExtras: Record<string, number> = {};
      for (const intake of linkedIntakes) {
        if (intake.skipped || intake.deletedAt != null || !intake.nutrientKey) continue;
        supplementExtras[intake.nutrientKey] =
          (supplementExtras[intake.nutrientKey] ?? 0) + intake.doseAmount;
      }
      microCoveragePct = microCoverage(mealTotals, targets, supplementExtras).averagePct;
    }

    // ── Cuerpo ───────────────────────────────────────────────────
    const measurements = this.body.listByDay(dayDate);
    const withWeight = measurements.find((m) => m.weightKg != null);
    const withFat = measurements.find((m) => m.bodyFatPct != null);

    // ── Subjetivo y suplementos ──────────────────────────────────
    const subjective = this.wellbeing.averagesForDay(dayDate);
    const supplementAdherencePct = this.compounds.adherenceForDay(dayDate);
    const intakeCount = this.compounds.listIntakesByDay(dayDate).length;

    // ── Consistencia: módulos core tocados hoy ───────────────────
    const modules = [
      sessions.length > 0,
      hydrationCount > 0,
      hasNutrition,
      Object.values(subjective).some((v) => v != null),
      measurements.length > 0 || activity != null,
      subs.length > 0,
      intakeCount > 0 || dayWorkouts.length > 0,
    ];
    const loggedModules = modules.filter(Boolean).length;

    const row = {
      dayDate,
      sleepMinutes: sessions.length ? sleepMinutes : null,
      napMinutes: sessions.length ? napMinutes : null,
      sleepQuality,
      bedtimeMinute,
      steps: activity?.steps ?? null,
      activeKcal: activity?.activeKcal ?? null,
      workoutCount: dayWorkouts.length,
      workoutMinutes,
      strengthVolumeKg,
      waterMl: hydrationCount > 0 ? waterMl : null,
      caffeineMg: subs.length > 0 || (hasNutrition && totalCaffeineMg > 0) ? totalCaffeineMg : null,
      lastCaffeineHour,
      alcoholUnits: subs.length > 0 || (hasNutrition && totalAlcoholUnits > 0) ? totalAlcoholUnits : null,
      cigarettes: subs.length > 0 ? cigarettes : null,
      vapeSessions: subs.length > 0 ? vapeSessions : null,
      kcal: hasNutrition ? mealTotals.kcal + substanceKcal : null,
      proteinG: hasNutrition ? mealTotals.proteinG : null,
      carbsG: hasNutrition ? mealTotals.carbsG : null,
      fatG: hasNutrition ? mealTotals.fatG : null,
      fiberG: hasNutrition ? mealTotals.fiberG : null,
      sugarG: hasNutrition ? mealTotals.sugarG : null,
      saturatedFatG: hasNutrition ? mealTotals.saturatedFatG : null,
      sodiumMg: hasNutrition ? mealTotals.sodiumMg : null,
      mealCount,
      microCoveragePct,
      weightKg: withWeight?.weightKg ?? null,
      bodyFatPct: withFat?.bodyFatPct ?? null,
      mood: subjective.mood,
      energy: subjective.energy,
      stress: subjective.stress,
      libido: subjective.libido,
      soreness: subjective.soreness,
      supplementAdherencePct,
      loggedModules,
      isStale: 0,
      computedAt: Date.now(),
    };

    this.db
      .insert(dailyAggregates)
      .values(row)
      .onConflictDoUpdate({
        target: dailyAggregates.dayDate,
        set: { ...row, dayDate: sql`${dailyAggregates.dayDate}` },
      })
      .run();

    return this.getDay(dayDate)!;
  }
}
