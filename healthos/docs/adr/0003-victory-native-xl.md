# ADR-0003 — Victory Native XL para gráficos cartesianos

**Estado:** aceptada · Fase 1 (se ejercita desde Fase 5/6)

## Decisión

- **Victory Native XL** (`victory-native` v41, Skia + Reanimated) para todo gráfico
  cartesiano: líneas, áreas, barras, scrub D/S/M/A. Mantiene 60fps sobre rangos
  anuales, cosa que las librerías SVG no sostienen.
- **Skia custom** SOLO para tres primitivas chicas que Victory no modela bien:
  `RingProgress`, `Sparkline`, `HeatmapCalendar`.

## Alternativas descartadas

- **react-native-gifted-charts**: SVG (techo de performance), estética propia
  difícil de pisar, scrubbing débil.
- **Todo Skia a mano**: costo de mantenimiento alto para ejes/escalas/tooltips.
