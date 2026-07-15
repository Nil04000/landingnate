import { isNull } from 'drizzle-orm';
import type { Column } from 'drizzle-orm';

import { newId } from '@/core/lib/ids';

/**
 * Semántica sync-ready estampada en UN solo lugar:
 *
 * - insert  → id uuid + createdAt/updatedAt + isDirty=1
 * - update  → updatedAt + isDirty=1
 * - delete  → SOFT: deletedAt + updatedAt + isDirty=1 (nunca DELETE físico)
 * - listado → siempre filtrar con notDeleted(tabla.deletedAt)
 *
 * Todo repositorio concreto compone estos helpers; ninguno re-implementa
 * el estampado a mano.
 */

export function insertStamp(): {
  id: string;
  createdAt: number;
  updatedAt: number;
  isDirty: number;
} {
  const now = Date.now();
  return { id: newId(), createdAt: now, updatedAt: now, isDirty: 1 };
}

export function updateStamp(): { updatedAt: number; isDirty: number } {
  return { updatedAt: Date.now(), isDirty: 1 };
}

export function softDeleteStamp(): { deletedAt: number; updatedAt: number; isDirty: number } {
  const now = Date.now();
  return { deletedAt: now, updatedAt: now, isDirty: 1 };
}

/** `WHERE deleted_at IS NULL` — obligatorio en toda lectura. */
export function notDeleted(deletedAtColumn: Column) {
  return isNull(deletedAtColumn);
}
