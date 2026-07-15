import { getTableName } from 'drizzle-orm';
import { SQLiteTable } from 'drizzle-orm/sqlite-core';

import * as schema from '@/core/db/schema';
import type { AppSqliteDb } from '@/core/db/types';

/** Tablas derivadas/locales que no forman parte del export de datos. */
const LOCAL_ONLY_TABLES = new Set(['daily_aggregates', 'sync_state', 'app_meta']);

export type DataExport = {
  app: string;
  exportedAt: string;
  schemaVersion: number;
  tables: Record<string, unknown[]>;
};

/**
 * Dump completo de las tablas sincronizables (mismas filas que un push de
 * sync empujaría, soft-deletes incluidos: el export ES el backup).
 */
export function buildExport(db: AppSqliteDb): DataExport {
  const tables: Record<string, unknown[]> = {};
  for (const value of Object.values(schema)) {
    if (!(value instanceof SQLiteTable)) continue;
    const name = getTableName(value);
    if (LOCAL_ONLY_TABLES.has(name)) continue;
    tables[name] = db.select().from(value).all() as unknown[];
  }
  return {
    app: 'HealthOS',
    exportedAt: new Date().toISOString(),
    schemaVersion: 1,
    tables,
  };
}
