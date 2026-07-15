import { and, asc, desc, eq } from 'drizzle-orm';

import { labMarkers, labPanels, labReferenceRanges, labReports, labResults, userProfile } from '../schema';
import type { AppSqliteDb } from '../types';
import { insertStamp, notDeleted, softDeleteStamp, updateStamp } from './base.repository';

export type LabPanel = typeof labPanels.$inferSelect;
export type LabMarker = typeof labMarkers.$inferSelect;
export type LabReferenceRange = typeof labReferenceRanges.$inferSelect;
export type LabReport = typeof labReports.$inferSelect;
export type LabResult = typeof labResults.$inferSelect;

export type LabFlag = 'low' | 'high' | 'in_range' | 'optimal';

/** Flag de un valor contra su rango (banda óptima anidada en la de referencia). */
export function computeFlag(value: number, range: LabReferenceRange | undefined): LabFlag | null {
  if (!range) return null;
  if (range.low != null && value < range.low) return 'low';
  if (range.high != null && value > range.high) return 'high';
  const optLowOk = range.optimalLow == null || value >= range.optimalLow;
  const optHighOk = range.optimalHigh == null || value <= range.optimalHigh;
  if ((range.optimalLow != null || range.optimalHigh != null) && optLowOk && optHighOk) {
    return 'optimal';
  }
  return 'in_range';
}

export type MarkerWithLatest = LabMarker & {
  panel: LabPanel | null;
  latest: (LabResult & { collectedAt: number }) | null;
  previous: (LabResult & { collectedAt: number }) | null;
  range: LabReferenceRange | undefined;
};

export class LabsRepository {
  constructor(private readonly db: AppSqliteDb) {}

  // ── Catálogo ───────────────────────────────────────────────────

  listPanels(): LabPanel[] {
    return this.db
      .select()
      .from(labPanels)
      .where(notDeleted(labPanels.deletedAt))
      .orderBy(asc(labPanels.sortIndex))
      .all();
  }

  listMarkers(panelId?: string): LabMarker[] {
    const conditions = [notDeleted(labMarkers.deletedAt)];
    if (panelId) conditions.push(eq(labMarkers.panelId, panelId));
    return this.db
      .select()
      .from(labMarkers)
      .where(and(...conditions))
      .orderBy(asc(labMarkers.name))
      .all();
  }

  getMarker(id: string): LabMarker | undefined {
    return this.db
      .select()
      .from(labMarkers)
      .where(and(eq(labMarkers.id, id), notDeleted(labMarkers.deletedAt)))
      .get();
  }

