/** Join de clases condicionales (suficiente para NativeWind; sin dependencias). */
export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}
