const SHORT_MONTHS = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

const LONG_MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export const WEEKDAY_INITIALS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export function dateOnly(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function shortDate(date: Date): string {
  return `${date.getDate()} ${SHORT_MONTHS[date.getMonth()]}`;
}

export function shortWithTime(date: Date): string {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${shortDate(date)}, ${hh}:${mm}`;
}

export function monthYear(date: Date): string {
  return `${LONG_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function relativeDate(date: Date, now: Date = new Date()): string {
  const today = dateOnly(now);
  const days = Math.round(
    (dateOnly(date).getTime() - today.getTime()) / 86400000,
  );
  if (days === 0) return 'Hoy';
  if (days === 1) return 'Mañana';
  if (days === -1) return 'Ayer';
  if (days > 1 && days < 7) return `En ${days} días`;
  if (days < -1 && days > -7) return `Hace ${-days} días`;
  return shortDate(date);
}

export function toIsoDate(date: Date): string {
  return `${String(date.getFullYear()).padStart(4, '0')}-${String(
    date.getMonth() + 1,
  ).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function parseDate(value: unknown): Date | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  if (!text) return null;
  const parsed = new Date(text.length === 10 ? `${text}T00:00:00` : text);
  if (Number.isNaN(parsed.getTime())) return null;
  return text.length === 10 ? dateOnly(parsed) : parsed;
}

export function daysBetween(a: Date, b: Date): number {
  return Math.round(
    (dateOnly(a).getTime() - dateOnly(b).getTime()) / 86400000,
  );
}
