import { Utensils } from 'lucide-react-native';

import { EmptyState, Screen } from '@/core/design-system/components';
import { palette } from '@/core/design-system/tokens/palette';

export default function NutritionScreen() {
  return (
    <Screen scroll={false} className="justify-center">
      <EmptyState
        icon={<Utensils color={palette.text.tertiary} size={32} strokeWidth={1.5} />}
        title="Nutrición"
        subtitle="Comidas con macros y micronutrientes completos — llega en la Fase 3."
      />
    </Screen>
  );
}
