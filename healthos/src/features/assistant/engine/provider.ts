import type { AppSqliteDb } from '@/core/db/types';
import { formatMetricValue, METRIC_META, type InsightMetricId } from '@/features/insights/engine/metric-meta';
import { COMPONENT_LABELS } from '@/features/health-score/engine/types';

import {
  getActiveInsights,
  getBestDay,
  getBiggestChanges,
  getCorrelation,
  getMetricSummary,
  getNutrientDeficits,
  getScoreBreakdown,
  getWorkoutSummary,
} from './tools';

/**
 * Asistente 100% on-device: matcher de intents en español que compone las
 * herramientas de datos y responde con números reales. La interfaz es
 * enchufable: un LLM con tool-use podría implementarla usando las mismas
 * herramientas sin tocar la UI (ADR-0006).
 */

export type AssistantAnswer = {
  text: string;
  /** Links de navegación sugeridos: [etiqueta, ruta] */
  links: [string, string][];
};

export interface AssistantProvider {
  answer(question: string): AssistantAnswer;
}

const fmt = formatMetricValue;
const pct = (v: number) => `${Math.round(Math.abs(v))}%`;

function summaryLine(db: AppSqliteDb, metric: InsightMetricId, days = 14): string | null {
  const s = getMetricSummary(db, metric, days);
  if (s.mean == null) return null;
  const trend =
    s.trendPct != null && Math.abs(s.trendPct) >= 5
      ? ` (${s.trendPct > 0 ? '▲' : '▼'} ${pct(s.trendPct)} vs las 2 semanas previas)`
      : '';
  return `Tu ${METRIC_META[metric].label} promedió ${fmt(metric, s.mean)} en los últimos ${days} días${trend}.`;
}

function insightsFooter(db: AppSqliteDb): string {
  const top = getActiveInsights(db, 3);
  if (top.length === 0) return '';
  return `\n\nPatrones activos:\n${top.map((i) => `• ${i.title}`).join('\n')}`;
}

type Intent = {
  id: string;
  patterns: RegExp[];
  answer: (db: AppSqliteDb) => AssistantAnswer;
};

