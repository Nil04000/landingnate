# Labs

Módulo de análisis de sangre: catálogo de marcadores por panel, reportes
(extracciones) y resultados con flag contra rango de referencia.

## Pantallas (`screens/`)

- **LabsIndexScreen** (`/labs`): marcadores con resultados agrupados por panel
  (null → "Otros"), cada uno con valor actual, flecha de tendencia vs. el
  resultado anterior y `RangeBar`; al final la lista de análisis cargados.
- **MarkerDetailScreen** (`/labs/marker/[id]`): valor actual + flag + delta vs.
  anterior, `MarkerChart` (Skia) con bandas de referencia/óptima, `RangeBar`
  grande e historial descendente.
- **ReportDetailScreen** (`/labs/report/[id]`): resultados del análisis con los
  fuera de rango primero, chip "Ayunas" si aplica y eliminación (soft delete).
- **NewReportScreen** (`/labs/new-report`, modal): fecha por chips
  (Hoy/−7/−30/−90 días), laboratorio opcional, toggle Ayunas, un input decimal
  por marcador del catálogo (solo se guardan los que tienen valor, coma es-AR)
  y mini-form de marcador personalizado (`createCustomMarker`).

## Componentes (`components/`)

- **FlagBadge**: pill por flag — optimal → success "Óptimo", in_range → tint
  "En rango", low → warning "Bajo", high → danger "Alto", null → "—".
- **RangeBar**: barra de posición del valor con Views por % (sin Skia). Dominio
  `[low − 15%·span, high + 15%·span]`; banda de referencia tint/25, banda
  óptima success/35, punto del color del flag con borde canvas.
- **MarkerChart**: gráfico Skia de evolución — línea `metric.labs`, un punto
  por resultado coloreado por flag, Rects de banda referencia (tint α0.12) y
  óptima (success α0.15) detrás; labels min/max del eje Y como Text RN y
  fechas primera/última abajo. Con <2 puntos muestra solo el punto + bandas.
- **format.ts**: labels/colores por flag, `formatLabValue` (es-AR, decimales
  según magnitud) y `parseDecimal` (coma decimal).

## Convenciones

- Lecturas vía hooks de `src/queries/useLabs.ts`; escrituras SOLO vía
  `useLabMutation`. El write de guardado devuelve los `LabResult` creados para
  que el hook dispare `haptic.warn` si algún resultado quedó low/high.
- Los marcadores custom se crean con `panelId` null: `useLabCatalog` no los
  lista, por eso `NewReportScreen` los mantiene en estado local durante la
  sesión de carga; una vez con resultados aparecen en el índice bajo "Otros".
