export type ControlStay = { id: string; checkIn: Date; checkOut: Date; bookedAt: Date | null; grossAmount: number; nights: number; bookingStatus: string; guestName: string };
export type ControlBlock = { startDate: Date; endDate: Date };
const day = 86400000;
const dateKey = (d: Date) => d.toISOString().slice(0, 10);
const midnight = (d: Date) => new Date(`${dateKey(d)}T00:00:00Z`).getTime();
export function analyzeRevenueControl(stays: ControlStay[], blocks: ControlBlock[], now: Date) {
  const todayKey = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  const today = new Date(`${todayKey}T00:00:00Z`).getTime();
  const valid = stays.filter(s => ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'].includes(s.bookingStatus) && s.guestName !== 'CLOSED');
  const future = valid.filter(s => midnight(s.checkOut) > today);
  const windows = [14, 30, 60].map(length => {
    let booked = 0, blocked = 0, overlaps = 0;
    const free: string[] = [];
    for (let n = 0; n < length; n++) {
      const t = today + n * day;
      const count = valid.filter(s => midnight(s.checkIn) <= t && midnight(s.checkOut) > t).length;
      const isBlocked = blocks.some(b => midnight(b.startDate) <= t && midnight(b.endDate) >= t);
      if (count) booked++;
      else if (isBlocked) blocked++;
      else free.push(dateKey(new Date(t)));
      if (count > 1) overlaps++;
    }
    return { length, booked, blocked, free, overlaps, occupancy: length === blocked ? null : Math.round(booked / (length - blocked) * 100) };
  });
  const unknownAmounts = future.filter(s => !Number.isFinite(s.grossAmount) || s.grossAmount <= 0).length;
  const unknownBookedAt = future.filter(s => !s.bookedAt).length;
  const pickup = future.filter(s => s.bookedAt && s.bookedAt <= now && s.bookedAt.getTime() >= now.getTime() - 7 * day).length;
  const overlaps = valid.flatMap((a, i) => valid.slice(i + 1).filter(b => midnight(a.checkIn) < midnight(b.checkOut) && midnight(b.checkIn) < midnight(a.checkOut) && Math.min(midnight(a.checkOut), midnight(b.checkOut)) > today).map(b => ({ from: dateKey(new Date(Math.max(midnight(a.checkIn), midnight(b.checkIn)))), to: dateKey(new Date(Math.min(midnight(a.checkOut), midnight(b.checkOut)))) })));
  return { today: todayKey, windows, unknownAmounts, unknownBookedAt, pickup: unknownBookedAt ? null : pickup, futureCount: future.length, overlaps };
}
