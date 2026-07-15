import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { cn } from '../cn';
import { typography } from '../tokens/typography';
import { palette } from '../tokens/palette';
import { AnimatedNumber } from './AnimatedNumber';
import { Card } from './Card';
import { PressableScale } from './PressableScale';
import { RingProgress } from './RingProgress';
import { Sparkline } from './Sparkline';
import { TrendBadge } from './TrendBadge';

type MetricCardProps = {
  label: string;
  /** null = sin dato hoy (muestra placeholder "—") */
  value: number | null;
  unit?: string | undefined;
  decimals?: number | undefined;
  /** Color identitario de la métrica (palette.metric.*) */
  color?: string | undefined;
  icon?: ReactNode | undefined;
  /** Progreso 0..1 hacia el objetivo → anillo */
  progress?: number | null | undefined;
  /** Serie corta (7d) → sparkline */
  spark?: (number | null)[] | undefined;
  /** % vs período anterior → TrendBadge */
  trendPct?: number | null | undefined;
  trendGoodDirection?: 'up' | 'down' | undefined;
  onPress?: (() => void) | undefined;
  className?: string | undefined;
};

/**
 * Card de métrica del dashboard: label caption arriba, valor animado grande,
 * y UN adorno (anillo, sparkline o trend) — nunca más de uno, para respirar.
 */
export function MetricCard({
  label,
  value,
  unit,
  decimals = 0,
  color = palette.tint,
  icon,
  progress,
  spark,
  trendPct,
  trendGoodDirection = 'up',
  onPress,
  className,
}: MetricCardProps) {
  const body = (
    <Card className="min-h-[110px] flex-1 justify-between">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-1.5">
          {icon}
          <Text className="text-caption uppercase text-txt-faint">{label}</Text>
        </View>
        {progress != null ? (
          <RingProgress progress={progress} size={26} strokeWidth={3.5} color={color} />
        ) : null}
      </View>

      <View className="mt-2 flex-row items-end justify-between">
        <View className="flex-row items-baseline gap-1">
          {value == null ? (
            <Text style={[typography.title1]} className="text-txt-faint">
              —
            </Text>
          ) : (
            <AnimatedNumber
              value={value}
              decimals={decimals}
              style={[typography.title1 as object, { color: palette.text.primary }]}
            />
          )}
          {unit && value != null ? (
            <Text className="pb-0.5 text-footnote text-txt-dim">{unit}</Text>
          ) : null}
        </View>

        {spark && spark.some((v) => v != null) ? (
          <Sparkline values={spark} color={color} />
        ) : trendPct != null ? (
          <TrendBadge pct={trendPct} goodDirection={trendGoodDirection} />
        ) : null}
      </View>
    </Card>
  );

  if (!onPress) return <View className={cn(className)}>{body}</View>;

  return (
    <PressableScale onPress={onPress} className={cn(className)}>
      {body}
    </PressableScale>
  );
}
