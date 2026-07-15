import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Text, View } from 'react-native';

import type { LabMarker, LabResult } from '@/core/db/repositories/labs.repository';
import {
  Card,
  EmptyState,
  PressableScale,
  PrimaryButton,
  Screen,
  Section,
} from '@/core/design-system/components';
import { palette } from '@/core/design-system/tokens/palette';
import { repos } from '@/queries/repos';
import { useLabMutation, useLabReport } from '@/queries/useLabs';

import { FlagBadge } from '../components/FlagBadge';
import { formatLabValue } from '../components/format';

/** Fuera de rango primero; el resto conserva el orden alfabético del repo. */
function flagRank(flag: string | null): number {
  if (flag === 'low' || flag === 'high') return 0;
  if (flag === 'optimal' || flag === 'in_range') return 1;
  return 2;
}

/** Detalle de un análisis (/labs/report/[id]): resultados + eliminar. */
export default function ReportDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const reportId = params.id ?? '';

  const { data } = useLabReport(reportId);

  const deleteReport = useLabMutation((args: { id: string }) => {
    repos.labs.softDeleteReport(args.id);
    return [];
  });

  if (data === undefined) return <Screen scroll={false}>{null}</Screen>;

  if (data === null) {
    return (
      <Screen scroll={false} className="justify-center">
        <EmptyState
          title="No encontramos este análisis"
          subtitle="Puede que haya sido eliminado."
          action={<PrimaryButton label="Volver" variant="tonal" onPress={() => router.back()} />}
        />
      </Screen>
    );
  }

  const { report, results } = data;
  const sorted = [...results].sort((a, b) => flagRank(a.flag) - flagRank(b.flag));

  return (
    <Screen>
      <View className="mt-1 flex-row items-center gap-2">
        <PressableScale onPress={() => router.back()}>
          <View className="h-9 w-9 items-center justify-center rounded-full bg-surface-2">
            <ChevronLeft color={palette.text.primary} size={20} strokeWidth={2} />
          </View>
        </PressableScale>
        <Text className="flex-1 text-title2 capitalize text-txt" numberOfLines={2}>
          {format(new Date(report.collectedAt), "EEEE d 'de' MMMM yyyy", { locale: es })}
        </Text>
      </View>
      <View className="mb-4 ml-11 mt-1 flex-row flex-wrap items-center gap-2">
        {report.labName ? (
          <Text className="text-footnote text-txt-dim">{report.labName}</Text>
        ) : null}
        {report.fasting ? (
          <Text className="overflow-hidden rounded-chip border border-tint/40 bg-tint/15 px-2.5 py-1 text-caption uppercase text-tint">
            Ayunas
          </Text>
        ) : null}
      </View>

      <Section title="Resultados">
        {sorted.length === 0 ? (
          <Card flush>
            <EmptyState
              title="Este análisis no tiene resultados"
              subtitle="Los resultados que cargues van a aparecer acá."
            />
          </Card>
        ) : (
          <Card flush className="px-4">
            {sorted.map((result, idx) => (
              <ResultRow key={result.id} result={result} first={idx === 0} />
            ))}
          </Card>
        )}
      </Section>

      <PressableScale
        onPress={() =>
          deleteReport.mutate({ id: reportId }, { onSuccess: () => router.back() })
        }
      >
        <Text className="mt-2 py-2 text-center text-subhead text-danger">Eliminar análisis</Text>
      </PressableScale>
    </Screen>
  );
}

/** Fila de resultado: marcador + valor + unidad + flag. Tap → detalle. */
function ResultRow({ result, first }: { result: LabResult & { marker: LabMarker }; first: boolean }) {
  return (
    <PressableScale onPress={() => router.push(`/labs/marker/${result.markerId}`)}>
      <View
        className={`flex-row items-center gap-3 py-3 ${first ? '' : 'border-t border-separator/50'}`}
      >
        <Text className="flex-1 text-body text-txt" numberOfLines={1}>
          {result.marker.name}
        </Text>
        <Text className="text-subhead text-txt" style={{ fontVariant: ['tabular-nums'] }}>
          {`${formatLabValue(result.value)} ${result.unit || result.marker.unit}`}
        </Text>
        <FlagBadge flag={result.flag} />
      </View>
    </PressableScale>
  );
}