  createCustomMarker(input: {
    name: string;
    unit: string;
    panelId?: string;
    low?: number;
    high?: number;
    optimalLow?: number;
    optimalHigh?: number;
    higherIsWorse?: 0 | 1;
  }): LabMarker {
    const code = `custom_${input.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
    const marker = {
      ...insertStamp(),
      panelId: input.panelId ?? null,
      code,
      name: input.name,
      unit: input.unit,
      higherIsWorse: input.higherIsWorse ?? null,
    };
    this.db.insert(labMarkers).values(marker).run();
    if (input.low != null || input.high != null || input.optimalLow != null || input.optimalHigh != null) {
      this.db
        .insert(labReferenceRanges)
        .values({
          ...insertStamp(),
          markerId: marker.id,
          low: input.low ?? null,
          high: input.high ?? null,
          optimalLow: input.optimalLow ?? null,
          optimalHigh: input.optimalHigh ?? null,
          sourceLabel: 'custom',
        })
        .run();
    }
    return this.getMarker(marker.id)!;
  }

  /**
   * Rango aplicable a un marcador: prioriza el que matchea el sexo del perfil,
   * cae al rango sin sexo. (Edad: pendiente para cuando el perfil la tenga.)
   */
  rangeFor(markerId: string): LabReferenceRange | undefined {
    const profile = this.db.select().from(userProfile).where(eq(userProfile.id, 'self')).get();
    const ranges = this.db
      .select()
      .from(labReferenceRanges)
      .where(and(eq(labReferenceRanges.markerId, markerId), notDeleted(labReferenceRanges.deletedAt)))
      .all();
    if (ranges.length === 0) return undefined;
    const bySex = profile?.sex ? ranges.find((r) => r.sex === profile.sex) : undefined;
    return bySex ?? ranges.find((r) => r.sex == null) ?? ranges[0];
  }

  // ── Reportes y resultados ──────────────────────────────────────

  createReport(input: { collectedAt: number; labName?: string; fasting?: number; notes?: string }): LabReport {
    const row = {
      ...insertStamp(),
      collectedAt: input.collectedAt,
      labName: input.labName ?? null,
      fasting: input.fasting ?? null,
      notes: input.notes ?? null,
    };
    this.db.insert(labReports).values(row).run();
    return this.db.select().from(labReports).where(eq(labReports.id, row.id)).get()!;
  }

  softDeleteReport(id: string): void {
    this.db.update(labReports).set(softDeleteStamp()).where(eq(labReports.id, id)).run();
    for (const result of this.listResultsByReport(id)) {
      this.db.update(labResults).set(softDeleteStamp()).where(eq(labResults.id, result.id)).run();
    }
  }

  listReports(): LabReport[] {
    return this.db
      .select()
      .from(labReports)
      .where(notDeleted(labReports.deletedAt))
      .orderBy(desc(labReports.collectedAt))
      .all();
  }

  getReport(id: string): LabReport | undefined {
    return this.db
      .select()
      .from(labReports)
      .where(and(eq(labReports.id, id), notDeleted(labReports.deletedAt)))
      .get();
  }

  /** Agrega un resultado calculando el flag contra el rango aplicable. */
  addResult(reportId: string, markerId: string, value: number, unit?: string): LabResult {
    const marker = this.getMarker(markerId);
    const flag = computeFlag(value, this.rangeFor(markerId));
    const row = {
      ...insertStamp(),
      reportId,
      markerId,
      value,
      unit: unit ?? marker?.unit ?? '',
      flag,
    };
    this.db.insert(labResults).values(row).run();
    return this.db.select().from(labResults).where(eq(labResults.id, row.id)).get()!;
  }

  updateResult(id: string, value: number): void {
    const existing = this.db.select().from(labResults).where(eq(labResults.id, id)).get();
    if (!existing) return;
    const flag = computeFlag(value, this.rangeFor(existing.markerId));
    this.db
      .update(labResults)
      .set({ value, flag, ...updateStamp() })
      .where(eq(labResults.id, id))
      .run();
  }

  softDeleteResult(id: string): void {
    this.db.update(labResults).set(softDeleteStamp()).where(eq(labResults.id, id)).run();
  }

  listResultsByReport(reportId: string): (LabResult & { marker: LabMarker })[] {
    const rows = this.db
      .select({ result: labResults, marker: labMarkers })
      .from(labResults)
      .innerJoin(labMarkers, eq(labResults.markerId, labMarkers.id))
      .where(and(eq(labResults.reportId, reportId), notDeleted(labResults.deletedAt)))
      .orderBy(asc(labMarkers.name))
      .all();
    return rows.map((r) => ({ ...r.result, marker: r.marker }));
  }

  /** Historial completo de un marcador (para el gráfico), ascendente por fecha. */
  markerHistory(markerId: string): (LabResult & { collectedAt: number })[] {
    const rows = this.db
      .select({ result: labResults, report: labReports })
      .from(labResults)
      .innerJoin(labReports, eq(labResults.reportId, labReports.id))
      .where(
        and(
          eq(labResults.markerId, markerId),
          notDeleted(labResults.deletedAt),
          notDeleted(labReports.deletedAt),
        ),
      )
      .orderBy(asc(labReports.collectedAt))
      .all();
    return rows.map((r) => ({ ...r.result, collectedAt: r.report.collectedAt }));
  }

  /**
   * Vista del índice de labs: cada marcador con último valor, valor anterior
   * y rango — solo marcadores que tienen al menos un resultado, más el
   * catálogo completo aparte para el flujo de carga.
   */
  markersWithLatest(): MarkerWithLatest[] {
    const panels = new Map(this.listPanels().map((p) => [p.id, p]));
    const out: MarkerWithLatest[] = [];
    for (const marker of this.listMarkers()) {
      const history = this.markerHistory(marker.id);
      if (history.length === 0) continue;
      out.push({
        ...marker,
        panel: marker.panelId ? (panels.get(marker.panelId) ?? null) : null,
        latest: history[history.length - 1] ?? null,
        previous: history.length > 1 ? (history[history.length - 2] ?? null) : null,
        range: this.rangeFor(marker.id),
      });
    }
    return out;
  }
}
