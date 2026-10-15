export function ownerBookingPeriod(from?: string, to?: string) {
  const parse = (value: string | undefined) => {
    if (!value) return null;
    const result = new Date(`${value}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(result.getTime()) || result.toISOString().slice(0, 10) !== value) throw new Error("Seleziona date valide.");
    return result;
  };
  const start = parse(from), end = parse(to);
  if (start && end && end < start) throw new Error("La data Al non può precedere Dal.");
  return { ...(start ? { checkOut: { gt: start } } : {}), ...(end ? { checkIn: { lt: new Date(end.getTime() + 86400000) } } : {}) };
}
