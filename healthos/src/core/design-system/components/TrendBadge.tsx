import { Text, View } from 'react-native';

import { cn } from '../cn';

type TrendBadgeProps = {
  /** Cambio porcentual vs período anterior (ej. -12.5) */
  pct: number;
  /** Qué dirección es buena para esta métrica (peso: 'down'; pasos: 'up') */
  goodDirection?: 'up' | 'down';
};

/** Badge ▲/▼ con % vs período anterior, coloreado por si el cambio es bueno. */
export function TrendBadge({ pct, goodDirection = 'up' }: TrendBadgeProps) {
  if (!Number.isFinite(pct) || pct === 0) {
    return (
      <View className="rounded-chip bg-surface-2 px-1.5 py-0.5">
        <Text className="text-caption text-txt-dim">—</Text>
      </View>
    );
  }

  const up = pct > 0;
  const good = (up && goodDirection === 'up') || (!up && goodDirection === 'down');
  const formatted = `${Math.abs(pct) >= 10 ? Math.round(Math.abs(pct)) : Math.abs(pct).toFixed(1).replace('.', ',')}%`;

  return (
    <View className="rounded-chip bg-surface-2 px-1.5 py-0.5">
      <Text className={cn('text-caption', good ? 'text-success' : 'text-danger')}>
        {up ? '▲' : '▼'} {formatted}
      </Text>
    </View>
  );
}
