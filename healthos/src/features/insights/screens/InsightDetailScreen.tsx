import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useEffect } from 'react';
import { Text, View } from 'react-native';

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
import { fromLocalDate } from '@/core/lib/dates';
import { METRIC_META, type InsightMetricId } from '@/features/insights/engine/metric-meta';
import { useInsight, useInsightAction } from '@/queries/useInsights';

import { insightMetricToStatsKey, KIND_LABELS, severityColor } from '../components/insight-ui';

/** Detalle de un insight: evidencia numérica + links a las métricas. */
export default function InsightDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { data: insight } = useInsight(params.id ?? '');
  const markSeen = useInsightAction('seen');
  const dismiss = useInsightAction('dismiss');

  useEffect(() => {
    if (insight && insight.status === 'new') markSeen.mutate(insight.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [insight?.id]);

  if (!insight) {
    return (
      <Screen scroll={false} className="justify-center">
        <EmptyState title="Insight no encontrado" />
      </Screen>
    );
  }

  const evidence: { label: string; value: string }[] = [];
  const m = insight.metrics;
  if (typeof m.n === 'number') evidence.push({ label: 'Días apareados (n)', value: String(m.n) });
  if (typeof m.nA === 'number') evidence.push({ label: 'Días en cada grupo', value: `${m.nA} vs ${String(m.nB ?? '—')}` });
  if (typeof m.r === 'number') evidence.push({ label: 'Correlación (Pearson)', value: String(m.r).replace('.', ',') });
  if (typeof m.rSpearman === 'number') evidence.push({ label: 'Correlación (Spearman)', value: String(m.rSpearman).replace('.', ',') });
  if (typeof m.d === 'number') evidence.push({ label: "Tamaño de efecto (d de Cohen)", value: String(m.d).replace('.', ',') });
  if (typeof m.p === 'number') evidence.push({ label: 'Significancia (p)', value: String(m.p).replace('.', ',') });
  if (typeof m.relDiff === 'number') evidence.push({ label: 'Diferencia relativa', value: `${Math.round((m.relDiff as number) * 100)}%` });
  if (typeof m.relChange === 'number') evidence.push({ label: 'Cambio', value: `${Math.round((m.relChange as number) * 100)}%` });
  if (typeof m.length === 'number') evidence.push({ label: 'Días de racha', value: String(m.length) });

  const linkedMetrics = ['x', 'y', 'metric']
    .map((key) => m[key])
    .filter((v): v is string => typeof v === 'string')
    .map((id) => ({ id: id as InsightMetricId, statsKey: insightMetricToStatsKey(id) }))
    .filter((entry, idx, arr) => arr.findIndex((e) => e.id === entry.id) === idx);

  return (
    <Screen>
      <View className="mb-5 mt-1 flex-row items-center gap-2">
        <PressableScale onPress={() => router.back()}>
          <View className="h-9 w-9 items-center justify-center rounded-full bg-surface-2">
            <ChevronLeft color="#F5F5F7" size={20} strokeWidth={2} />
          </View>
        </PressableScale>
        <View className="flex-row items-center gap-1.5">
          <View
            style={{ backgroundColor: severityColor(insight.severity) }}
            className="h-2 w-2 rounded-full"
          />
          <Text className="text-caption uppercase text-txt-faint">
            {KIND_LABELS[insight.kind] ?? insight.kind}
          </Text>
        </View>
      </View>

      <Text className="mb-2 text-title2 text-txt">{insight.title}</Text>
      <Text className="mb-6 text-body leading-6 text-txt-dim">{insight.body}</Text>

      {evidence.length > 0 ? (
        <Section title="Evidencia">
          <Card flush className="px-4">
            {evidence.map((row, i) => (
              <View
                key={row.label}
                className={`flex-row items-center justify-between py-2.5 ${i > 0 ? 'border-t border-separator/50' : ''}`}
              >
                <Text className="text-subhead text-txt-dim">{row.label}</Text>
                <Text className="text-subhead text-txt" style={{ fontVariant: ['tabular-nums'] }}>
                  {row.value}
                </Text>
              </View>
            ))}
            <View className="border-t border-separator/50 py-2.5">
              <Text className="text-footnote text-txt-faint">
                Período: {format(fromLocalDate(insight.periodStart), 'd MMM', { locale: es })} –{' '}
                {format(fromLocalDate(insight.periodEnd), 'd MMM yyyy', { locale: es })}
              </Text>
            </View>
          </Card>
        </Section>
      ) : null}

      {linkedMetrics.some((l) => l.statsKey) ? (
        <Section title="Explorar métricas">
          <Card flush className="px-4">
            {linkedMetrics
              .filter((l) => l.statsKey)
              .map((link, i) => (
                <View key={link.id} className={i > 0 ? 'border-t border-separator/50' : ''}>
                  <ListRow
                    title={capitalize(METRIC_META[link.id]?.label ?? link.id)}
                    trailing={<ChevronRight color={palette.text.tertiary} size={16} strokeWidth={2} />}
                    onPress={() => router.push(`/stats/${link.statsKey}`)}
                  />
                </View>
              ))}
          </Card>
        </Section>
      ) : null}

      <Text className="mb-6 px-1 text-footnote text-txt-faint">
        Correlación no es causa: esto describe una tendencia en TUS datos, no un diagnóstico.
      </Text>

      <PrimaryButton
        label="Descartar este insight"
        variant="tonal"
        onPress={() => {
          dismiss.mutate(insight.id, { onSuccess: () => router.back() });
        }}
      />
    </Screen>
  );
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
