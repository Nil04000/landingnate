import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { addDaysLocal, eachDayLocal, fromLocalDate, todayLocal, weekStartOf } from '@/core/lib/dates';
import { scoreColor, scoreRamp } from '../tokens/palette';
import { haptic } from '../haptics';
import { PressableScale } from './PressableScale';

const CELL = 15;
const GAP = 3;

type HeatmapCalendarProps = {
  /** Map dayDate → score (ausente o null = sin datos) */
  scores: Record<string, number | null>;
  /** Cuántas semanas hacia atrás (default ~6 meses) */
  weeks?: number | undefined;
  onDayPress?: ((day: string) => void) | undefined;
};

/**
 * Heatmap estilo GitHub: columnas = semanas (lunes arriba), color = rampa
 * del Health Score. Tap en un día → resumen completo.
 */
export function HeatmapCalendar({ scores, weeks = 26, onDayPress }: HeatmapCalendarProps) {
  const today = todayLocal();

  const columns = useMemo(() => {
    const currentWeekStart = weekStartOf(today);
    const firstWeekStart = addDaysLocal(currentWeekStart, -7 * (weeks - 1));
    const out: { weekStart: string; days: string[] }[] = [];
    for (let w = 0; w < weeks; w++) {
      const weekStart = addDaysLocal(firstWeekStart, w * 7);
      out.push({ weekStart, days: eachDayLocal(weekStart, addDaysLocal(weekStart, 6)) });
    }
    return out;
  }, [today, weeks]);

  // Etiqueta de mes cuando cambia entre columnas
  const monthLabels = useMemo(() => {
    let prev = '';
    return columns.map(({ weekStart }) => {
      const label = format(fromLocalDate(weekStart), 'MMM', { locale: es });
      if (label !== prev) {
        prev = label;
        return label;
      }
      return '';
    });
  }, [columns]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ flexDirection: 'column', paddingHorizontal: 4 }}
      // arranca mostrando el presente
      contentOffset={{ x: weeks * (CELL + GAP), y: 0 }}
    >
      <View className="mb-1 flex-row" style={{ gap: GAP }}>
        {monthLabels.map((label, i) => (
          <Text
            key={`${columns[i]!.weekStart}-label`}
            className="text-caption capitalize text-txt-faint"
            style={{ width: CELL }}
            numberOfLines={1}
          >
            {label}
          </Text>
        ))}
      </View>
      <View className="flex-row" style={{ gap: GAP }}>
        {columns.map(({ weekStart, days }) => (
          <View key={weekStart} style={{ gap: GAP }}>
            {days.map((day) => {
              const future = day > today;
              const score = scores[day] ?? null;
              const color = future ? 'transparent' : score == null ? scoreRamp.none : scoreColor(score);
              const cell = (
                <View
                  style={{
                    width: CELL,
                    height: CELL,
                    borderRadius: 4,
                    backgroundColor: color,
                    borderWidth: day === today ? 1.5 : 0,
                    borderColor: '#F5F5F7',
                  }}
                />
              );
              if (future || !onDayPress) return <View key={day}>{cell}</View>;
              return (
                <PressableScale
                  key={day}
                  onPress={() => {
                    haptic.select();
                    onDayPress(day);
                  }}
                >
                  {cell}
                </PressableScale>
              );
            })}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
