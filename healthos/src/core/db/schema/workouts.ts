import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { dayDate, syncColumns } from './_base';

/** Biblioteca de ejercicios (seed ~150 + creados por el usuario). */
export const exercises = sqliteTable('exercises', {
  ...syncColumns,
  name: text('name').notNull(),
  /** chest | back | legs | shoulders | arms | core | full_body | cardio */
  muscleGroup: text('muscle_group').notNull(),
  /** barbell | dumbbell | machine | cable | bodyweight | band | other */
  equipment: text('equipment'),
  isCustom: integer('is_custom').notNull().default(0),
  notes: text('notes'),
});

/** Sesión de entrenamiento — fuerza Y cardio comparten shell. */
export const workouts = sqliteTable(
  'workouts',
  {
    ...syncColumns,
    dayDate: dayDate(),
    /** strength | cardio | mobility | sport */
    type: text('type').notNull(),
    /** "Push A", "Zona 2" */
    title: text('title'),
    startedAt: integer('started_at').notNull(),
    endedAt: integer('ended_at'),
    /** RPE 1..10 a nivel sesión */
    perceivedExertion: integer('perceived_exertion'),
    kcalBurned: real('kcal_burned'),
    distanceM: integer('distance_m'),
    avgHr: integer('avg_hr'),
    notes: text('notes'),
  },
  (t) => [index('idx_workout_day').on(t.dayDate)],
);

/** Ejercicios dentro de una sesión, ordenados. */
export const workoutExercises = sqliteTable(
  'workout_exercises',
  {
    ...syncColumns,
    workoutId: text('workout_id')
      .notNull()
      .references(() => workouts.id),
    exerciseId: text('exercise_id')
      .notNull()
      .references(() => exercises.id),
    orderIndex: integer('order_index').notNull(),
    notes: text('notes'),
  },
  (t) => [index('idx_wex_workout').on(t.workoutId)],
);

/** Series. Volumen = reps × weight_kg (computado en lectura, nunca almacenado). */
export const workoutSets = sqliteTable(
  'workout_sets',
  {
    ...syncColumns,
    workoutExerciseId: text('workout_exercise_id')
      .notNull()
      .references(() => workoutExercises.id),
    setIndex: integer('set_index').notNull(),
    reps: integer('reps'),
    weightKg: real('weight_kg'),
    rpe: real('rpe'),
    isWarmup: integer('is_warmup').notNull().default(0),
    /** Series por tiempo / intervalos de cardio */
    durationS: integer('duration_s'),
    distanceM: integer('distance_m'),
  },
  (t) => [index('idx_set_wex').on(t.workoutExerciseId)],
);
