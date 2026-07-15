# ADR-0004 — Totales nutricionales computados en lectura

**Estado:** aceptada · Fase 1 (se ejercita desde Fase 3)

## Decisión

`meal_items` guarda SOLO `food_id + grams`. Los totales de comida/día se computan
en lectura (`nutrition-math.ts`: join con `foods`, escala `grams/100`). No hay
columnas snapshot de nutrientes en items.

## Consecuencias

- Editar un alimento **recalcula la historia** (comportamiento Cronometer):
  corregiste un dato mal cargado → toda tu historia mejora.
- El costo de lectura se absorbe cacheando los totales del día en
  `daily_aggregates` (invalidado al escribir; siempre reconstruible).
- Trade-off aceptado: no hay "foto histórica" del alimento tal como era al
  momento de comerlo.
