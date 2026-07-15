import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';

import { db } from './client';
import migrations from './migrations/migrations';

/**
 * Gate de migraciones para el layout raíz: la UI no monta hasta que el
 * schema esté al día. `success` pasa a true también cuando no hay nada
 * que aplicar.
 */
export function useDbMigrations(): { success: boolean; error: Error | undefined } {
  const { success, error } = useMigrations(db, migrations);
  return { success, error: error ?? undefined };
}
