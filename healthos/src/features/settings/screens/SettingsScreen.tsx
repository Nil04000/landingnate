import { router } from 'expo-router';
import { ChevronLeft, ChevronRight, Database, UserRound } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { brand } from '@/core/brand';
import { Card, ListRow, PressableScale, Screen, Section } from '@/core/design-system/components';
import { palette } from '@/core/design-system/tokens/palette';

export default function SettingsScreen() {
  const chevron = <ChevronRight color={palette.text.tertiary} size={18} strokeWidth={2} />;
  return (
    <Screen>
      <View className="mb-5 mt-1 flex-row items-center gap-2">
        <PressableScale onPress={() => router.back()}>
          <View className="h-9 w-9 items-center justify-center rounded-full bg-surface-2">
            <ChevronLeft color="#F5F5F7" size={20} strokeWidth={2} />
          </View>
        </PressableScale>
        <Text className="text-title2 text-txt">Configuración</Text>
      </View>

      <Section title="General">
        <Card flush className="px-4">
          <ListRow
            title="Perfil"
            subtitle="Sexo, altura, nacimiento — ajusta los rangos de laboratorio"
            leading={
              <View className="h-9 w-9 items-center justify-center rounded-full bg-surface-2">
                <UserRound color={palette.tint} size={16} strokeWidth={1.8} />
              </View>
            }
            trailing={chevron}
            onPress={() => router.push('/settings/profile')}
          />
          <View className="border-t border-separator/50">
            <ListRow
              title="Datos"
              subtitle="Exportar todo en JSON, reconstruir agregados"
              leading={
                <View className="h-9 w-9 items-center justify-center rounded-full bg-surface-2">
                  <Database color={palette.metric.labs} size={16} strokeWidth={1.8} />
                </View>
              }
              trailing={chevron}
              onPress={() => router.push('/settings/data')}
            />
          </View>
        </Card>
      </Section>

      <Text className="px-1 text-center text-footnote text-txt-faint">
        {brand.name} · local-first · tus datos nunca salen del dispositivo
      </Text>
    </Screen>
  );
}
