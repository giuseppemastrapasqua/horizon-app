const dayMs = 86400000;
export const ownerPersonalUseNote = "OWNER_PERSONAL_USE_V1";
export const ownerPersonalUseYearLimit = 30;

export function parsePersonalUseDate(value: unknown): Date {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    throw new Error("Data non valida.");
  const date = new Date(`${value}T00:00:00.000Z`);
  if (
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  )
    throw new Error("Data non valida.");
  return date;
}

export function assertPersonalUseLimit(
  start: Date,
  end: Date,
  existing: Array<{ startDate: Date; endDate: Date }>,
) {
  if (
    end < start ||
    (end.getTime() - start.getTime()) / dayMs + 1 > ownerPersonalUseYearLimit
  )
    throw new Error("Seleziona un periodo da 1 a 30 giorni.");
  const periods = [...existing, { startDate: start, endDate: end }];
  for (
    let year = start.getUTCFullYear();
    year <= end.getUTCFullYear();
    year++
  ) {
    const days = new Set<number>();
    const yearStart = Date.UTC(year, 0, 1);
    const yearEnd = Date.UTC(year + 1, 0, 1);
    for (const period of periods) {
      for (
        let day = Math.max(yearStart, period.startDate.getTime());
        day < yearEnd && day <= period.endDate.getTime();
        day += dayMs
      )
        days.add(day);
    }
    if (days.size > ownerPersonalUseYearLimit)
      throw new Error(
        `Il limite di uso personale è di 30 giorni per struttura nell'anno ${year}.`,
      );
  }
}
