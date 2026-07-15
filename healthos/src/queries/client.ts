import { QueryClient } from '@tanstack/react-query';

/**
 * Cliente único de React Query. TODAS las lecturas de DB pasan por acá;
 * las mutaciones invalidan por query key (ver keys.ts en fases siguientes).
 * La DB es local → staleTime corto y sin retries agresivos.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
    },
  },
});
