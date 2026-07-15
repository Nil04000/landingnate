# Nutrición

UI del tab Nutrición (Fase 3): comidas por slot con macros en vivo y cobertura
de micronutrientes. Toda la matemática vive en `core/lib/nutrition-math.ts`
(totales computados en lectura, ADR-0004); acá solo hay presentación.

## Pantallas (`screens/`)

- **NutritionScreen** — tab. DateStrip ligado a `ui.store.selectedDate`,
  resumen de macros del día (objetivos hardcodeados; TODO tabla `goals`),
  comidas por slot (Desayuno/Almuerzo/Cena/Snack), plantillas y cobertura de
  micros vía `useMicroCoverage`.
- **MealEditorScreen** — modal `/meal/[id]`. Slot editable por chips, totales
  en vivo desde `meal.totals`, items con gramos inline (Stepper + OK),
  búsqueda de alimentos (tap agrega 100 g, long-press inspecciona), guardar
  como plantilla y eliminar.
- **FoodDetailScreen** — push `/food/[id]`. Ficha del alimento: tabla de
  nutrientes por 100 g/ml agrupada (macros, grasas detalle, minerales,
  vitaminas — solo filas con dato) + porciones.
- **FoodCreateScreen** — modal `/food/new`. Alta de alimento propio: macros
  requeridos + micros opcionales colapsables. Acepta coma decimal es-AR.

## Componentes (`components/`)

- `MacroSummary` — kcal grandes + 3 mini anillos P/C/G vs objetivo.
- `MicroCoverageCard` — barra de promedio + top 4 déficits.
- `FoodSearchList` — resultados de biblioteca (máx. 15 visibles).
- `slots.ts` — orden y labels es-AR de los slots + normalizador `slotOf`.

## Convenciones

- Escrituras SOLO vía `useMealMutation`/`useFoodMutation` (rebuild de
  agregados + invalidación). Los args siempre incluyen `dayDate` y, al editar
  una comida, `mealId`.
- Números es-AR con `core/lib/format.ts`; grandes con `tabular-nums`.
