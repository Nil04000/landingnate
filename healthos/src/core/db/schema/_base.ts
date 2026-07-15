import { integer, text } from 'drizzle-orm/sqlite-core';

/**
 * Contrato sync-ready que TODA tabla sincronizable debe incluir.
 *
 * - `id`: uuid v4 (generado con expo-crypto vía `newId()`), nunca autoincrement —
 *   permite merge sin colisiones cuando exista sync remoto (Supabase).
 * - `createdAt`/`updatedAt`: epoch ms. `updatedAt` decide last-write-wins en el pull.
 * - `deletedAt`: soft delete. Ninguna fila se borra físicamente; toda lectura
 *   filtra `deleted_at IS NULL` (helper `notDeleted()` en base.repository).
 * - `isDirty`: 1 = pendiente de push. El push futuro hace
 *   `SELECT * WHERE is_dirty = 1` → upsert remoto → limpia el flag.
 *
 * Ver docs/adr/0002-schema-sync-ready.md.
 */
export const syncColumns = {
  id: text('id').primaryKey(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  deletedAt: integer('deleted_at'),
  isDirty: integer('is_dirty').notNull().default(1),
};

/**
 * Clave analítica de día: fecha calendario LOCAL 'YYYY-MM-DD'.
 * Es la unidad de agregación de toda la app (agregados, score, insights).
 * La timezone vive en user_profile; los timestamps puntuales son epoch ms.
 */
export const dayDate = () => text('day_date').notNull();
