import type { DailyAggregate } from '@/core/db/repositories/aggregates.repository';
import { pearson } from '@/core/lib/stats/pearson';
import { spearman } from '@/core/lib/stats/spearman';
import { welch } from '@/core/lib/stats/welch';
import { weekdayOf } from '@/core/lib/dates';

import { METRIC_META, formatMetricValue, type InsightMetricId } from './metric-meta';
import type {
  CorrelationRule,
  InsightRule,
  RecordRule,
  StreakRule,
  ThresholdRule,
  TrendRule,
  WeekdayRule,
} from './rules';

/** Fila del pipeline: agregado + día (ascendente, el último es hoy). */
export type DayRow = { day: string; agg: DailyAggregate };

export type InsightFinding = {
  ruleId: string;
  kind: InsightRule['kind'];
  title: string;
  body: string;
  severity: 'info' | 'notable' | 'warning';
  /** 0..1 — efecto normalizado, base del ranking */
  relevance: number;
  metrics: Record<string, number | string>;
  periodStart: string;
  periodEnd: string;
};

const WEEKDAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

const mean = (values: number[]) =>
  values.length ? values.reduce((a, b) => a + b, 0) / values.length : NaN;

function values(rows: DayRow[], metric: InsightMetricId): (number | null)[] {
  const get = METRIC_META[metric].get;
  return rows.map((r) => get(r.agg));
}

/** ¿Un cambio en `metric` hacia arriba es malo? null si neutral. */
function isAdverseChange(metric: InsightMetricId, delta: number): boolean {
  const bad = METRIC_META[metric].badWhenHigh;
  if (bad === null) return false;
  return bad ? delta > 0 : delta < 0;
}

// ── Evaluadores ──────────────────────────────────────────────────

function evalCorrelation(rule: CorrelationRule, rows: DayRow[]): InsightFinding | null {
  const window = rows.slice(-rule.windowDays);
  const xs = values(window, rule.x);
  const ys = values(window, rule.y);
  // lag: x de ayer contra y de hoy
  const xLagged = rule.lagDays === 0 ? xs : xs.slice(0, -1);
  const yLagged = rule.lagDays === 0 ? ys : ys.slice(1);

  const p = pearson(xLagged, yLagged);
  if (p.n < rule.minN || Number.isNaN(p.r)) return null;
  if (Math.abs(p.r) < rule.minAbsR || p.p > rule.maxP) return null;

  // Guarda anti-outliers: Spearman tiene que acordar en magnitud y signo
  const s = spearman(xLagged, yLagged);
  if (Number.isNaN(s.r) || Math.abs(s.r) < rule.minAbsR || Math.sign(s.r) !== Math.sign(p.r)) {
    return null;
  }

  const xMeta = METRIC_META[rule.x];
  const yMeta = METRIC_META[rule.y];
  const more = p.r > 0 ? 'más' : 'menos';
  const lagText = rule.lagDays === 1 ? ' del día siguiente' : '';

  const adverse = isAdverseChange(rule.y, Math.sign(p.r));
  return {
    ruleId: rule.id,
    kind: 'correlation',
    title: `${cap(xMeta.label)} y ${yMeta.label}${lagText} van juntos`,
    body: `En los últimos ${rule.windowDays} días, a más ${xMeta.label}, ${more} ${yMeta.label}${lagText} (tendencia, no causa: r=${fmtR(p.r)}, n=${p.n}).`,
    severity: adverse ? 'warning' : 'info',
    relevance: Math.min(1, Math.abs(p.r)),
    metrics: { r: round2(p.r), rSpearman: round2(s.r), n: p.n, p: round4(p.p), lagDays: rule.lagDays, x: rule.x, y: rule.y },
    periodStart: window[0]?.day ?? '',
    periodEnd: window[window.length - 1]?.day ?? '',
  };
}

