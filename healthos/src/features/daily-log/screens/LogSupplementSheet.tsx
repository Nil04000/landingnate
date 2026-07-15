import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import type { CompoundDefinition } from '@/core/db/repositories/compounds.repository';
import {
  Chip,
  ListRow,
  PressableScale,
  PrimaryButton,
  SheetScaffold,
  Stepper,
} from '@/core/design-system/components';
import { palette } from '@/core/design-system/tokens/palette';
import { todayLocal } from '@/core/lib/dates';
import { useCompoundDefinitionMutation, useLogMutation } from '@/queries/mutations';
import { repos } from '@/queries/repos';
import { useCompoundDefinitions, useDayEntries } from '@/queries/useDay';

const UNITS = ['mg', 'g', 'UI', 'cápsula', 'ml'] as const;

export default function LogSupplementSheet() {
  const params = useLocalSearchParams<{ date?: string }>();
  const dayDate = params.date ?? todayLocal();

  const { data: definitions } = useCompoundDefinitions();
  const { data: entries } = useDayEntries(dayDate);
  const intakeCount = entries?.intakes.length ?? 0;

  const [name, setName] = useState('');
  const [kind, setKind] = useState<'supplement' | 'medication'>('supplement');
  const [dose, setDose] = useState(1);
  const [unit, setUnit] = useState<(typeof UNITS)[number]>('mg');

  const intakeMutation = useLogMutation(
    (args: {
      dayDate: string;
      compoundId: string;
      doseAmount: number;
      doseUnit: string;
      skipped: number;
    }) => repos.compounds.logIntake({ ...args, takenAt: Date.now() }),
  );

  const definitionMutation = useCompoundDefinitionMutation(
    (args: {
      kind: 'supplement' | 'medication';
      name: string;
      defaultDoseAmount: number;
      defaultDoseUnit: string;
    }) => repos.compounds.createDefinition(args),
  );

  // Sin router.back(): el sheet queda abierto para marcar varias tomas seguidas.
  const logIntake = (definition: CompoundDefinition, skipped: 0 | 1) => {
    intakeMutation.mutate({
      dayDate,
      compoundId: definition.id,
      doseAmount: definition.defaultDoseAmount ?? 1,
      doseUnit: definition.defaultDoseUnit ?? 'u.',
      skipped,
    });
  };

  const addDefinition = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    definitionMutation.mutate(
      { kind, name: trimmed, defaultDoseAmount: dose, defaultDoseUnit: unit },
      { onSuccess: () => setName('') },
    );
  };

  return (
    <SheetScaffold
      title="Suplementos"
      subtitle={`Hoy: ${intakeCount} ${intakeCount === 1 ? 'toma registrada' : 'tomas registradas'}`}
    >
      {(definitions ?? []).map((definition) => (
        <ListRow
          key={definition.id}
          title={definition.name}
          subtitle={`${definition.defaultDoseAmount ?? 1} ${definition.defaultDoseUnit ?? 'u.'}`}
          trailing={
            <View className="flex-row gap-2">
              <PressableScale onPress={() => logIntake(definition, 0)}>
                <Text className="overflow-hidden rounded-chip bg-tint/15 px-3 py-1.5 text-footnote text-tint">
                  Tomé
                </Text>
              </PressableScale>
              <PressableScale onPress={() => logIntake(definition, 1)}>
                <Text className="overflow-hidden rounded-chip bg-surface-2 px-3 py-1.5 text-footnote text-txt-faint">
                  Omití
                </Text>
              </PressableScale>
            </View>
          }
        />
      ))}

      {definitions != null && definitions.length === 0 ? (
        <Text className="py-4 text-center text-footnote text-txt-faint">
          Todavía no agregaste nada. Creá tu primer suplemento acá abajo.
        </Text>
      ) : null}

      <View className="mt-6 border-t border-stroke pt-5">
        <Text className="mb-3 text-headline text-txt">Nuevo suplemento/medicación</Text>

        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Nombre (ej. Creatina)"
          placeholderTextColor={palette.text.tertiary}
          className="rounded-row bg-surface-2 px-4 py-3 text-body text-txt"
        />

        <View className="mt-3 flex-row gap-2">
          <Chip
            label="Suplemento"
            selected={kind === 'supplement'}
            onPress={() => setKind('supplement')}
          />
          <Chip
            label="Medicación"
            selected={kind === 'medication'}
            onPress={() => setKind('medication')}
          />
        </View>

        <View className="mt-4">
          <Stepper value={dose} onChange={setDose} min={1} max={10} display={`${dose} ${unit}`} />
        </View>

        <View className="mt-3 flex-row flex-wrap gap-2">
          {UNITS.map((u) => (
            <Chip key={u} label={u} selected={unit === u} onPress={() => setUnit(u)} />
          ))}
        </View>

        <View className="mt-4">
          <PrimaryButton label="Agregar" onPress={addDefinition} disabled={name.trim() === ''} />
        </View>
      </View>
    </SheetScaffold>
  );
}
