import { Canvas, Circle, Path, Skia } from '@shopify/react-native-skia';

import { palette } from '../tokens/palette';

type SparklineProps = {
  /** Serie ya ordenada en el tiempo (los null se omiten) */
  values: (number | null)[];
  width?: number;
  height?: number;
  color?: string;
};

/** Mini-gráfico de línea Skia (últimos 7/30 valores en cards). */
export function Sparkline({ values, width = 72, height = 28, color = palette.tint }: SparklineProps) {
  const points = values
    .map((v, i) => ({ v, i }))
    .filter((p): p is { v: number; i: number } => p.v != null);

  if (points.length < 2) {
    return <Canvas style={{ width, height }} />;
  }

  const min = Math.min(...points.map((p) => p.v));
  const max = Math.max(...points.map((p) => p.v));
  const span = max - min || 1;
  const pad = 3;
  const stepX = (width - pad * 2) / (values.length - 1);
  const y = (v: number) => pad + (1 - (v - min) / span) * (height - pad * 2);

  const path = Skia.Path.Make();
  points.forEach((p, idx) => {
    const px = pad + p.i * stepX;
    const py = y(p.v);
    if (idx === 0) path.moveTo(px, py);
    else path.lineTo(px, py);
  });

  const last = points[points.length - 1]!;

  return (
    <Canvas style={{ width, height }}>
      <Path path={path} color={color} style="stroke" strokeWidth={2} strokeJoin="round" strokeCap="round" />
      <Circle cx={pad + last.i * stepX} cy={y(last.v)} r={2.5} color={color} />
    </Canvas>
  );
}
