/** Formateo numérico es-AR: miles con punto, decimales con coma. */

const intFormatter = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 });

export function formatInt(value: number): string {
  return intFormatter.format(Math.round(value));
}

export function formatDecimal(value: number, decimals = 1): string {
  return value.toFixed(decimals).replace('.', ',');
}

/** 450 → "7 h 30 min"; 45 → "45 min". */
export function formatMinutes(totalMinutes: number): string {
  const minutes = Math.round(totalMinutes);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

/** Epoch ms → "HH:MM" local. */
export function formatTime(ms: number): string {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
