import { ChartLine } from 'lucide-react-native';

import { EmptyState, Screen } from '@/core/design-system/components';
import { palette } from '@/core/design-system/tokens/palette';

export default function StatsScreen() {
  return (
    <Screen scroll={false} className="justify-center">
      <EmptyState
        icon={<ChartLine color={palette.text.tertiary} size={32} strokeWidth={1.5} />}
        title="Estadísticas"
        subtitle="Tendencias, promedios, récords y rachas — llega en la Fase 6."
      />
    </Screen>
  );
}
