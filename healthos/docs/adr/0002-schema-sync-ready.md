# ADR-0002 — Schema sync-ready (Supabase futuro, sin backend hoy)

**Estado:** aceptada · Fase 1

## Decisión

Toda tabla sincronizable deriva de `syncColumns` (`src/core/db/schema/_base.ts`):

| Columna | Rol en el sync futuro |
|---|---|
| `id` uuid v4 texto | merge sin colisiones entre dispositivos |
| `created_at` / `updated_at` epoch ms | `updated_at` decide last-write-wins en el pull |
| `deleted_at` nullable | soft delete: los borrados se propagan como updates |
| `is_dirty` 0/1 | push = `WHERE is_dirty=1` → upsert remoto → limpiar flag |

El estampado vive en UN lugar (`repositories/base.repository.ts`): insert/update/
softDelete/notDeleted. Ningún repo lo re-implementa.

## Protocolo previsto (no construido)

- **Push:** por tabla, filas dirty → upsert en Supabase → `is_dirty=0`.
- **Pull:** `WHERE updated_at > sync_state.last_pulled_at` → LWW por `updated_at`.
- `daily_aggregates`, `sync_state` y `app_meta` NUNCA se sincronizan (derivadas/locales).
- Los seeds nacen con `is_dirty=0` (catálogo, no data del usuario).
