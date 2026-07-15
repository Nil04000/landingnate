import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

import * as schema from '@/core/db/schema';
import type { AppSqliteDb } from '@/core/db/types';

/**
 * DB en memoria con las MISMAS migraciones que corre la app en el boot.
 * Si una migración está rota, los tests fallan antes de que llegue al device.
 */
export function createTestDb(): AppSqliteDb {
  const sqlite = new Database(':memory:');
  sqlite.pragma('foreign_keys = ON');
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: 'src/core/db/migrations' });
  return db as unknown as AppSqliteDb;
}
