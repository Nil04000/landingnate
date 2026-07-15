import {
  Beer,
  Cigarette,
  Coffee,
  Droplets,
  Dumbbell,
  Footprints,
  Moon,
  NotebookPen,
  Pill,
  Scale,
  Smile,
} from 'lucide-react-native';
import { useMemo } from 'react';
import { Text, View } from 'react-native';

import { Card, EmptyState, ListRow } from '@/core/design-system/components';
import { palette } from '@/core/design-system/tokens/palette';
import { formatDecimal, formatInt, formatMinutes, formatTime } from '@/core/lib/format';
import { useCompoundDefinitions, useDayEntries } from '@/queries/useDay';

type TimelineItem = {
  id: string;
  at: number;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
};

const ICON = { size: 16, strokeWidth: 1.8 } as const;

function iconBubble(node: React.ReactNode) {
  return <View className="h-9 w-9 items-center justify-center rounded-full bg-surface-2">{node}</View>;
}

/**
 * Timeline cronológico de TODO lo registrado en un día.
 * Compartido por el tab Registro y la pantalla day/[date].
 */
export function DayTimeline({ date }: { date: string }) {
  const { data: entries } = useDayEntries(date);
  const { data: definitions } = useCompoundDefinitions();

  const items = useMemo<TimelineItem[]>(() => {
    if (!entries) return [];
    const defsById = new Map((definitions ?? []).map((d) => [d.id, d]));
    const out: TimelineItem[] = [];

    for (const s of entries.sleep) {
      out.push({
        id: s.id,
        at: s.endAt,
        icon: iconBubble(<Moon color={palette.metric.sleep} {...ICON} />),
        title: s.isNap ? 'Siesta' : 'Sueño',
        subtitle: `${formatTime(s.startAt)} – ${formatTime(s.endAt)} · ${formatMinutes((s.endAt - s.startAt) / 60_000)}${s.qualityRating ? ` · calidad ${s.qualityRating}/5` : ''}`,
      });
    }
    for (const h of entries.hydration) {
      out.push({
        id: h.id,
        at: h.loggedAt,
        icon: iconBubble(<Droplets color={palette.metric.hydration} {...ICON} />),
        title: `+${formatInt(h.amountMl)} ml`,
        subtitle: formatTime(h.loggedAt),
      });
    }
    for (const s of entries.substances) {
      const isSmoke = s.type === 'cigarette' || s.type === 'vape';
      const isAlcohol = s.type === 'alcohol';
      const icon = isAlcohol ? (
        <Beer color={palette.metric.training} {...ICON} />
      ) : isSmoke ? (
        <Cigarette color={palette.text.secondary} {...ICON} />
      ) : (
        <Coffee color={palette.metric.caffeine} {...ICON} />
      );
      const detail = [
        s.caffeineMg ? `${formatInt(s.caffeineMg)} mg cafeína` : null,
        s.alcoholGrams ? `${formatDecimal(s.alcoholGrams / 10, 1)} unidades` : null,
        isSmoke ? `x${s.quantity}` : null,
      ]
        .filter(Boolean)
        .join(' · ');
      out.push({
        id: s.id,
        at: s.consumedAt,
        icon: iconBubble(icon),
        title: s.label ?? SUBSTANCE_LABELS[s.type] ?? s.type,
        subtitle: `${formatTime(s.consumedAt)}${detail ? ` · ${detail}` : ''}`,
      });
    }
    for (const b of entries.body) {
      const parts = [
        b.weightKg != null ? `${formatDecimal(b.weightKg, 1)} kg` : null,
        b.bodyFatPct != null ? `${formatDecimal(b.bodyFatPct, 1)}% grasa` : null,
      ].filter(Boolean);
      out.push({
        id: b.id,
        at: b.measuredAt,
        icon: iconBubble(<Scale color={palette.metric.score} {...ICON} />),
        title: parts.join(' · ') || 'Medición corporal',
        subtitle: formatTime(b.measuredAt),
      });
    }
    for (const w of entries.wellbeing) {
      const parts = [
        w.mood != null ? `Ánimo ${w.mood}` : null,
        w.energy != null ? `Energía ${w.energy}` : null,
        w.stress != null ? `Estrés ${w.stress}` : null,
        w.libido != null ? `Libido ${w.libido}` : null,
        w.soreness != null ? `Dolor ${w.soreness}` : null,
      ].filter(Boolean);
      out.push({
        id: w.id,
        at: w.loggedAt,
        icon: iconBubble(<Smile color={palette.metric.mood} {...ICON} />),
        title: 'Check-in',
        subtitle: `${formatTime(w.loggedAt)} · ${parts.join(' · ')}`,
      });
    }
    for (const i of entries.intakes) {
      const def = defsById.get(i.compoundId);
      out.push({
        id: i.id,
        at: i.takenAt,
        icon: iconBubble(<Pill color={palette.metric.labs} {...ICON} />),
        title: def?.name ?? 'Suplemento',
        subtitle: i.skipped
          ? `${formatTime(i.takenAt)} · omitido`
          : `${formatTime(i.takenAt)} · ${formatDecimal(i.doseAmount, i.doseAmount % 1 ? 1 : 0)} ${i.doseUnit}`,
      });
    }
    for (const w of entries.workouts) {
      out.push({
        id: w.id,
        at: w.startedAt,
        icon: iconBubble(<Dumbbell color={palette.metric.training} {...ICON} />),
        title: w.title ?? WORKOUT_LABELS[w.type] ?? 'Entrenamiento',
        subtitle: w.endedAt
          ? `${formatTime(w.startedAt)} · ${formatMinutes((w.endedAt - w.startedAt) / 60_000)}`
          : `${formatTime(w.startedAt)} · en curso`,
      });
    }
    if (entries.activity?.steps != null) {
      out.push({
        id: entries.activity.id,
        at: entries.activity.updatedAt,
        icon: iconBubble(<Footprints color={palette.metric.activity} {...ICON} />),
        title: `${formatInt(entries.activity.steps)} pasos`,
        subtitle: 'Actividad del día',
      });
    }

    return out.sort((a, b) => b.at - a.at);
  }, [entries, definitions]);

  if (!entries) return null;

  return (
    <View>
      {items.length === 0 ? (
        <EmptyState
          title="Nada registrado este día"
          subtitle="Tocá el botón + para anotar tu primer dato."
        />
      ) : (
        <Card flush className="px-4">
          {items.map((item, idx) => (
            <View key={item.id} className={idx > 0 ? 'border-t border-separator/50' : ''}>
              <ListRow title={item.title} subtitle={item.subtitle} leading={item.icon} />
            </View>
          ))}
        </Card>
      )}

      {entries.note ? (
        <Card className="mt-3">
          <View className="mb-1.5 flex-row items-center gap-1.5">
            <NotebookPen color={palette.text.tertiary} size={13} strokeWidth={2} />
            <Text className="text-caption uppercase text-txt-faint">Nota del día</Text>
          </View>
          <Text className="text-subhead leading-5 text-txt-dim">{entries.note.content}</Text>
        </Card>
      ) : null}
    </View>
  );
}

const SUBSTANCE_LABELS: Record<string, string> = {
  coffee: 'Café',
  espresso: 'Espresso',
  energy_drink: 'Bebida energética',
  preworkout: 'Pre-entreno',
  alcohol: 'Alcohol',
  cigarette: 'Cigarrillo',
  vape: 'Vapeo',
  other: 'Otro',
};

const WORKOUT_LABELS: Record<string, string> = {
  strength: 'Fuerza',
  cardio: 'Cardio',
  mobility: 'Movilidad',
  sport: 'Deporte',
};
