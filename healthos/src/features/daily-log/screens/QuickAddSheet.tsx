import { router, useLocalSearchParams, type Href } from 'expo-router';
import {
  Beer,
  Coffee,
  Droplets,
  Dumbbell,
  Footprints,
  HeartPulse,
  Moon,
  NotebookPen,
  Pill,
  Scale,
  Smile,
  Utensils,
} from 'lucide-react-native';
import { Text, View } from 'react-native';

import { PressableScale, SheetScaffold } from '@/core/design-system/components';
import { haptic } from '@/core/design-system/haptics';
import { palette } from '@/core/design-system/tokens/palette';
import { todayLocal } from '@/core/lib/dates';
import { repos } from '@/queries/repos';
import { useWorkoutMutation } from '@/queries/useWorkouts';

type QuickAction = {
  key: string;
  label: string;
  icon: React.ReactNode;
  path: string;
};

const ICON = { size: 22, strokeWidth: 1.8 } as const;

const ACTIONS: QuickAction[] = [
  { key: 'meal', label: 'Comida', path: '/nutrition', icon: <Utensils color={palette.metric.nutrition} {...ICON} /> },
  { key: 'water', label: 'Agua', path: '/log-water', icon: <Droplets color={palette.metric.hydration} {...ICON} /> },
  { key: 'weight', label: 'Peso', path: '/log-weight', icon: <Scale color={palette.metric.score} {...ICON} /> },
  { key: 'sleep', label: 'Sueño', path: '/log-sleep', icon: <Moon color={palette.metric.sleep} {...ICON} /> },
  { key: 'caffeine', label: 'Cafeína', path: '/log-caffeine', icon: <Coffee color={palette.metric.caffeine} {...ICON} /> },
  { key: 'substance', label: 'Sustancias', path: '/log-substance', icon: <Beer color={palette.metric.training} {...ICON} /> },
  { key: 'wellbeing', label: 'Ánimo', path: '/log-wellbeing', icon: <Smile color={palette.metric.mood} {...ICON} /> },
  { key: 'supplement', label: 'Suplementos', path: '/log-supplement', icon: <Pill color={palette.metric.labs} {...ICON} /> },
  { key: 'steps', label: 'Pasos', path: '/log-steps', icon: <Footprints color={palette.metric.activity} {...ICON} /> },
  { key: 'note', label: 'Nota', path: '/log-note', icon: <NotebookPen color={palette.text.secondary} {...ICON} /> },
  { key: 'cardio', label: 'Cardio', path: '/log-cardio', icon: <HeartPulse color={palette.metric.mood} {...ICON} /> },
  { key: 'workout', label: 'Entreno', path: '', icon: <Dumbbell color={palette.metric.training} {...ICON} /> },
];

/** Hub del "+": grilla de accesos a todos los registros rápidos. */
export default function QuickAddSheet() {
  const params = useLocalSearchParams<{ date?: string }>();
  const date = params.date ?? todayLocal();

  const startWorkout = useWorkoutMutation(
    (args: { dayDate: string }) =>
      repos.workouts.create({ dayDate: args.dayDate, type: 'strength', startedAt: Date.now() }),
    { silent: true },
  );

  const onAction = (action: QuickAction) => {
    haptic.select();
    if (action.key === 'workout') {
      startWorkout.mutate(
        { dayDate: date },
        {
          onSuccess: ({ result }) => {
            const workout = result as { id: string };
            router.replace({ pathname: '/workout/active', params: { id: workout.id } } as Href);
          },
        },
      );
      return;
    }
    router.replace({ pathname: action.path, params: { date } } as Href);
  };

  return (
    <SheetScaffold title="Registrar" subtitle="¿Qué querés anotar?">
      <View className="flex-row flex-wrap justify-between">
        {ACTIONS.map((action) => (
          <PressableScale key={action.key} onPress={() => onAction(action)} className="mb-3 w-[31%]">
            <View className="items-center gap-2 rounded-card border border-stroke bg-surface-2 py-4">
              {action.icon}
              <Text className="text-footnote text-txt-dim">{action.label}</Text>
            </View>
          </PressableScale>
        ))}
      </View>
    </SheetScaffold>
  );
}
