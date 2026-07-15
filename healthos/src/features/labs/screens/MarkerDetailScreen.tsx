import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Text, useWindowDimensions, View } from 'react-native';

import {
  Card,
  EmptyState,
  ListRow,
  PressableScale,
  PrimaryButton,
  Screen,
  Section,
} from '@/core/design-system/components';
import { palette } from '@/core/design-system/tokens/palette';
import { useMarkerDetail } from '@/queries/useLabs';

import { FlagBadge } from '../components/FlagBadge';
import { formatLabValue } from '../components/format';
import { MarkerChart } from '../components/MarkerChart';
import { RangeBar } from '../components/RangeBar';

/** Detalle de un marcador (/labs/marker/[id]): valor actual, gráfico e historial. */
export default function MarkerDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const markerId = params.id ?? '';
  const { width } = useWindowDimensions();

  const { data } = useMarkerDetail(markerId);

  if (data === undefined) return <Screen scroll={false}>{null}</Screen>;

  const { marker, history, range } = data;

  if (marker === null || history.length === 0) {
    return (
      <Screen scroll={false} className="justify-center">
        <EmptyState
          title="No encontramos este marcador"
          subtitle="Puede que haya sido eliminado o que todavía no tenga resultados."
          action={<PrimaryButton label="Volver" variant="tonal" onPress={() => router.back()} />}
        />
      </Screen>
    );
  }

  const latest = history[history.length - 1]!;
  const previous = history.length > 1 ? history[history.length - 2] : undefined;
  const unit = latest.unit || marker.unit;

  let deltaLabel: string | null = null;
  if (previous) {
    const delta = latest.value - previous.value;
    const when = format(new Date(previous.collectedAt), 'MMM yyyy', { locale: es });
    deltaLabel =
      delta === 0
        ? `Sin cambios vs. ${when}`
        : `${delta > 0 ? '+' : '−'}${formatLabValue(Math.abs(delta))} ${unit} vs. ${when}`;
  }

  // Gutter de 20 por lado + padding interno de la card (p-4) + borde.
  const chartWidth = Math.max(160, width - 40 - 34);

  return (
    <Screen>
      <View className="mt-1 flex-row items-center gap-2">
        <PressableScale onPress={() => router.back()}>
          <View className="h-9 w-9 items-center justify-center rounded-full bg-surface-2">
            <ChevronLeft color={palette.text.primary} size={20} strokeWidth={2} />
          </View>
        </PressableScale>
        <Text className="flex-1 text-title2 text-txt" numberOfLines={2}>
          {marker.name}
        </Text>
      </View>
      <Text className="mb-4 ml-11 mt-0.5 text-footnote text-txt-dim">{marker.unit}</Text>

      <Card className="mb-6 items-center py-5">
        <View className="flex-row items-end gap-2">
          <Text className="text-title1 text-txt" style={{ fontVariant: ['tabular-nums'] }}>
            {formatLabValue(latest.value)}
          </Text>
          <Text className="mb-1 text-subhead text-txt-dim">{unit}</Text>
        </View>
        <View className="mt-2">
          <FlagBadge flag={latest.flag} />
        </View>
        {deltaLabel ? (
          <Text className="mt-2 text-footnote text-txt-dim" style={{ fontVariant: ['tabular-nums'] }}>
            {deltaLabel}
          </Text>
        ) : null}
      </Card>

      <Section title="Evolución">
        <Card>
          <MarkerChart history={history} range={range} width={chartWidth} height={160} />
        </Card>
      </Section>

      {range ? (
        <Section title="Rango de referencia">
          <Card>
            <RangeBar value={latest.value} range={range} flag={latest.flag} />
            <View className="mt-2 flex-row justify-between">
              <Text className="text-caption text-txt-faint" style={{ fontVariant: ['tabular-nums'] }}>
                {range.low != null ? `${formatLabValue(range.low)} ${unit}` : '—'}
              </Text>
              <Text className="text-caption text-txt-faint" style={{ fontVariant: ['tabular-nums'] }}>
                {range.high != null ? `${formatLabValue(range.high)} ${unit}` : '—'}
              </Text>
            </View>
            {range.optimalLow != null || range.optimalHigh != null ? (
              <Text className="mt-1.5 text-caption text-txt-faint" style={{ fontVariant: ['tabular-nums'] }}>
                {`Óptimo: ${range.optimalLow != null ? formatLabValue(range.optimalLow) : '—'} – ${
                  range.optimalHigh != null ? formatLabValue(range.optimalHigh) : '—'
                } ${unit}`}
              </Text>
            ) : null}
          </Card>
        </Section>
      ) : null}

      <Section title="Historial">
        <Card flush className="px-4">
          {[...history].reverse().map((result, idx) => (
            <ListRow
              key={result.id}
              title={format(new Date(result.collectedAt), 'd MMM yyyy', { locale: es })}
              trailing={
                <View className="flex-row items-center gap-2.5">
                  <Text
                    className="text-subhead text-txt"
                    style={{ fontVariant: ['tabular-nums'] }}
                  >
                    {`${formatLabValue(result.value)} ${result.unit || marker.unit}`}
                  </Text>
                  <FlagBadge flag={result.flag} />
                </View>
              }
              className={idx > 0 ? 'border-t border-separator/50' : undefined}
            />
          ))}
        </Card>
      </Section>
    </Screen>
  );
}