function evalThreshold(rule: ThresholdRule, rows: DayRow[]): InsightFinding | null {
  const window = rows.slice(-rule.windowDays);
  const xs = values(window, rule.x);
  const ys = values(window, rule.y);

  const bucketA: number[] = [];
  const bucketB: number[] = [];
  for (let i = 0; i < window.length; i++) {
    const x = xs[i];
    const yIndex = i + rule.lagDays;
    const y = yIndex < ys.length ? ys[yIndex] : null;
    if (x == null || y == null) continue;
    const matches = rule.op === '>' ? x > rule.threshold : x < rule.threshold;
    (matches ? bucketA : bucketB).push(y);
  }

  if (bucketA.length < rule.minNPerBucket || bucketB.length < rule.minNPerBucket) return null;
  const w = welch(bucketA, bucketB);
  if (!w || Math.abs(w.cohenD) < rule.minAbsD || w.p > 0.05) return null;

  const xMeta = METRIC_META[rule.x];
  const yMeta = METRIC_META[rule.y];
  const diff = w.meanA - w.meanB;
  const opText = rule.op === '>' ? 'más de' : 'menos de';
  const lagText = rule.lagDays === 1 ? ' al día siguiente' : '';
  const adverse = isAdverseChange(rule.y, diff);

  return {
    ruleId: rule.id,
    kind: 'threshold',
    title: `Con ${opText} ${formatMetricValue(rule.x, rule.threshold)} de ${xMeta.label}, tu ${yMeta.label} cambia`,
    body: `En los ${w.nA} días con ${xMeta.label} ${rule.op === '>' ? 'por encima' : 'por debajo'} de ${formatMetricValue(rule.x, rule.threshold)}, tu ${yMeta.label}${lagText} promedió ${formatMetricValue(rule.y, w.meanA)} vs ${formatMetricValue(rule.y, w.meanB)} el resto (n=${w.nA} vs ${w.nB}, d=${fmtR(w.cohenD)}).`,
    severity: adverse ? 'warning' : Math.abs(w.cohenD) >= 0.8 ? 'notable' : 'info',
    relevance: Math.min(1, Math.abs(w.cohenD) / 1.2),
    metrics: { d: round2(w.cohenD), p: round4(w.p), nA: w.nA, nB: w.nB, meanA: round2(w.meanA), meanB: round2(w.meanB), x: rule.x, y: rule.y, threshold: rule.threshold },
    periodStart: window[0]?.day ?? '',
    periodEnd: window[window.length - 1]?.day ?? '',
  };
}

function evalWeekday(rule: WeekdayRule, rows: DayRow[]): InsightFinding | null {
  const window = rows.slice(-rule.windowDays);
  const get = METRIC_META[rule.metric].get;

  const inScope: number[] = [];
  const outScope: number[] = [];
  for (const row of window) {
    const value = get(row.agg);
    if (value == null) continue;
    const wd = weekdayOf(row.day);
    const matches = rule.scope === 'weekend' ? wd === 0 || wd === 6 : wd === rule.scope;
    (matches ? inScope : outScope).push(value);
  }

  if (inScope.length < rule.minOccurrences || outScope.length < 8) return null;
  const mIn = mean(inScope);
  const mOut = mean(outScope);
  if (!Number.isFinite(mIn) || !Number.isFinite(mOut) || mOut === 0) return null;
  const relDiff = (mIn - mOut) / Math.abs(mOut);
  if (Math.abs(relDiff) < rule.minRelDiff) return null;

  const meta = METRIC_META[rule.metric];
  const scopeText = rule.scope === 'weekend' ? 'los fines de semana' : `los ${WEEKDAY_NAMES[rule.scope]}`;
  const pct = Math.round(Math.abs(relDiff) * 100);
  const moreLess = relDiff > 0 ? 'más' : 'menos';

  return {
    ruleId: rule.id,
    kind: 'weekday',
    title: `${cap(scopeText)}: ${pct}% ${moreLess} ${meta.label}`,
    body: `${cap(scopeText)} tu ${meta.label} promedia ${formatMetricValue(rule.metric, mIn)}, un ${pct}% ${moreLess} que el resto de la semana (${formatMetricValue(rule.metric, mOut)}).`,
    severity: isAdverseChange(rule.metric, relDiff) && pct >= 30 ? 'warning' : 'info',
    relevance: Math.min(1, Math.abs(relDiff)),
    metrics: { relDiff: round2(relDiff), meanIn: round2(mIn), meanOut: round2(mOut), nIn: inScope.length, nOut: outScope.length, metric: rule.metric },
    periodStart: window[0]?.day ?? '',
    periodEnd: window[window.length - 1]?.day ?? '',
  };
}

function evalTrend(rule: TrendRule, rows: DayRow[]): InsightFinding | null {
  const vals = values(rows, rule.metric);
  const shortVals = vals.slice(-rule.shortWindow).filter((v): v is number => v != null);
  const longVals = vals
    .slice(-(rule.shortWindow + rule.longWindow), -rule.shortWindow)
    .filter((v): v is number => v != null);

  if (shortVals.length < rule.minN || longVals.length < rule.minN * 2) return null;
  const mShort = mean(shortVals);
  const mLong = mean(longVals);
  if (!Number.isFinite(mShort) || !Number.isFinite(mLong) || mLong === 0) return null;
  const relChange = (mShort - mLong) / Math.abs(mLong);
  if (Math.abs(relChange) < rule.minRelChange) return null;

  const meta = METRIC_META[rule.metric];
  const pct = Math.round(Math.abs(relChange) * 100);
  const upDown = relChange > 0 ? 'subió' : 'bajó';
  const adverse = isAdverseChange(rule.metric, relChange);

  return {
    ruleId: rule.id,
    kind: 'trend',
    title: `Tu ${meta.label} ${upDown} ${pct}%`,
    body: `Promedio de los últimos ${rule.shortWindow} días: ${formatMetricValue(rule.metric, mShort)}, contra ${formatMetricValue(rule.metric, mLong)} de las ${Math.round(rule.longWindow / 7)} semanas previas.`,
    severity: adverse ? 'warning' : 'notable',
    relevance: Math.min(1, Math.abs(relChange) * 2),
    metrics: { relChange: round2(relChange), meanShort: round2(mShort), meanLong: round2(mLong), metric: rule.metric },
    periodStart: rows[Math.max(0, rows.length - rule.shortWindow - rule.longWindow)]?.day ?? '',
    periodEnd: rows[rows.length - 1]?.day ?? '',
  };
}

