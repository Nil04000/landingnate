# ADR-0001 — expo-sqlite + Drizzle ORM

**Estado:** aceptada · Fase 1

## Contexto

La app es local-first con 20+ tablas (una de ellas con ~40 columnas de nutrientes)
y necesita: tipado fuerte end-to-end, migraciones versionadas, y tests de la capa
de datos sin simulador.

## Decisión

- **expo-sqlite** como motor (WAL + foreign_keys ON).
- **Drizzle ORM**: el schema TypeScript es la única fuente de verdad; `drizzle-kit
  generate` produce SQL bundleado (babel inline-import) que corre en el boot vía
  `useMigrations`. El mismo schema corre contra **better-sqlite3** en Vitest.
- Repositorios como clases planas que reciben `AppSqliteDb` (tipo driver-agnóstico).

## Alternativas descartadas

- **WatermelonDB**: impone modelos propios y su protocolo de sync; pelea con la
  arquitectura repositorios + React Query y con el sync custom a Supabase.
- **SQL crudo**: sin tipado en 40+ columnas de nutrientes, alto costo de refactor.
