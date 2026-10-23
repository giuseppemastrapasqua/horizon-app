export const dateKey = (date: Date) => date.toISOString().slice(0, 10);
export function parseDay(value: string) {
  const date = new Date(`${value}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(date.getTime()) || dateKey(date) !== value) throw new Error("Data non valida.");
  return date;
}
export function romeToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const part = (type: string) => parts.find((item) => item.type === type)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}
export const addDays = (key: string, days: number) => dateKey(new Date(parseDay(key).getTime() + days * 86400000));
export function addMonths(key: string, months: number) {
  const date = parseDay(key);
  const last = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months + 1, 0)).getUTCDate();
  return dateKey(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, Math.min(date.getUTCDate(), last))));
}
export function dayRange(from: string, to: string) {
  const start = parseDay(from), end = parseDay(to);
  const length = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
  if (length < 1 || length > 93) throw new Error("Seleziona da 1 a 93 giorni in ordine cronologico.");
  return Array.from({ length }, (_, i) => addDays(from, i));
}
