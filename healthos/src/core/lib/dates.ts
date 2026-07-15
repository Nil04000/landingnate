import { addDays, format, parseISO, startOfWeek, subDays } from 'date-fns';

/**
 * Fecha calendario LOCAL 'YYYY-MM-DD' — la unidad analítica de toda la app.
 * Los timestamps puntuales son epoch ms; `day_date` decide a qué día se
 * acredita cada registro.
 */
export type LocalDate = string;

export function todayLocal(now: Date = new Date()): LocalDate {
  return format(now, 'yyyy-MM-dd');
}

export function toLocalDate(date: Date): LocalDate {
  return format(date, 'yyyy-MM-dd');
}

export function fromLocalDate(day: LocalDate): Date {
  return parseISO(day);
}

export function addDaysLocal(day: LocalDate, days: number): LocalDate {
  return toLocalDate(addDays(fromLocalDate(day), days));
}

export function daysAgoLocal(days: number, now: Date = new Date()): LocalDate {
  return toLocalDate(subDays(now, days));
}

/** Rango [from, to] inclusive de los últimos `n` días terminando hoy. */
export function lastNDaysRange(n: number, now: Date = new Date()): { from: LocalDate; to: LocalDate } {
  return { from: toLocalDate(subDays(now, n - 1)), to: toLocalDate(now) };
}

/** Lista de LocalDates [from..to] inclusive. */
export function eachDayLocal(from: LocalDate, to: LocalDate): LocalDate[] {
  const out: LocalDate[] = [];
  let cursor = from;
  while (cursor <= to) {
    out.push(cursor);
    cursor = addDaysLocal(cursor, 1);
  }
  return out;
}

/** Semana ISO 'YYYY-Www' (para dedupe de insights). */
export function isoWeekOf(day: LocalDate): string {
  return format(fromLocalDate(day), "RRRR-'W'II");
}

/** Lunes de la semana del día dado. */
export function weekStartOf(day: LocalDate): LocalDate {
  return toLocalDate(startOfWeek(fromLocalDate(day), { weekStartsOn: 1 }));
}

/** 0=domingo … 6=sábado (getDay nativo). */
export function weekdayOf(day: LocalDate): number {
  return fromLocalDate(day).getDay();
}

export function nowMs(): number {
  return Date.now();
}
