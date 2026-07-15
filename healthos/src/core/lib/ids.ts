import * as Crypto from 'expo-crypto';

/** uuid v4 para PKs sync-ready (nunca autoincrement). */
export function newId(): string {
  return Crypto.randomUUID();
}
