import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useMemo, useRef } from 'react';
import { FlatList, Text, View } from 'react-native';

import { cn } from '../cn';
import { haptic } from '../haptics';
import { daysAgoLocal, fromLocalDate, todayLocal } from '@/core/lib/dates';

import { PressableScale } from './PressableScale';

type DateStripProps = {
  selected: string;
  onChange: (day: string) => void;
  /** Cuántos días hacia atrás mostrar (incluye hoy) */
  daysBack?: number | undefined;
};

const ITEM_WIDTH = 56;

/** Selector horizontal de día para back-logging (últimos N días, hoy al final). */
export function DateStrip({ selected, onChange, daysBack = 21 }: DateStripProps) {
  const listRef = useRef<FlatList<string>>(null);

  const days = useMemo(
    () =>
      Array.from({ length: daysBack }, (_, i) => daysAgoLocal(daysBack - 1 - i)),
    [daysBack],
  );

  const today = todayLocal();

  return (
    <FlatList
      ref={listRef}
      horizontal
      data={days}
      keyExtractor={(d) => d}
      showsHorizontalScrollIndicator={false}
      initialScrollIndex={days.length - 1}
      getItemLayout={(_, index) => ({ length: ITEM_WIDTH, offset: ITEM_WIDTH * index, index })}
      contentContainerClassName="px-4"
      renderItem={({ item }) => {
        const date = fromLocalDate(item);
        const isSelected = item === selected;
        const isToday = item === today;
        return (
          <PressableScale
            onPress={() => {
              haptic.select();
              onChange(item);
            }}
            style={{ width: ITEM_WIDTH }}
            className="items-center py-1"
          >
            <View
              className={cn(
                'w-12 items-center rounded-row border py-2',
                isSelected ? 'border-tint/40 bg-tint/15' : 'border-transparent',
              )}
            >
              <Text className={cn('text-caption uppercase', isSelected ? 'text-tint' : 'text-txt-faint')}>
                {format(date, 'EEE', { locale: es }).replace('.', '')}
              </Text>
              <Text
                className={cn('mt-0.5 text-headline', isSelected ? 'text-tint' : 'text-txt')}
                style={{ fontVariant: ['tabular-nums'] }}
              >
                {format(date, 'd')}
              </Text>
              {isToday ? (
                <View className={cn('mt-0.5 h-1 w-1 rounded-full', isSelected ? 'bg-tint' : 'bg-txt-faint')} />
              ) : null}
            </View>
          </PressableScale>
        );
      }}
    />
  );
}
