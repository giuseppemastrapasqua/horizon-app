type Booking = { propertyId: string; checkIn: Date; checkOut: Date; nights: number; channel: string; currency: string; grossAmount: unknown };
type Report = { referenceMonth: Date; currency: string; finalAmount: unknown; adjustments: { amount: unknown }[] };
const dayMs = 86_400_000;
const key = (date: Date) => date.toISOString().slice(0, 7);
export function ownerChartWindow(now: Date) {
  return { from: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1)), to: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)) };
}
export function buildOwnerCharts(propertyIds: string[], bookings: Booking[], reports: Report[], now: Date) {
  const { from, to } = ownerChartWindow(now);
  const months = Array.from({ length: 12 }, (_, index) => {
    const start = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + index, 1));
    const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
    return { key: key(start), label: start.toLocaleDateString("it-IT", { month: "short", year: "2-digit", timeZone: "UTC" }), start, end };
  });
  const scoped = bookings.filter(b => propertyIds.includes(b.propertyId));
  const currencies = [...new Set([...scoped.map(b => b.currency), ...reports.map(r => r.currency)])].sort();
  const financial = currencies.map(currency => ({ currency, months: months.map(month => {
    const stays = scoped.filter(b => b.currency === currency && b.checkOut >= month.start && b.checkOut < month.end);
    const saved = reports.filter(r => r.currency === currency && key(r.referenceMonth) === month.key);
    const cents = stays.reduce((sum, b) => sum + Math.round(Number(b.grossAmount) * 100), 0);
    const nights = stays.reduce((sum, b) => sum + b.nights, 0);
    return { label: month.label, gross: cents / 100, adr: nights ? cents / 100 / nights : null, net: saved.length ? saved.reduce((sum, r) => sum + Math.round(Number(r.finalAmount) * 100) + r.adjustments.reduce((s, a) => s + Math.round(Number(a.amount) * 100), 0), 0) / 100 : null, reportCount: saved.length };
  }), channels: [...new Set(scoped.filter(b => b.currency === currency && b.checkOut >= from && b.checkOut < to).map(b => b.channel))].map(channel => ({ label: channel, value: scoped.filter(b => b.currency === currency && b.channel === channel && b.checkOut >= from && b.checkOut < to).reduce((sum, b) => sum + Math.round(Number(b.grossAmount) * 100), 0) / 100 })) }));
  const occupancy = months.map(month => {
    const occupied = new Set<string>();
    for (const booking of scoped) {
      for (let day = Math.max(booking.checkIn.getTime(), month.start.getTime()); day < Math.min(booking.checkOut.getTime(), month.end.getTime()); day += dayMs) occupied.add(`${booking.propertyId}:${new Date(day).toISOString().slice(0, 10)}`);
    }
    const capacity = Math.round((month.end.getTime() - month.start.getTime()) / dayMs) * new Set(propertyIds).size;
    return { label: month.label, nights: occupied.size, value: capacity ? occupied.size / capacity * 100 : 0 };
  });
  return { financial, occupancy };
}