const INTENTS: Intent[] = [
  {
    id: 'sleep_worse',
    patterns: [
      /(dorm|durm|duerm).*(peor|mal|menos)/i,
      /(peor|mal).*(dorm|durm|duerm|sueñ)/i,
      /por ?qu[eé].*(sueñ|dorm|durm)/i,
      /insomnio/i,
    ],
    answer: (db) => {
      const lines: string[] = [];
      const sleep = summaryLine(db, 'sleep_minutes');
      if (!sleep) {
        return {
          text: 'Todavía no tengo suficientes noches registradas para analizar tu sueño. Registrá el sueño unos días y volvé a preguntarme.',
          links: [['Registrar sueño', '/log-sleep']],
        };
      }
      lines.push(sleep);
      // Sospechosos habituales, con la guarda estadística del motor
      const suspects: [InsightMetricId, string][] = [
        ['caffeine_mg', 'la cafeína'],
        ['last_caffeine_hour', 'la hora de la última cafeína'],
        ['alcohol_units', 'el alcohol'],
        ['stress', 'el estrés'],
      ];
      const found: string[] = [];
      for (const [x, label] of suspects) {
        const c = getCorrelation(db, x, 'sleep_minutes');
        if (c && c.agrees && Math.abs(c.r) >= 0.3 && c.p < 0.1) {
          found.push(`${label} (r=${c.r.toFixed(2).replace('.', ',')}, n=${c.n})`);
        }
      }
      if (found.length > 0) {
        lines.push(`En tus datos, lo que más se asocia con dormir menos: ${found.join('; ')}.`);
      } else {
        lines.push('Ninguno de los sospechosos habituales (cafeína, alcohol, estrés) muestra una relación clara con tu sueño todavía.');
      }
      return { text: lines.join('\n\n') + insightsFooter(db), links: [['Ver sueño', '/stats/sleepMinutes']] };
    },
  },
  {
    id: 'what_changed',
    patterns: [/qu[eé] cambi[oó]/i, /c[oó]mo (vengo|voy) (este|último) mes/i, /resumen del mes/i],
    answer: (db) => {
      const changes = getBiggestChanges(db, 5);
      if (changes.length === 0) {
        return { text: 'No veo cambios grandes entre tu última semana y el mes previo. Consistencia también es un dato.', links: [] };
      }
      const lines = changes.map((c) => {
        const meta = METRIC_META[c.metric];
        const dir = c.relChange > 0 ? '▲ subió' : '▼ bajó';
        return `• ${cap(meta.label)}: ${dir} ${pct(c.relChange * 100)} (${fmt(c.metric, c.meanShort)} vs ${fmt(c.metric, c.meanLong)})`;
      });
      return {
        text: `Lo que más cambió (últimos 7 días vs las 4 semanas previas):\n${lines.join('\n')}`,
        links: [['Ver estadísticas', '/stats']],
      };
    },
  },
  {
    id: 'missing_micros',
    patterns: [/micro(nutriente)?s/i, /vitamina|mineral/i, /qu[eé].*falta/i, /deficien/i],
    answer: (db) => {
      const deficits = getNutrientDeficits(db, 14, 5);
      if (deficits.length === 0) {
        return {
          text: 'Necesito comidas registradas para analizar micronutrientes. Cargá lo que comés unos días y te digo qué te falta.',
          links: [['Registrar comida', '/nutrition']],
        };
      }
      const lines = deficits.map((d) => `• ${d.displayName}: ${Math.round(d.coveragePct)}% de la RDA`);
      return {
        text: `Tus micronutrientes más flojos (promedio de los últimos 14 días con comidas):\n${lines.join('\n')}\n\nPriorizá alimentos ricos en los primeros dos, o evaluá suplementar.`,
        links: [['Ver nutrición', '/nutrition']],
      };
    },
  },
  {
    id: 'best_performance',
    patterns: [/mejor (d[ií]a|rendimiento|momento|semana)/i, /cu[aá]ndo estuve mejor/i, /mejor recuperaci/i],
    answer: (db) => {
      const best = getBestDay(db, 60);
      if (!best) {
        return { text: 'Todavía no hay días con Health Score calculado. Registrá sueño, agua, actividad y ánimo para activarlo.', links: [] };
      }
      const breakdown = getScoreBreakdown(db, best.day);
      const top = breakdown?.components
        .filter((c) => c.available && c.score != null)
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
        .slice(0, 3)
        .map((c) => COMPONENT_LABELS[c.key])
        .join(', ');
      return {
        text: `Tu mejor día de los últimos 2 meses fue el ${best.day} con un Health Score de ${best.score}.${top ? ` Lo que más sumó: ${top}.` : ''}`,
        links: [['Ver ese día', `/day/${best.day}`], ['Desglose del score', `/score/${best.day}`]],
      };
    },
  },
  {
    id: 'weight_explain',
    patterns: [/peso|adelgaz|engord|baj[eé] de peso|sub[ií] de peso/i, /qu[eé] explica.*peso/i],
    answer: (db) => {
      const lines: string[] = [];
      const weight = summaryLine(db, 'weight_kg');
      if (!weight) {
        return { text: 'No tengo pesajes suficientes. Registrá tu peso algunas mañanas seguidas y vuelvo con análisis.', links: [['Registrar peso', '/log-weight']] };
      }
      lines.push(weight);
      const drivers: [InsightMetricId, string][] = [
        ['kcal', 'las calorías'],
        ['sleep_minutes', 'el sueño'],
        ['steps', 'los pasos'],
      ];
      const found: string[] = [];
      for (const [x, label] of drivers) {
        const c = getCorrelation(db, x, 'weight_kg');
        if (c && c.agrees && Math.abs(c.r) >= 0.3 && c.p < 0.1) {
          found.push(`${label} (r=${c.r.toFixed(2).replace('.', ',')})`);
        }
      }
      lines.push(
        found.length > 0
          ? `Variables que más se mueven junto con tu peso: ${found.join('; ')}. Correlación, no causa — pero es donde miraría primero.`
          : 'Ninguna variable muestra todavía una relación estadísticamente decente con tu peso; con más días de datos esto mejora.',
      );
      return { text: lines.join('\n\n'), links: [['Ver peso', '/stats/weightKg']] };
    },
  },
  {
    id: 'worse_habits',
    patterns: [/h[aá]bito.*(empeor|peor)/i, /qu[eé] empeor[oó]/i, /en qu[eé] aflojé/i],
    answer: (db) => {
      const changes = getBiggestChanges(db, 8).filter((c) => {
        const bad = METRIC_META[c.metric].badWhenHigh;
        if (bad === null) return false;
        return bad ? c.relChange > 0 : c.relChange < 0;
      });
      if (changes.length === 0) {
        return { text: 'Nada empeoró de forma clara esta semana comparada con tu mes. 👏', links: [] };
      }
      const lines = changes
        .slice(0, 4)
        .map((c) => `• ${cap(METRIC_META[c.metric].label)}: ${c.relChange > 0 ? 'subió' : 'bajó'} ${pct(c.relChange * 100)}`);
      return { text: `Hábitos que empeoraron esta semana:\n${lines.join('\n')}`, links: [['Ver estadísticas', '/stats']] };
    },
  },
  {
    id: 'hydration',
    patterns: [/agua|hidrata/i],
    answer: (db) => {
      const line = summaryLine(db, 'water_ml');
      return {
        text: line ?? 'Sin registros de agua todavía. El botón + lo resuelve en dos taps.',
        links: [['Ver hidratación', '/stats/waterMl']],
      };
    },
  },
  {
    id: 'caffeine',
    patterns: [/caf[eé]|cafe[ií]na|mate|monster|energ[eé]tica/i],
    answer: (db) => {
      const lines: string[] = [];
      const caffeine = summaryLine(db, 'caffeine_mg');
      if (!caffeine) return { text: 'No hay registros de cafeína todavía.', links: [['Registrar cafeína', '/log-caffeine']] };
      lines.push(caffeine);
      const c = getCorrelation(db, 'caffeine_mg', 'sleep_minutes');
      if (c && c.agrees && c.r < -0.3 && c.p < 0.1) {
        lines.push(`Ojo: en tus datos, más cafeína se asocia con dormir menos (r=${c.r.toFixed(2).replace('.', ',')}, n=${c.n}).`);
      }
      return { text: lines.join('\n\n'), links: [['Ver cafeína', '/stats/caffeineMg']] };
    },
  },
  {
    id: 'training',
    patterns: [/entren|gym|gimnasio|volumen|fuerza|pesas/i],
    answer: (db) => {
      const s = getWorkoutSummary(db, 28);
      if (s.sessions === 0) {
        return { text: 'No hay entrenamientos registrados en el último mes. El logger en vivo te espera en el botón +.', links: [] };
      }
      const per = (s.sessions / 4).toFixed(1).replace('.', ',');
      return {
        text: `Último mes: ${s.sessions} sesiones (~${per}/semana), ${Math.round(s.minutes)} min totales y ${Math.round(s.volumeKg).toLocaleString('es-AR')} kg de volumen de fuerza.${s.daysSinceLast != null && s.daysSinceLast > 3 ? ` Hace ${s.daysSinceLast} días que no entrenás.` : ''}`,
        links: [['Ver volumen', '/stats/strengthVolumeKg']],
      };
    },
  },
  {
    id: 'score_today',
    patterns: [/score|puntaje/i, /c[oó]mo (vengo|estoy) hoy/i, /mi d[ií]a/i],
    answer: (db) => {
      const breakdown = getScoreBreakdown(db);
      if (!breakdown || breakdown.score == null) {
        return { text: 'Hoy todavía no hay score: registrá al menos 3 áreas (sueño, agua, actividad, ánimo…) y se activa.', links: [] };
      }
      const reasons = breakdown.components
        .flatMap((c) => c.reasons)
        .filter((r) => r.impact !== 0)
        .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
        .slice(0, 3)
        .map((r) => `• ${r.text} (${r.impact > 0 ? '+' : ''}${Math.round(r.impact)})`);
      return {
        text: `Tu Health Score de hoy: ${breakdown.score}/100.${reasons.length ? `\n\nLo que más pesó:\n${reasons.join('\n')}` : ''}`,
        links: [['Ver desglose', `/score/${breakdown.date}`]],
      };
    },
  },
  {
    id: 'protein',
    patterns: [/prote[ií]na/i],
    answer: (db) => {
      const line = summaryLine(db, 'protein_g');
      return {
        text: line ?? 'Sin comidas registradas no puedo calcular tu proteína. Cargá lo que comés y te sigo el promedio.',
        links: [['Ver proteína', '/stats/proteinG']],
      };
    },
  },
  {
    id: 'recovery',
    patterns: [/recupera|dolor muscular|agujetas|descanso/i],
    answer: (db) => {
      const lines = [summaryLine(db, 'soreness'), summaryLine(db, 'sleep_minutes'), summaryLine(db, 'energy')]
        .filter((l): l is string => l != null);
      if (lines.length === 0) {
        return { text: 'Registrá dolor muscular, sueño y energía unos días y te armo el panorama de recuperación.', links: [] };
      }
      const c = getCorrelation(db, 'strength_volume_kg', 'soreness');
      if (c && c.agrees && c.r > 0.3 && c.p < 0.1) {
        lines.push(`Tu dolor muscular sube con el volumen de fuerza (r=${c.r.toFixed(2).replace('.', ',')}) — nada raro, pero dosificá.`);
      }
      return { text: lines.join('\n\n'), links: [['Ver ánimo y energía', '/stats/energy']] };
    },
  },
];

export class LocalAssistantProvider implements AssistantProvider {
  constructor(private readonly db: AppSqliteDb) {}

  answer(question: string): AssistantAnswer {
    for (const intent of INTENTS) {
      if (intent.patterns.some((p) => p.test(question))) {
        return intent.answer(this.db);
      }
    }
    // Fallback: insights activos + guía
    const top = getActiveInsights(this.db, 4);
    const body =
      top.length > 0
        ? `Esto es lo más relevante que encontré en tus datos:\n${top.map((i) => `• ${i.title}`).join('\n')}`
        : 'Todavía no encuentro patrones en tus datos — con un par de semanas de registros esto se pone interesante.';
    return {
      text: `${body}\n\nProbá preguntarme: "¿por qué duermo peor?", "¿qué cambió este mes?", "¿qué micronutrientes me faltan?" o "¿cómo vengo hoy?".`,
      links: top.length > 0 ? [['Ver insights', '/insights']] : [],
    };
  }
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
