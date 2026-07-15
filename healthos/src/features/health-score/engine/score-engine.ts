import type { DailyAggregate } from '@/core/db/repositories/aggregates.repository';
import { stddev } from '@/core/lib/stats/pearson';

import {
  ALGO_VERSION,
  COMPONENT_WEIGHTS,
  type ScoreBreakdown,
  type ScoreComponent,
  type ScoreComponentKey,
  type ScoreGoals,
  type ScoreReason,
} from './types';

/**
 * Motor del Health Score (0-100, explicable). Función PURA:
 * (agregado del día, contexto) → desglose completo con razones.
 *
 * Regla dura: dato faltante ≠ cero. Un componente sin registros queda
 * `available: false`, se excluye y los pesos restantes se renormalizan.
 * Si el peso disponible < 0.45 o hay < 3 componentes → score null
 * ("datos insuficientes"), nunca un número engañoso.
 */

export type ScoreContext = {
  goals: ScoreGoals;
  /** Días ANTERIORES al evaluado, ascendentes (ventana de hasta 28) */
  trailing: DailyAggregate[];
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const round1 = (v: number) => Math.round(v * 10) / 10;

type ComponentDraft = {
  score: number | null;
  available: boolean;
  inputs: Record<string, number | null>;
  reasons: ScoreReason[];
};

function unavailable(inputs: Record<string, number | null> = {}): ComponentDraft {
  return { score: null, available: false, inputs, reasons: [] };
}

// ── Componentes ──────────────────────────────────────────────────

function sleepComponent(agg: DailyAggregate, ctx: ScoreContext): ComponentDraft {
  if (agg.sleepMinutes == null) return unavailable();
  const goal = ctx.goals.sleepMinutes;
  const nap = Math.min(agg.napMinutes ?? 0, 60);
  const duration = agg.sleepMinutes + 0.5 * nap;

  let durationScore: number;
  if (duration < goal - 30) {
    durationScore = 100 * clamp01((duration - (goal - 210)) / 180);
  } else if (duration > goal + 45) {
    durationScore = 100 * clamp01(1 - (duration - (goal + 45)) / 195);
  } else {
    durationScore = 100;
  }

  const reasons: ScoreReason[] = [];
  if (durationScore < 100) {
    const short = duration < goal;
    const hours = Math.floor(duration / 60);
    const minutes = Math.round(duration % 60);
    reasons.push({
      code: short ? 'sleep_short' : 'sleep_long',
      text: short
        ? `Dormiste ${hours} h ${minutes} min (objetivo ${Math.round(goal / 60)} h)`
        : `Dormiste de más: ${hours} h ${minutes} min`,
      impact: round1(durationScore - 100),
    });
  }

  // Consistencia: stddev de hora de acostarse en la ventana de 7 días
  const bedtimes = [...ctx.trailing.slice(-6).map((d) => d.bedtimeMinute), agg.bedtimeMinute].filter(
    (v): v is number => v != null,
  );
  let consistencyFactor = 1;
  if (bedtimes.length >= 3) {
    const sd = stddev(bedtimes);
    // factor = 1 − clamp(sd/180, 0, 0.25): hasta −25% por horario caótico
    consistencyFactor = 1 - Math.min(0.25, Math.max(0, sd / 180));
    if (consistencyFactor < 1) {
      reasons.push({
        code: 'sleep_inconsistent',
        text: `Horario de acostarse irregular (±${Math.round(sd)} min esta semana)`,
        impact: round1(durationScore * (consistencyFactor - 1)),
      });
    }
  }
  let score = durationScore * consistencyFactor;

  if (agg.sleepQuality != null) {
    const qualityScore = ((agg.sleepQuality - 1) / 4) * 100;
    const blended = 0.8 * score + 0.2 * qualityScore;
    if (Math.abs(blended - score) >= 1) {
      reasons.push({
        code: 'sleep_quality',
        text: `Calidad subjetiva ${agg.sleepQuality}/5`,
        impact: round1(blended - score),
      });
    }
    score = blended;
  }

  return {
    score,
    available: true,
    inputs: {
      sleepMinutes: agg.sleepMinutes,
      napMinutes: agg.napMinutes,
      goalMinutes: goal,
      quality: agg.sleepQuality,
      bedtimeMinute: agg.bedtimeMinute,
    },
    reasons,
  };
}

function activityComponent(agg: DailyAggregate, ctx: ScoreContext): ComponentDraft {
  if (agg.steps == null) return unavailable();
  const ratio = clamp01(agg.steps / ctx.goals.steps);
  const score = 100 * ratio;
  const reasons: ScoreReason[] =
    ratio < 1
      ? [
          {
            code: 'steps_below_goal',
            text: `${agg.steps.toLocaleString('es-AR')} pasos de ${ctx.goals.steps.toLocaleString('es-AR')}`,
            impact: round1(score - 100),
          },
        ]
      : [];
  return { score, available: true, inputs: { steps: agg.steps, goal: ctx.goals.steps }, reasons };
}

function trainingComponent(agg: DailyAggregate, ctx: ScoreContext): ComponentDraft {
  const trainedToday = (agg.workoutCount ?? 0) > 0;
  const historyDays = ctx.trailing.slice(-28);
  const everTrains = trainedToday || historyDays.some((d) => (d.workoutCount ?? 0) > 0);
  if (!everTrains) return unavailable();

  if (trainedToday) {
    const minutes = agg.workoutMinutes ?? 0;
    const score = 70 + 30 * clamp01(minutes / 45);
    return {
      score,
      available: true,
      inputs: { workoutMinutes: minutes, workoutCount: agg.workoutCount },
      reasons: [
        {
          code: 'trained_today',
          text: minutes > 0 ? `Entrenaste ${Math.round(minutes)} min` : 'Entrenaste hoy',
          impact: round1(score - 75),
        },
      ],
    };
  }

  // Descanso: ¿está dentro de la frecuencia semanal planificada?
  let daysSince = historyDays.length;
  for (let i = historyDays.length - 1; i >= 0; i--) {
    if ((historyDays[i]!.workoutCount ?? 0) > 0) {
      daysSince = historyDays.length - i;
      break;
    }
  }
  const allowedGap = Math.max(1, Math.floor(7 / ctx.goals.workoutsPerWeek));
  if (daysSince <= allowedGap) {
    return {
      score: 75,
      available: true,
      inputs: { daysSinceLastWorkout: daysSince, allowedGap },
      reasons: [{ code: 'rest_day', text: 'Día de descanso planificado', impact: 0 }],
    };
  }
  const score = Math.max(20, 75 - 12 * (daysSince - allowedGap));
  return {
    score,
    available: true,
    inputs: { daysSinceLastWorkout: daysSince, allowedGap },
    reasons: [
      {
        code: 'training_gap',
        text: `${daysSince} días sin entrenar`,
        impact: round1(score - 75),
      },
    ],
  };
}

function nutritionComponent(agg: DailyAggregate, ctx: ScoreContext): ComponentDraft {
  if (agg.kcal == null) return unavailable();
  const reasons: ScoreReason[] = [];

  // Adherencia calórica: banda ±10% = 100, lineal a 0 en ±40%
  const deviation = Math.abs(agg.kcal - ctx.goals.kcal) / ctx.goals.kcal;
  const energyScore = deviation <= 0.1 ? 100 : 100 * clamp01(1 - (deviation - 0.1) / 0.3);
  if (energyScore < 100) {
    reasons.push({
      code: agg.kcal > ctx.goals.kcal ? 'kcal_over' : 'kcal_under',
      text: `${Math.round(agg.kcal)} kcal (objetivo ${ctx.goals.kcal})`,
      impact: round1((energyScore - 100) / 3),
    });
  }

  const proteinScore = 100 * clamp01((agg.proteinG ?? 0) / ctx.goals.proteinG);
  if (proteinScore < 100) {
    reasons.push({
      code: 'protein_low',
      text: `Proteína ${Math.round(agg.proteinG ?? 0)} g de ${ctx.goals.proteinG} g`,
      impact: round1((proteinScore - 100) / 3),
    });
  }

  const fiberScore = 100 * clamp01((agg.fiberG ?? 0) / ctx.goals.fiberG);
  if (fiberScore < 100) {
    reasons.push({
      code: 'fiber_low',
      text: `Fibra ${Math.round(agg.fiberG ?? 0)} g de ${ctx.goals.fiberG} g`,
      impact: round1((fiberScore - 100) / 3),
    });
  }

  let score = (energyScore + proteinScore + fiberScore) / 3;

  // Penalidades acotadas por excesos (saturadas ~10% kcal, azúcar ~10% kcal)
  const satFatMax = (0.1 * ctx.goals.kcal) / 9;
  const satExcess = Math.max(0, (agg.saturatedFatG ?? 0) - satFatMax);
  if (satExcess > 0) {
    const penalty = Math.min(15, satExcess);
    score -= penalty;
    reasons.push({
      code: 'satfat_over',
      text: `Grasas saturadas ${Math.round(agg.saturatedFatG ?? 0)} g (tope ~${Math.round(satFatMax)} g)`,
      impact: -round1(penalty),
    });
  }
  const sugarMax = (0.1 * ctx.goals.kcal) / 4;
  const sugarExcess = Math.max(0, (agg.sugarG ?? 0) - sugarMax);
  if (sugarExcess > 0) {
    const penalty = Math.min(15, sugarExcess);
    score -= penalty;
    reasons.push({
      code: 'sugar_over',
      text: `Azúcar ${Math.round(agg.sugarG ?? 0)} g (tope ~${Math.round(sugarMax)} g)`,
      impact: -round1(penalty),
    });
  }

  return {
    score: Math.max(0, score),
    available: true,
    inputs: {
      kcal: agg.kcal,
      proteinG: agg.proteinG,
      fiberG: agg.fiberG,
      saturatedFatG: agg.saturatedFatG,
      sugarG: agg.sugarG,
    },
    reasons,
  };
}

function micronutrientsComponent(agg: DailyAggregate): ComponentDraft {
  if (agg.microCoveragePct == null) return unavailable();
  const score = Math.min(100, agg.microCoveragePct);
  return {
    score,
    available: true,
    inputs: { microCoveragePct: agg.microCoveragePct },
    reasons:
      score < 80
        ? [
            {
              code: 'micros_low',
              text: `Cobertura de micronutrientes ${Math.round(score)}%`,
              impact: round1(score - 100),
            },
          ]
        : [],
  };
}

function hydrationComponent(agg: DailyAggregate, ctx: ScoreContext): ComponentDraft {
  if (agg.waterMl == null) return unavailable();
  const score = 100 * clamp01(agg.waterMl / ctx.goals.waterMl);
  return {
    score,
    available: true,
    inputs: { waterMl: agg.waterMl, goal: ctx.goals.waterMl },
    reasons:
      score < 100
        ? [
            {
              code: 'water_low',
              text: `${agg.waterMl} ml de ${ctx.goals.waterMl} ml`,
              impact: round1(score - 100),
            },
          ]
        : [],
  };
}

function substancesComponent(agg: DailyAggregate, ctx: ScoreContext): ComponentDraft {
  // Disponible en cualquier día con actividad de registro: la ausencia de
  // entradas se interpreta como "no consumí nada" (día perfecto).
  if ((agg.loggedModules ?? 0) === 0) return unavailable();

  let score = 100;
  const reasons: ScoreReason[] = [];

  const caffeine = agg.caffeineMg ?? 0;
  if (caffeine > ctx.goals.caffeineMgMax) {
    const penalty = (caffeine - ctx.goals.caffeineMgMax) / 10;
    score -= penalty;
    reasons.push({
      code: 'caffeine_over',
      text: `Cafeína ${Math.round(caffeine)} mg (tope ${ctx.goals.caffeineMgMax} mg)`,
      impact: -round1(penalty),
    });
  }
  if (agg.lastCaffeineHour != null && agg.lastCaffeineHour > 16) {
    const penalty = 8 * (agg.lastCaffeineHour - 16);
    score -= penalty;
    const h = Math.floor(agg.lastCaffeineHour);
    const m = Math.round((agg.lastCaffeineHour - h) * 60);
    reasons.push({
      code: 'caffeine_late',
      text: `Última cafeína a las ${h}:${String(m).padStart(2, '0')}`,
      impact: -round1(penalty),
    });
  }
  const alcohol = agg.alcoholUnits ?? 0;
  if (alcohol > 0) {
    const penalty = 12 * alcohol;
    score -= penalty;
    reasons.push({
      code: 'alcohol',
      text: `${alcohol.toFixed(1).replace('.', ',')} unidades de alcohol`,
      impact: -round1(penalty),
    });
  }
  const cigarettes = agg.cigarettes ?? 0;
  if (cigarettes > 0) {
    const penalty = 8 * cigarettes;
    score -= penalty;
    reasons.push({ code: 'cigarettes', text: `${cigarettes} cigarrillos`, impact: -round1(penalty) });
  }
  const vape = agg.vapeSessions ?? 0;
  if (vape > 0) {
    const penalty = 4 * vape;
    score -= penalty;
    reasons.push({ code: 'vape', text: `${vape} sesiones de vapeo`, impact: -round1(penalty) });
  }

  return {
    score: Math.max(0, score),
    available: true,
    inputs: {
      caffeineMg: agg.caffeineMg,
      lastCaffeineHour: agg.lastCaffeineHour,
      alcoholUnits: agg.alcoholUnits,
      cigarettes: agg.cigarettes,
      vapeSessions: agg.vapeSessions,
    },
    reasons,
  };
}

function wellbeingComponent(agg: DailyAggregate): ComponentDraft {
  const dims = [agg.mood, agg.energy, agg.stress != null ? 6 - agg.stress : null].filter(
    (v): v is number => v != null,
  );
  if (dims.length === 0) return unavailable();

  const meanDim = dims.reduce((a, b) => a + b, 0) / dims.length;
  let score = ((meanDim - 1) / 4) * 100;
  const reasons: ScoreReason[] = [];

  if (agg.stress != null && agg.stress >= 4) {
    reasons.push({ code: 'stress_high', text: `Estrés ${agg.stress.toFixed(0)}/5`, impact: 0 });
  }
  if (agg.soreness != null && agg.soreness >= 4) {
    const penalty = 5 * (agg.soreness - 3);
    score -= penalty;
    reasons.push({
      code: 'soreness_high',
      text: `Dolor muscular ${agg.soreness.toFixed(0)}/5`,
      impact: -round1(penalty),
    });
  }

  return {
    score: Math.max(0, score),
    available: true,
    inputs: {
      mood: agg.mood,
      energy: agg.energy,
      stress: agg.stress,
      libido: agg.libido,
      soreness: agg.soreness,
    },
    reasons,
  };
}

function consistencyComponent(agg: DailyAggregate): ComponentDraft {
  const logged = agg.loggedModules ?? 0;
  if (logged === 0) return unavailable();
  const score = Math.min(100, (logged / 6) * 100);
  return {
    score,
    available: true,
    inputs: { loggedModules: logged },
    reasons:
      logged < 4
        ? [{ code: 'few_modules', text: `Registraste ${logged} de 6 módulos`, impact: round1(score - 100) }]
        : [],
  };
}

// ── Motor ────────────────────────────────────────────────────────

function computeDrafts(agg: DailyAggregate, ctx: ScoreContext): Record<ScoreComponentKey, ComponentDraft> {
  return {
    sleep: sleepComponent(agg, ctx),
    activity: activityComponent(agg, ctx),
    training: trainingComponent(agg, ctx),
    nutrition: nutritionComponent(agg, ctx),
    micronutrients: micronutrientsComponent(agg),
    hydration: hydrationComponent(agg, ctx),
    substances: substancesComponent(agg, ctx),
    wellbeing: wellbeingComponent(agg),
    consistency: consistencyComponent(agg),
  };
}

export function computeScore(agg: DailyAggregate, ctx: ScoreContext): ScoreBreakdown {
  const drafts = computeDrafts(agg, ctx);

  const availableKeys = (Object.keys(drafts) as ScoreComponentKey[]).filter(
    (k) => drafts[k].available,
  );
  const availableWeight = availableKeys.reduce((s, k) => s + COMPONENT_WEIGHTS[k], 0);
  const enough = availableWeight >= 0.45 && availableKeys.length >= 3;

  // Deltas vs promedio de la misma componente en la ventana previa (7 días),
  // recomputando cada día previo en modo shallow (sin su propio trailing).
  const trailingDrafts = ctx.trailing
    .slice(-7)
    .map((day) => computeDrafts(day, { goals: ctx.goals, trailing: [] }));

  const components: ScoreComponent[] = (Object.keys(drafts) as ScoreComponentKey[]).map((key) => {
    const draft = drafts[key];
    const weight = COMPONENT_WEIGHTS[key];
    const effectiveWeight = draft.available && enough ? weight / availableWeight : 0;
    const contribution = draft.available && draft.score != null ? draft.score * effectiveWeight : 0;

    let deltaVs7dAvg: number | null = null;
    if (draft.available && draft.score != null) {
      const past = trailingDrafts
        .map((d) => d[key])
        .filter((d) => d.available && d.score != null)
        .map((d) => d.score!);
      if (past.length >= 3) {
        deltaVs7dAvg = round1(draft.score - past.reduce((a, b) => a + b, 0) / past.length);
      }
    }

    return {
      key,
      score: draft.score != null ? round1(draft.score) : null,
      weight,
      effectiveWeight: round1(effectiveWeight * 1000) / 1000,
      available: draft.available,
      contribution: round1(contribution),
      deltaVs7dAvg,
      inputs: draft.inputs,
      reasons: draft.reasons,
    };
  });

  const score = enough
    ? Math.round(components.reduce((s, c) => s + c.contribution, 0))
    : null;

  return {
    date: agg.dayDate,
    score,
    algoVersion: ALGO_VERSION,
    availableWeight: round1(availableWeight * 100) / 100,
    components,
  };
}
