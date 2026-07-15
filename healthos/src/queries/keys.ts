/**
 * Query keys centralizadas. Invalidación por prefijo:
 * - ['day'] agrupa todo lo por-día; ['day', fecha] un día puntual.
 * - ['range'] agrupa lecturas de rango (sparklines, gráficos).
 */
export const queryKeys = {
  day: (date: string) => ['day', date] as const,
  dayEntries: (date: string) => ['dayEntries', date] as const,
  range: (from: string, to: string) => ['range', from, to] as const,
  latestWeight: ['latestWeight'] as const,
  compoundDefinitions: ['compoundDefinitions'] as const,
  note: (date: string) => ['note', date] as const,
} as const;
