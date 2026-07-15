import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import {
  Card,
  Chip,
  PressableScale,
  PrimaryButton,
  Screen,
  Section,
  Stepper,
} from '@/core/design-system/components';
import { haptic } from '@/core/design-system/haptics';
import { palette } from '@/core/design-system/tokens/palette';
import { repos } from '@/queries/repos';

/**
 * Perfil (fila única). El sexo ajusta qué rango de referencia usan los
 * laboratorios (testosterona, ferritina, hemoglobina...).
 */
export default function ProfileScreen() {
  const queryClient = useQueryClient();
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => repos.settings.getProfile() ?? null,
  });

  const [sex, setSex] = useState<'male' | 'female' | null | undefined>(undefined);
  const [heightCm, setHeightCm] = useState<number | undefined>(undefined);
  const [birthDate, setBirthDate] = useState<string | undefined>(undefined);

  const currentSex = sex !== undefined ? sex : (profile?.sex as 'male' | 'female' | null) ?? null;
  const currentHeight = heightCm ?? profile?.heightCm ?? 175;
  const currentBirth = birthDate ?? profile?.birthDate ?? '';

  const validBirth = currentBirth === '' || /^\d{4}-\d{2}-\d{2}$/.test(currentBirth);

  const save = () => {
    repos.settings.upsertProfile({
      sex: currentSex,
      heightCm: currentHeight,
      birthDate: currentBirth || null,
    });
    haptic.logged();
    void queryClient.invalidateQueries({ queryKey: ['profile'] });
    // los rangos de labs dependen del sexo
    void queryClient.invalidateQueries({ queryKey: ['labsIndex'] });
    void queryClient.invalidateQueries({ queryKey: ['markerDetail'] });
    router.back();
  };

  return (
    <Screen>
      <View className="mb-5 mt-1 flex-row items-center gap-2">
        <PressableScale onPress={() => router.back()}>
          <View className="h-9 w-9 items-center justify-center rounded-full bg-surface-2">
            <ChevronLeft color="#F5F5F7" size={20} strokeWidth={2} />
          </View>
        </PressableScale>
        <Text className="text-title2 text-txt">Perfil</Text>
      </View>

      <Section title="Sexo (para rangos de laboratorio)">
        <View className="flex-row gap-2">
          <Chip label="Masculino" selected={currentSex === 'male'} onPress={() => setSex('male')} />
          <Chip label="Femenino" selected={currentSex === 'female'} onPress={() => setSex('female')} />
          <Chip label="No especificar" selected={currentSex === null} onPress={() => setSex(null)} />
        </View>
      </Section>

      <Section title="Altura">
        <Card>
          <Stepper
            value={currentHeight}
            onChange={setHeightCm}
            step={1}
            min={120}
            max={230}
            display={`${currentHeight} cm`}
          />
        </Card>
      </Section>

      <Section title="Fecha de nacimiento">
        <TextInput
          value={currentBirth}
          onChangeText={setBirthDate}
          placeholder="AAAA-MM-DD (ej. 1995-08-14)"
          placeholderTextColor={palette.text.tertiary}
          keyboardType="numbers-and-punctuation"
          className="rounded-row bg-surface-2 px-4 py-3 text-body text-txt"
        />
        {!validBirth ? (
          <Text className="mt-1.5 text-footnote text-danger">Formato: AAAA-MM-DD</Text>
        ) : null}
      </Section>

      <PrimaryButton label="Guardar" onPress={save} disabled={!validBirth} />
    </Screen>
  );
}
