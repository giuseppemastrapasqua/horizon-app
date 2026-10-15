import { resolveMilanShortRentalTaxPolicy } from "@/lib/integrations/soggiorniamo/milan-tax-policy";
export type FiscalGuest = { status: string; guestTypeCode: number | null; tariff: number | null; taxAmount: number | null; intermediary: string | null } | null;
export type TaxStay = { id: string; propertyId: string; checkIn: Date; checkOut: Date; guests: number; channel: string; classifications: FiscalGuest[] };
export type TaxProperty = { id: string; name: string; city: string };
const ms = 86400000;
const day = (value: Date) => new Date(`${value.toISOString().slice(0, 10)}T00:00:00Z`).getTime();
const cents = (value: number) => Math.round((value + Number.EPSILON) * 100);

export function buildMonthlyTaxReport(year: number, properties: TaxProperty[], stays: TaxStay[]) {
  if (!Number.isInteger(year) || year < 2020 || year > 2100) throw new Error("Anno non valido.");
  return properties.map((property) => {
    const months = Array.from({ length: 12 }, (_, month) => ({ month: month + 1, guestCount: 0, guestNights: 0, taxableGuestNights: 0, exemptGuestNights: 0, portalGuestNights: 0, managerCents: 0, portalCents: 0, reviewGuestNights: 0, estimateCents: 0, estimateUnavailable: false, bookingIds: [] as string[] }));
    const details: { bookingId: string; month: number; channel: string; nights: number; expectedGuests: number; managerCents: number; reviewGuestNights: number }[] = [];
    for (const stay of stays.filter((item) => item.propertyId === property.id)) {
      const start = day(stay.checkIn), end = day(stay.checkOut);
      const nights = (end - start) / ms;
      if (!Number.isInteger(nights) || nights < 1) continue;
      const slots = Math.max(1, stay.guests, stay.classifications.length);
      const knownCity = property.city.trim().toLowerCase() === "milano";
      let policy: ReturnType<typeof resolveMilanShortRentalTaxPolicy> | null = null;
      try { if (knownCity) policy = resolveMilanShortRentalTaxPolicy(stay.checkIn); } catch { /* Unsupported periods remain under review. */ }
      // A cross-year stay requires explicit policy verification rather than reusing last year's tariff.
      if (new Date(end - ms).getUTCFullYear() !== stay.checkIn.getUTCFullYear()) policy = null;
      for (let month = 0; month < 12; month++) {
        const monthStart = Date.UTC(year, month, 1), monthEnd = Date.UTC(year, month + 1, 1);
        const overlap = Math.max(0, (Math.min(end, monthEnd) - Math.max(start, monthStart)) / ms);
        if (!overlap) continue;
        const row = months[month];
        row.bookingIds.push(stay.id);
        row.guestCount += slots;
        row.guestNights += overlap * slots;
        const taxableEnd = policy ? Math.min(end, start + policy.maximumTaxableNights * ms) : end;
        const taxableOverlap = Math.max(0, (Math.min(taxableEnd, monthEnd) - Math.max(start, monthStart)) / ms);
        const fullTaxNights = policy ? Math.min(nights, policy.maximumTaxableNights) : nights;
        const priorDue = row.managerCents, priorReview = row.reviewGuestNights;
        for (let index = 0; index < slots; index++) {
          const fiscal = stay.classifications[index];
          const valid = stay.guests >= 1 && stay.classifications.length <= stay.guests && policy && fiscal?.status === "CLASSIFIED" && fiscal.taxAmount !== null && Number.isFinite(fiscal.taxAmount) && fiscal.taxAmount >= 0 && fiscal.tariff !== null && Number.isFinite(fiscal.tariff) && fiscal.tariff >= 0;
          const ordinary = valid && fiscal!.guestTypeCode === 1 && cents(fiscal!.tariff!) === cents(policy!.nightlyRate) && cents(fiscal!.taxAmount!) === cents(policy!.nightlyRate) * fullTaxNights;
          const portal = valid && fiscal!.guestTypeCode === 14 && !!fiscal!.intermediary?.trim() && (fiscal!.taxAmount === 0 || cents(fiscal!.taxAmount!) === cents(fiscal!.tariff!) * fullTaxNights);
          const exempt = valid && [2, 9, 13].includes(fiscal!.guestTypeCode ?? -1) && fiscal!.taxAmount === 0 && fiscal!.tariff === 0;
          if (ordinary) { row.taxableGuestNights += taxableOverlap; row.managerCents += cents(policy!.nightlyRate) * taxableOverlap; row.exemptGuestNights += overlap - taxableOverlap; }
          else if (portal) { row.portalGuestNights += overlap; row.portalCents += fiscal!.taxAmount === 0 ? 0 : cents(fiscal!.tariff!) * taxableOverlap; }
          else if (exempt) row.exemptGuestNights += overlap;
          else { row.reviewGuestNights += overlap; if (policy) row.estimateCents += cents(policy.nightlyRate) * taxableOverlap; else row.estimateUnavailable = true; }
        }
        details.push({ bookingId: stay.id, month: month + 1, channel: stay.channel, nights: overlap, expectedGuests: slots, managerCents: row.managerCents - priorDue, reviewGuestNights: row.reviewGuestNights - priorReview });
      }
    }
    return { ...property, months, details };
  });
}
