import { formatDecimal, formatInt } from '@/core/lib/format';

/** Peso en kg: entero sin decimales, fraccionado con una coma ("82,5"). */
export function formatKg(value: number): string {
  return Number.isInteger(value) ? formatInt(value) : formatDecimal(value, 1);
}

/** Segundos → "mm:ss" (cronómetro de sesión y rest timer). */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

/** Etiquetas es-AR del equipment del catálogo de ejercicios. */
export const EQUIPMENT_LABELS: Record<string, string> = {
  barbell: 'Barra',
  dumbbell: 'Mancuernas',
  machine: 'Máquina',
  cable: 'Polea',
  bodyweight: 'Peso corporal',
  band: 'Banda',
  other: 'Otro',
};
