import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

import * as schema from './schema';

/**
 * Singleton de la base local.
 * WAL para escrituras no bloqueantes; foreign_keys para integridad de los
 * joins entreno/comidas/labs.
 */
const expoDb = openDatabaseSync('healthos.db');
expoDb.execSync('PRAGMA journal_mode = WAL;');
expoDb.execSync('PRAGMA foreign_keys = ON;');

export const db = drizzle(expoDb, { schema });

export type AppDb = typeof db;
