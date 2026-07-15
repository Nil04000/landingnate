import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { haptic } from '@/core/design-system/haptics';
import type { LabResult } from '@/core/db/repositories/labs.repository';

import { repos } from './repos';

/** Índice: marcadores con resultados, agrupados por panel. */
export function useLabsIndex() {
  return useQuery({
    queryKey: ['labsIndex'],
    queryFn: () => repos.labs.markersWithLatest(),
  });
}

/** Catálogo completo (paneles → marcadores) para el flujo de carga. */
export function useLabCatalog() {
  return useQuery({
    queryKey: ['labCatalog'],
    queryFn: () => {
      const panels = repos.labs.listPanels();
      const markers = repos.labs.listMarkers();
      return panels.map((panel) => ({
        panel,
        markers: markers.filter((m) => m.panelId === panel.id),
      }));
    },
  });
}

export function useMarkerDetail(markerId: string) {
  return useQuery({
    queryKey: ['markerDetail', markerId],
    queryFn: () => ({
      marker: repos.labs.getMarker(markerId) ?? null,
      history: repos.labs.markerHistory(markerId),
      range: repos.labs.rangeFor(markerId) ?? null,
    }),
  });
}

export function useLabReports() {
  return useQuery({
    queryKey: ['labReports'],
    queryFn: () => repos.labs.listReports(),
  });
}

export function useLabReport(reportId: string) {
  return useQuery({
    queryKey: ['labReport', reportId],
    queryFn: () => {
      const report = repos.labs.getReport(reportId) ?? null;
      if (!report) return null;
      return { report, results: repos.labs.listResultsByReport(reportId) };
    },
  });
}

/**
 * Mutación de labs (sin agregados diarios: los análisis no son métricas de
 * día). Háptico: warn si algún resultado quedó fuera de rango, logged si no.
 */
export function useLabMutation<TArgs>(write: (args: TArgs) => unknown) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (args: TArgs) => Promise.resolve({ result: write(args) }),
    onSuccess: ({ result }) => {
      const results = (Array.isArray(result) ? result : [result]) as (LabResult | unknown)[];
      const outOfRange = results.some(
        (r) =>
          typeof r === 'object' && r !== null && 'flag' in r && ((r as LabResult).flag === 'low' || (r as LabResult).flag === 'high'),
      );
      if (outOfRange) haptic.warn();
      else haptic.logged();
      void queryClient.invalidateQueries({ queryKey: ['labsIndex'] });
      void queryClient.invalidateQueries({ queryKey: ['labCatalog'] });
      void queryClient.invalidateQueries({ queryKey: ['markerDetail'] });
      void queryClient.invalidateQueries({ queryKey: ['labReports'] });
      void queryClient.invalidateQueries({ queryKey: ['labReport'] });
    },
  });
}
