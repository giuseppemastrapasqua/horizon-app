type Stay = {
  propertyId: string;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  grossAmount: unknown;
  currency: string;
  bookingStatus: string;
};
const dayMs = 86400000;

export function monthlyPerformance(
  propertyIds: string[],
  stays: Stay[],
  start: Date,
  end: Date,
) {
  const allowed = new Set(propertyIds);
  const occupied = new Set<string>();
  const revenues = new Map<
    string,
    { gross: number; nights: number; stays: number }
  >();
  const days = Math.round((end.getTime() - start.getTime()) / dayMs);
  const dailyOccupied = Array<number>(days).fill(0);
  for (const stay of stays) {
    if (!allowed.has(stay.propertyId) || stay.bookingStatus === "CANCELLED")
      continue;
    const first = Math.max(
      start.getTime(),
      Date.UTC(
        stay.checkIn.getUTCFullYear(),
        stay.checkIn.getUTCMonth(),
        stay.checkIn.getUTCDate(),
      ),
    );
    const last = Math.min(
      end.getTime(),
      Date.UTC(
        stay.checkOut.getUTCFullYear(),
        stay.checkOut.getUTCMonth(),
        stay.checkOut.getUTCDate(),
      ),
    );
    for (let day = first; day < last; day += dayMs) {
      const key = `${stay.propertyId}:${day}`;
      if (!occupied.has(key)) dailyOccupied[(day - start.getTime()) / dayMs]++;
      occupied.add(key);
    }
    if (stay.checkOut >= start && stay.checkOut < end) {
      const previous = revenues.get(stay.currency) ?? {
        gross: 0,
        nights: 0,
        stays: 0,
      };
      revenues.set(stay.currency, {
        gross: previous.gross + Number(stay.grossAmount),
        nights: previous.nights + stay.nights,
        stays: previous.stays + 1,
      });
    }
  }
  return {
    days,
    occupiedNights: occupied.size,
    availableNights: allowed.size * days,
    dailyOccupied,
    revenues: [...revenues].map(([currency, totals]) => ({
      currency,
      ...totals,
    })),
  };
}
