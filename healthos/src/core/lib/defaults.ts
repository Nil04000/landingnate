/**
 * Objetivos por defecto hasta que el editor de objetivos (tabla `goals`)
 * tenga UI propia. Los agregados y cards leen de acá vía un solo import,
 * así el reemplazo futuro es puntual.
 */
export const defaultGoals = {
  stepsPerDay: 10_000,
  waterMlPerDay: 2_500,
  sleepMinutesPerNight: 480,
  caffeineMgMax: 400,
} as const;
