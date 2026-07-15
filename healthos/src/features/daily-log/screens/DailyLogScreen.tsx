import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { router } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { DateStrip, PressableScale, Screen, Section } from '@/core/design-system/components';
import { haptic } from '@/core/design-system/haptics';
import { fromLocalDate, todayLocal } from '@/core/lib/dates';
import { useUiStore } from '@/core/state/ui.store';

import { DayTimeline } from '../components/DayTimeline';

/** Tab Registro: DateStrip para back-logging + timeline del día seleccionado. */
export default function DailyLogScreen() {
  const selectedDate = useUiStore((s) => s.selectedDate);
  const setSelectedDate = useUiStore((s) => s.setSelectedDate);

  const isToday = selectedDate === todayLocal();
  const heading = isToday
    ? 'Hoy'
    : format(fromLocalDate(selectedDate), "EEEE d 'de' MMMM", { locale: es });

  return (
    <Screen className="px-0">
      <View className="mb-2 mt-2 flex-row items-center justify-between px-5">
        <Text className="text-title1 capitalize text-txt">{heading}</Text>
        <PressableScale
          onPress={() => {
            haptic.select();
            router.push({ pathname: '/quick-add', params: { date: selectedDate } });
          }}
        >
          <View className="h-9 w-9 items-center justify-center rounded-full bg-surface-2">
            <Plus color="#F5F5F7" size={20} strokeWidth={2} />
          </View>
        </PressableScale>
      </View>

      <View className="mb-4">
        <DateStrip selected={selectedDate} onChange={setSelectedDate} />
      </View>

      <View className="px-5">
        <Section title="Registrado">
          <DayTimeline date={selectedDate} />
        </Section>
      </View>
    </Screen>
  );
}
