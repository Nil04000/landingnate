import { NotebookPen } from 'lucide-react-native';

import { EmptyState, Screen } from '@/core/design-system/components';
import { palette } from '@/core/design-system/tokens/palette';

export default function DailyLogScreen() {
  return (
    <Screen scroll={false} className="justify-center">
      <EmptyState
        icon={<NotebookPen color={palette.text.tertiary} size={32} strokeWidth={1.5} />}
        title="Registro diario"
        subtitle="Peso, sueño, agua, cafeína, suplementos y más — llega en la Fase 2."
      />
    </Screen>
  );
}
