import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * Estado de sincronización por tabla (para el sync futuro con Supabase).
 * Local-only: no se sincroniza a sí misma.
 */
export const syncState = sqliteTable('sync_state', {
  tableName: text('table_name').primaryKey(),
  lastPulledAt: integer('last_pulled_at'),
  lastPushedAt: integer('last_pushed_at'),
});

/** KV local para metadatos de la app (versión de seeds, etc.). No se sincroniza. */
export const appMeta = sqliteTable('app_meta', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});
