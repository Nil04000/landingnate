/** Stub de expo-crypto para Vitest (Node): usa el crypto nativo. */
export function randomUUID(): string {
  return globalThis.crypto.randomUUID();
}
