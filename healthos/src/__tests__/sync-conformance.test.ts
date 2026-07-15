import { getTableColumns, getTableName } from 'drizzle-orm';
import { SQLiteTable } from 'drizzle-orm/sqlite-core';
import { describe, expect, it } from 'vitest';

import * as schema from '@/core/db/schema';

/**
 * Test de conformidad del contrato sync-ready (ADR-0002):
 * TODA tabla del schema debe llevar las columnas de sync, salvo las
 * local-only explícitamente exceptuadas (derivadas/reconstruibles).
 * Si alguien agrega una tabla sin el contrato, este test la atrapa.
 */

const LOCAL_ONLY_TABLES = new Set(['daily_aggregates', 'sync_state', 'app_meta']);

const SYNC_COLUMNS = ['id', 'created_at', 'updated_at', 'deleted_at', 'is_dirty'] as const;

function allTables(): { name: string; table: SQLiteTable }[] {
  return Object.values(schema as Record<string, unknown>)
    .filter((value): value is SQLiteTable => value instanceof SQLiteTable)
    .map((table) => ({ name: getTableName(table), table }));
}

describe('conformidad sync-ready', () => {
  it('el schema expone todas las tablas esperadas', () => {
    const names = allTables().map((t) => t.name);
    expect(names.length).toBeGreaterThanOrEqual(25);
    expect(names).toContain('body_measurements');
    expect(names).toContain('lab_results');
    expect(names).toContain('meal_items');
  });

  it('toda tabla sincronizable cumple el contrato de columnas', () => {
    for (const { name, table } of allTables()) {
      if (LOCAL_ONLY_TABLES.has(name)) continue;
      const columns = Object.values(getTableColumns(table)).map((c) => c.name);
      for (const required of SYNC_COLUMNS) {
        expect(columns, `tabla ${name} sin columna ${required}`).toContain(required);
      }
    }
  });

  it('las local-only NO llevan columnas de sync (no deben pushearse)', () => {
    for (const { name, table } of allTables()) {
      if (!LOCAL_ONLY_TABLES.has(name)) continue;
      const columns = Object.values(getTableColumns(table)).map((c) => c.name);
      expect(columns, `tabla ${name} no debería tener is_dirty`).not.toContain('is_dirty');
    }
  });
});
