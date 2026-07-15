import { Sparkles } from 'lucide-react-native';

import { EmptyState, Screen } from '@/core/design-system/components';
import { palette } from '@/core/design-system/tokens/palette';

export default function AssistantScreen() {
  return (
    <Screen scroll={false} className="justify-center">
      <EmptyState
        icon={<Sparkles color={palette.text.tertiary} size={32} strokeWidth={1.5} />}
        title="Asistente"
        subtitle="Preguntas sobre tus datos, respondidas 100% en tu dispositivo — llega en la Fase 9."
      />
    </Screen>
  );
}
