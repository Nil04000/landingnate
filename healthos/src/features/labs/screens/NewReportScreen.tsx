import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { router } from 'expo-router';
import { X } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { LabMarker } from '@/core/db/repositories/labs.repository';
import { Chip, PressableScale, PrimaryButton } from '@/core/design-system/components';
import { palette } from '@/core/design-system/tokens/palette';
import { repos } from '@/queries/repos';
import { useLabCatalog, useLabMutation } from '@/queries/useLabs';

import { parseDecimal } from '../components/format';

const DAY_MS = 86_400_000;

const DATE_PRESETS = [
  { label: 'Hoy', days: 0 },
  { label: '−7 días', days: 7 },
  { label: '−30 días', days: 30 },
  { label: '−90 días', days: 90 },
] as const;

type SaveArgs = {
  collectedAt: number;
  labName?: string;
  fasting?: number;
  entries: { markerId: string; value: number }[];
};

type CustomMarkerArgs = {
  name: string;
  unit: string;
  low?: number;
  high?: number;
};

/**
 * Carga de un análisis (/labs/new-report, modal): fecha por chips, laboratorio,
 * ayunas y un input decimal por marcador del catálogo. Solo se guardan los
 * marcadores con valor; el write devuelve los LabResult para el haptic.warn.
 */