function evalRecord(rule: RecordRule, rows: DayRow[]): InsightFinding | null {
  const window = rows.slice(-rule.windowDays);
  if (window.length < 2) return null;
  const get = METRIC_META[rule.metric].get;

  const last = window[window.length - 1]!;
  const lastValue = get(last.agg);
  if (lastValue == null) return null;

  const prior = window
    .slice(0, -1)
    .map((r) => get(r.agg))
    .filter((v): v is number => v != null);
  if (prior.length < rule.minPriorDays) return null;

  const best = rule.direction === 'max' ? Math.max(...prior) : Math.min(...prior);
  const isRecord = rule.direction === 'max' ? lastValue > best : lastValue < best;
  if (!isRecord) return null;

  const meta = METRIC_META[rule.metric];
  const kindText = rule.direction === 'max' ? 'máximo' : 'mínimo';

  return {
    ruleId: rule.id,
    kind: 'record',
    title: `Récord: ${formatMetricValue(rule.metric, lastValue)} de ${meta.label}`,
    body: `Hoy marcaste tu ${kindText} de ${meta.label} de los últimos ${rule.windowDays} días (anterior: ${formatMetricValue(rule.metric, best)}).`,
    severity: 'notable',
    relevance: 0.8,
    metrics: { value: round2(lastValue), previousBest: round2(best), metric: rule.metric },
    periodStart: window[0]!.day,
    periodEnd: last.day,
  };
}

function evalStreak(rule: StreakRule, rows: DayRow[]): InsightFinding | null {
  const get = METRIC_META[rule.metric].get;
  let current = 0;
  for (let i = rows.length - 1; i >= 0; i--) {
    const row = rows[i]!;
    const value = get(row.agg);
    const logged = (row.agg.loggedModules ?? 0) > 0;
    let satisfied: boolean;
    if (value == null) {
      satisfied = Boolean(rule.nullCounts) && logged;
    } else {
      satisfied = rule.direction === 'at_least' ? value >= rule.threshold : value <= rule.threshold;
    }
    if (!satisfied) break;
    current++;
  }
  if (current < rule.minLength) return null;

  const meta = METRIC_META[rule.metric];
  const isAbstinence = rule.direction === 'at_most';
  const title = isAbstinence
    ? `Racha: ${current} días sin ${meta.label}`
    : `Racha: ${current} días con ${formatMetricValue(rule.metric, rule.threshold)}+ de ${meta.label}`;

  return {
    ruleId: rule.id,
    kind: 'streak',
    title,
    body: isAbstinence
      ? `Llevás ${current} días seguidos sin registrar ${meta.label}. Seguí así.`
      : `Llevás ${current} días seguidos cumpliendo tu piso de ${meta.label}.`,
    severity: 'notable',
    relevance: Math.min(1, 0.5 + current / 20),
    metrics: { length: current, threshold: rule.threshold, metric: rule.metric },
    periodStart: rows[Math.max(0, rows.length - current)]?.day ?? '',
    periodEnd: rows[rows.length - 1]?.day ?? '',
  };
}

export function evaluateRule(rule: InsightRule, rows: DayRow[]): InsightFinding | null {
  switch (rule.kind) {
    case 'correlation':
      return evalCorrelation(rule, rows);
    case 'threshold':
      return evalThreshold(rule, rows);
    case 'weekday':
      return evalWeekday(rule, rows);
    case 'trend':
      return evalTrend(rule, rows);
    case 'record':
      return evalRecord(rule, rows);
    case 'streak':
      return evalStreak(rule, rows);
  }
}

// ── Helpers ──────────────────────────────────────────────────────

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const round2 = (v: number) => Math.round(v * 100) / 100;
const round4 = (v: number) => Math.round(v * 10000) / 10000;
const fmtR = (v: number) => v.toFixed(2).replace('.', ',').replace('-', '−');
