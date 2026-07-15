import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { router } from 'expo-router';
import { ChevronLeft, ChevronRight, FlaskConical, Plus } from 'lucide-react-native';
import { Text, View } from 'react-native';

import type { LabReport, MarkerWithLatest } from '@/core/db/repositories/labs.repository';
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
import { useLabReport, useLabReports, useLabsIndex } from '@/queries/useLabs';

import { FlagBadge } from '../components/FlagBadge';
import { formatLabValue } from '../components/format';
import { RangeBar } from '../components/RangeBar';

type PanelGroup = {
  key: string;
  title: string;
  sortIndex: number;
  items: MarkerWithLatest[];
};

/** Agrupa los marcadores del índice por panel (null → "Otros", al final). */
function groupByPanel(markers: MarkerWithLatest[]): PanelGroup[] {
  const byKey = new Map<string, PanelGroup>();
  for (const marker of markers) {
    const key = marker.panel?.id ?? 'none';
    let group = byKey.get(key);
    if (!group) {
      group = {
        key,
        title: marker.panel?.name ?? 'Otros',
        sortIndex: marker.panel?.sortIndex ?? Number.MAX_SAFE_INTEGER,
        items: [],
      };
      byKey.set(key, group);
    }
    group.items.push(marker);
  }
  return [...byKey.values()].sort((a, b) => a.sortIndex - b.sortIndex);
}

/** Índice de laboratorios (/labs): marcadores por panel + análisis cargados. */
export default function LabsIndexScreen() {
  const { data: markers } = useLabsIndex();
  const { data: reports } = useLabReports();

  if (markers === undefined || reports === undefined) {
    return <Screen scroll={false}>{null}</Screen>;
  }

  const header = (
    <View className="mb-4 mt-1 flex-row items-center gap-2">
      <PressableScale onPress={() => router.back()}>
        <View className="h-9 w-9 items-center justify-center rounded-full bg-surface-2">
          <ChevronLeft color={palette.text.primary} size={20} strokeWidth={2} />
        </View>
      </PressableScale>
      <Text className="flex-1 text-title2 text-txt">Laboratorios</Text>
      <PressableScale onPress={() => router.push('/labs/new-report')}>
        <View className="flex-row items-center gap-1 overflow-hidden rounded-chip border border-tint/40 bg-tint/15 py-1.5 pl-2 pr-3">
          <Plus color={palette.tint} size={16} strokeWidth={2.5} />
          <Text className="text-subhead text-tint">Análisis</Text>
        </View>
      </PressableScale>
    </View>
  );

  if (markers.length === 0 && reports.length === 0) {
    return (
      <Screen scroll={false}>
        <View className="px-5">{header}</View>
        <View className="flex-1 justify-center">
          <EmptyState
            icon={<FlaskConical color={palette.metric.labs} size={32} strokeWidth={1.6} />}
            title="Cargá tu primer análisis"
            subtitle="Registrá tus laboratorios para seguir cada marcador contra su rango y ver la evolución."
            action={
              <PrimaryButton
                label="Cargar análisis"
                onPress={() => router.push('/labs/new-report')}
              />
            }
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      {header}

      {groupByPanel(markers).map((group) => (
        <Section key={group.key} title={group.title}>
          {group.items.map((marker) => (
            <MarkerCard key={marker.id} marker={marker} />
          ))}
        </Section>
      ))}

      {reports.length > 0 ? (
        <Section title="Análisis">
          <Card flush className="px-4">
            {reports.map((report, idx) => (
              <ReportRow key={report.id} report={report} first={idx === 0} />
            ))}
          </Card>
        </Section>
      ) : null}
    </Screen>
  );
}

/** Card de marcador: nombre + flag, valor grande con tendencia y RangeBar. */
function MarkerCard({ marker }: { marker: MarkerWithLatest }) {
  const latest = marker.latest;
  if (!latest) return null;

  const delta = marker.previous ? latest.value - marker.previous.value : null;
  let trendClass = 'text-txt-dim';
  if (delta != null && delta !== 0 && marker.higherIsWorse != null) {
    const improving = marker.higherIsWorse === 1 ? delta < 0 : delta > 0;
    trendClass = improving ? 'text-success' : 'text-danger';
  }

  return (
    <PressableScale onPress={() => router.push(`/labs/marker/${marker.id}`)}>
      <Card className="mb-3">
        <View className="flex-row items-center gap-2">
          <Text className="flex-1 text-headline text-txt" numberOfLines={1}>
            {marker.name}
          </Text>
          <FlagBadge flag={latest.flag} />
        </View>

        <View className="mt-1.5 flex-row items-end gap-1.5">
          <Text className="text-title2 text-txt" style={{ fontVariant: ['tabular-nums'] }}>
            {formatLabValue(latest.value)}
          </Text>
          <Text className="mb-0.5 text-footnote text-txt-dim">{latest.unit || marker.unit}</Text>
          {delta != null && delta !== 0 ? (
            <Text className={`mb-0.5 text-footnote ${trendClass}`}>{delta > 0 ? '▲' : '▼'}</Text>
          ) : null}
        </View>

        {marker.range ? (
          <RangeBar value={latest.value} range={marker.range} flag={latest.flag} className="mt-3" />
        ) : null}
      </Card>
    </PressableScale>
  );
}

/** Fila de un análisis: fecha + laboratorio + cantidad de resultados. */
function ReportRow({ report, first }: { report: LabReport; first: boolean }) {
  const { data } = useLabReport(report.id);
  const count = data?.results.length ?? 0;
  const countLabel = `${count} ${count === 1 ? 'resultado' : 'resultados'}`;

  return (
    <ListRow
      title={format(new Date(report.collectedAt), 'd MMM yyyy', { locale: es })}
      subtitle={report.labName ? `${report.labName} · ${countLabel}` : countLabel}
      trailing={<ChevronRight color={palette.text.tertiary} size={18} strokeWidth={2} />}
      onPress={() => router.push(`/labs/report/${report.id}`)}
      className={first ? undefined : 'border-t border-separator/50'}
    />
  );
}
