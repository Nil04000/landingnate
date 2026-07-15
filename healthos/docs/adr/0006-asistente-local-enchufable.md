# ADR-0006 — Asistente local con capa de herramientas enchufable a LLM

**Estado:** aceptada · Fase 9

## Decisión (del usuario)

Sin IA en la nube: el asistente corre 100% on-device. Decisión explícita de
producto — máxima privacidad, cero costo, funciona offline.

## Arquitectura

- **Capa de herramientas** (`features/assistant/engine/tools.ts`): funciones
  agregadas puras sobre la DB (resumen de métrica, correlación con guarda
  Pearson∧Spearman, mayores cambios, déficits de micros vs RDA, desglose del
  score, resumen de entrenamiento). Reciben `AppSqliteDb`, devuelven datos
  tipados y acotados.
- **Proveedor local** (`provider.ts`): matcher de ~13 intents en español
  (regex con alternancias tipo duermo/durmiendo/dormir) que compone las
  herramientas y responde con números reales, tono correlacional y links de
  navegación. Interfaz `AssistantProvider` mínima: `answer(question)`.

## Camino de upgrade (si algún día se quiere LLM)

Un `LlmAssistantProvider` implementaría la MISMA interfaz haciendo tool-use
sobre las MISMAS herramientas (que ya devuelven agregados acotados — nunca
tablas crudas). UI y capa de datos no se tocan. No hay SDK de IA ni manejo
de API keys en el codebase hasta que esa decisión cambie.
