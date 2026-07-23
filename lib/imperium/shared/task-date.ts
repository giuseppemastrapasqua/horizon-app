export function createTaskDate(
  baseDate: Date,
  dayOffset: number,
  hour: number
) {
  const date = new Date(baseDate);

  date.setUTCDate(date.getUTCDate() + dayOffset);
  date.setUTCHours(hour, 0, 0, 0);

  return date;
}