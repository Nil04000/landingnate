import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * Cache analítica LOCAL: una fila por día con todas las métricas numéricas
 * que consumen el Health Score, el motor de insights y el asistente.
 *
 * SIN columnas de sync a propósito: es 100% derivada y reconstruible desde
 * las tablas fuente (nunca se sincroniza). Cada write de dominio marca su
 * día con `isStale = 1`; el pipeline reconstruye solo lo sucio.
 */
export const dailyAggregates = sqliteTable('daily_aggregates', {
  dayDate: text('day_date').primaryKey(),

  // Sueño
  sleepMinutes: real('sleep_minutes'),
  napMinutes: real('nap_minutes'),
  sleepQuality: real('sleep_quality'),
  /** Minutos después de las 18:00 (para stddev de consistencia sin wrap de medianoche) */
  bedtimeMinute: real('bedtime_minute'),

  // Actividad y entrenamiento
  steps: integer('steps'),
  activeKcal: real('active_kcal'),
  workoutCount: integer('workout_count'),
  workoutMinutes: real('workout_minutes'),
  strengthVolumeKg: real('strength_volume_kg'),

  // Hidratación y sustancias
  waterMl: integer('water_ml'),
  caffeineMg: real('caffeine_mg'),
  /** Hora (decimal, 0-24) de la última cafeína del día */
  lastCaffeineHour: real('last_caffeine_hour'),
  alcoholUnits: real('alcohol_units'),
  cigarettes: real('cigarettes'),
  vapeSessions: real('vape_sessions'),

  // Nutrición
  kcal: real('kcal'),
  proteinG: real('protein_g'),
  carbsG: real('carbs_g'),
  fatG: real('fat_g'),
  fiberG: real('fiber_g'),
  sugarG: real('sugar_g'),
  saturatedFatG: real('saturated_fat_g'),
  sodiumMg: real('sodium_mg'),
  mealCount: integer('meal_count'),
  /** % promedio de cobertura de RDAs de micronutrientes trackeados */
  microCoveragePct: real('micro_coverage_pct'),

  // Cuerpo
  weightKg: real('weight_kg'),
  bodyFatPct: real('body_fat_pct'),

  // Subjetivo (promedios del día, 1..5)
  mood: real('mood'),
  energy: real('energy'),
  stress: real('stress'),
  libido: real('libido'),
  soreness: real('soreness'),

  // Adherencia y consistencia
  supplementAdherencePct: real('supplement_adherence_pct'),
  /** Cuántos de los módulos core se tocaron este día */
  loggedModules: integer('logged_modules'),

  healthScore: integer('health_score'),

  isStale: integer('is_stale').notNull().default(1),
  computedAt: integer('computed_at'),
});
