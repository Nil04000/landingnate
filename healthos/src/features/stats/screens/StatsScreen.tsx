import { router } from 'expo-router';
import { ChartLine, ChevronRight, FlaskConical } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { Card, ListRow, Screen, Section } from '@/core/design-system/components';
import { palette } from '@/core/design-system/tokens/palette';

/**
 * Hub de Estadísticas. Fase 5: acceso a Laboratorios.
 * Fase 6 suma métricas con sparklines, detalle D/S/M/A, récords y rachas.
 */
export default function StatsScreen() {
  return (
    <Screen>
      <View className="mb-6 mt-2">
        <Text className="text-title1 text-txt">Estadísticas</Text>
      </View>

      <Section title="Salud">
        <Card flush className="px-4">
          <ListRow
            title="Laboratorios"
            subtitle="Análisis de sangre: historial, rangos y tendencias"
            leading={
              <View className="h-9 w-9 items-center justify-center rounded-full bg-surface-2">
                <FlaskConical color={palette.metric.labs} size={16} strokeWidth={1.8} />
              </View>
            }
            trailing={<ChevronRight color={palette.text.tertiary} size={18} strokeWidth={2} />}
            onPress={() => router.push('/labs')}
          />
        </Card>
      </Section>

      <Section title="Métricas">
        <Card>
          <View className="items-center gap-2 py-6">
            <ChartLine color={palette.text.tertiary} size={28} strokeWidth={1.5} />
            <Text className="text-center text-subhead text-txt-dim">
              Tendencias, promedios, récords y rachas llegan en la Fase 6.
            </Text>
          </View>
        </Card>
      </Section>
    </Screen>
  );
}