export default function NewReportScreen() {
  const insets = useSafeAreaInsets();
  const { data: catalog } = useLabCatalog();

  const [baseNow] = useState(() => Date.now());
  const [offsetDays, setOffsetDays] = useState(0);
  const [labName, setLabName] = useState('');
  const [fasting, setFasting] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  /** Custom creados en esta sesión (panelId null → no aparecen en el catálogo). */
  const [customMarkers, setCustomMarkers] = useState<LabMarker[]>([]);

  const [customName, setCustomName] = useState('');
  const [customUnit, setCustomUnit] = useState('');
  const [customLow, setCustomLow] = useState('');
  const [customHigh, setCustomHigh] = useState('');

  const saveReport = useLabMutation((args: SaveArgs) => {
    const input: { collectedAt: number; labName?: string; fasting?: number } = {
      collectedAt: args.collectedAt,
    };
    if (args.labName != null) input.labName = args.labName;
    if (args.fasting != null) input.fasting = args.fasting;
    const report = repos.labs.createReport(input);
    return args.entries.map((entry) => repos.labs.addResult(report.id, entry.markerId, entry.value));
  });

  const createMarker = useLabMutation((args: CustomMarkerArgs) =>
    repos.labs.createCustomMarker(args),
  );

  const collectedAt = baseNow - offsetDays * DAY_MS;

  const catalogMarkers = catalog?.flatMap((group) => group.markers) ?? [];
  const allMarkers = [...catalogMarkers, ...customMarkers];
  const entries = allMarkers
    .map((marker) => ({ markerId: marker.id, value: parseDecimal(values[marker.id] ?? '') }))
    .filter((entry): entry is { markerId: string; value: number } => entry.value != null);

  const canSave = entries.length > 0 && !saveReport.isPending;
  const canAddCustom = customName.trim() !== '' && customUnit.trim() !== '' && !createMarker.isPending;

  const setValue = (markerId: string, raw: string) =>
    setValues((prev) => ({ ...prev, [markerId]: raw }));

  const save = () => {
    if (!canSave) return;
    const args: SaveArgs = { collectedAt, entries };
    const trimmedLab = labName.trim();
    if (trimmedLab) args.labName = trimmedLab;
    if (fasting) args.fasting = 1;
    saveReport.mutate(args, { onSuccess: () => router.back() });
  };

  const addCustomMarker = () => {
    if (!canAddCustom) return;
    const args: CustomMarkerArgs = { name: customName.trim(), unit: customUnit.trim() };
    const low = parseDecimal(customLow);
    const high = parseDecimal(customHigh);
    if (low != null) args.low = low;
    if (high != null) args.high = high;
    createMarker.mutate(args, {
      onSuccess: (data) => {
        setCustomMarkers((prev) => [...prev, data.result as LabMarker]);
        setCustomName('');
        setCustomUnit('');
        setCustomLow('');
        setCustomHigh('');
      },
    });
  };

  return (
    <View className="flex-1 bg-canvas">
      <ScrollView
        contentContainerClassName="px-5 pb-6"
        contentContainerStyle={{ paddingTop: insets.top + 16 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center justify-between gap-3">
          <Text className="flex-1 text-title2 text-txt">Nuevo análisis</Text>
          <PressableScale onPress={() => router.back()} hitSlop={8}>
            <View className="h-9 w-9 items-center justify-center rounded-full bg-surface-2">
              <X color={palette.text.primary} size={20} strokeWidth={2} />
            </View>
          </PressableScale>
        </View>

        <Text className="mb-2 mt-5 text-caption uppercase text-txt-faint">Fecha</Text>
        <Text className="mb-3 text-body capitalize text-txt">
          {format(new Date(collectedAt), "EEEE d 'de' MMMM", { locale: es })}
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {DATE_PRESETS.map((preset) => (
            <Chip
              key={preset.days}
              label={preset.label}
              selected={offsetDays === preset.days}
              onPress={() => setOffsetDays(preset.days)}
            />
          ))}
        </View>

        <TextInput
          value={labName}
          onChangeText={setLabName}
          placeholder="Laboratorio (opcional)"
          placeholderTextColor={palette.text.tertiary}
          className="mt-5 rounded-row bg-surface-2 px-4 py-3 text-body text-txt"
        />

        <View className="mt-3 flex-row">
          <Chip label="Ayunas" selected={fasting} onPress={() => setFasting((prev) => !prev)} />
        </View>

        {(catalog ?? [])
          .filter((group) => group.markers.length > 0)
          .map((group) => (
            <View key={group.panel.id}>
              <Text className="mb-2 mt-6 text-caption uppercase text-txt-faint">
                {group.panel.name}
              </Text>
              <View className="rounded-card border border-stroke bg-surface px-4">
                {group.markers.map((marker, idx) => (
                  <MarkerValueRow
                    key={marker.id}
                    marker={marker}
                    value={values[marker.id] ?? ''}
                    onChange={(raw) => setValue(marker.id, raw)}
                    first={idx === 0}
                  />
                ))}
              </View>
            </View>
          ))}

        {customMarkers.length > 0 ? (
          <View>
            <Text className="mb-2 mt-6 text-caption uppercase text-txt-faint">Personalizados</Text>
            <View className="rounded-card border border-stroke bg-surface px-4">
              {customMarkers.map((marker, idx) => (
                <MarkerValueRow
                  key={marker.id}
                  marker={marker}
                  value={values[marker.id] ?? ''}
                  onChange={(raw) => setValue(marker.id, raw)}
                  first={idx === 0}
                />
              ))}
            </View>
          </View>
        ) : null}

        <Text className="mb-2 mt-6 text-caption uppercase text-txt-faint">
          Marcador personalizado
        </Text>
        <View className="rounded-card border border-stroke bg-surface p-4">
          <TextInput
            value={customName}
            onChangeText={setCustomName}
            placeholder="Nombre (ej. Zonulina)"
            placeholderTextColor={palette.text.tertiary}
            className="rounded-row bg-surface-2 px-4 py-3 text-body text-txt"
          />
          <TextInput
            value={customUnit}
            onChangeText={setCustomUnit}
            placeholder="Unidad (ej. ng/mL)"
            placeholderTextColor={palette.text.tertiary}
            className="mt-3 rounded-row bg-surface-2 px-4 py-3 text-body text-txt"
          />
          <View className="mt-3 flex-row justify-between">
            <View className="w-[48.5%]">
              <Text className="mb-1.5 text-footnote text-txt-dim">Mín (opcional)</Text>
              <TextInput
                value={customLow}
                onChangeText={setCustomLow}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={palette.text.tertiary}
                className="rounded-row bg-surface-2 px-4 py-3 text-body text-txt"
                style={{ fontVariant: ['tabular-nums'] }}
              />
            </View>
            <View className="w-[48.5%]">
              <Text className="mb-1.5 text-footnote text-txt-dim">Máx (opcional)</Text>
              <TextInput
                value={customHigh}
                onChangeText={setCustomHigh}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={palette.text.tertiary}
                className="rounded-row bg-surface-2 px-4 py-3 text-body text-txt"
                style={{ fontVariant: ['tabular-nums'] }}
              />
            </View>
          </View>
          <PrimaryButton
            label="Agregar marcador"
            variant="tonal"
            onPress={addCustomMarker}
            disabled={!canAddCustom}
            className="mt-4"
          />
        </View>
      </ScrollView>

      <View className="px-5 pt-3" style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
        <PrimaryButton
          label={
            entries.length > 0
              ? `Guardar análisis (${entries.length})`
              : 'Guardar análisis'
          }
          onPress={save}
          disabled={!canSave}
        />
      </View>
    </View>
  );
}

type MarkerValueRowProps = {
  marker: LabMarker;
  value: string;
  onChange: (raw: string) => void;
  first: boolean;
};

/** Fila del catálogo: nombre + input decimal (placeholder = unidad). */
function MarkerValueRow({ marker, value, onChange, first }: MarkerValueRowProps) {
  return (
    <View
      className={`flex-row items-center gap-3 py-2.5 ${first ? '' : 'border-t border-separator/50'}`}
    >
      <Text className="flex-1 text-body text-txt" numberOfLines={1}>
        {marker.name}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType="decimal-pad"
        placeholder={marker.unit}
        placeholderTextColor={palette.text.tertiary}
        textAlign="right"
        className="w-28 rounded-row bg-surface-2 px-3 py-2 text-body text-txt"
        style={{ fontVariant: ['tabular-nums'] }}
      />
    </View>
  );
}
