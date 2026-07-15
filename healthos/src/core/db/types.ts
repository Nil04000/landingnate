import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';

import type * as schema from './schema';

/**
 * DB SQLite síncrona con el schema completo. La implementan tanto
 * expo-sqlite (app) como better-sqlite3 (tests / futuro worker de sync) —
 * los repositorios y seeds dependen SOLO de este tipo, nunca del driver.
 */
export type AppSqliteDb = BaseSQLiteDatabase<'sync', any, typeof schema>;
