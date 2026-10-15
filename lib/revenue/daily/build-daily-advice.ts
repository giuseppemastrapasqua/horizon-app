export type Stay = { checkIn: Date; checkOut: Date; bookedAt: Date | null };
export type Block = { startDate: Date; endDate: Date };
export type MarketDay = { date: Date; capturedAt: Date; provider: string; currency: string; marketMedianPrice: number | null; confidence: number | null };
export type DailyAdviceInput = {
  from: Date; to: Date; now: Date; baseForTwo: number | null;
  floor: number | null; ceiling: number | null; extraGuestFee: number;
  guests: number; maxGuests: number; calendarComplete?: boolean; stays: Stay[]; blocks: Block[]; market: MarketDay[];
};
const dayMs = 86400000;
const key = (date: Date) => date.toISOString().slice(0, 10);
const utc = (date: Date) => new Date(`${key(date)}T00:00:00Z`);
const money = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export function buildDailyAdvice(input: DailyAdviceInput) {
  const { from, to, now, floor, ceiling, extraGuestFee, guests, maxGuests } = input;
  if (to < from || (to.getTime() - from.getTime()) / dayMs > 92) throw new Error("Seleziona al massimo 93 notti, in ordine cronologico.");
  if (!Number.isInteger(guests) || guests < 1 || guests > maxGuests) throw new Error("Numero ospiti non valido.");
  for (const value of [input.baseForTwo, floor, ceiling]) if (value !== null && (!Number.isFinite(value) || value <= 0)) throw new Error("Tariffe e limiti devono essere maggiori di zero.");
  if (!Number.isFinite(extraGuestFee) || extraGuestFee < 0 || (floor !== null && ceiling !== null && ceiling < floor)) throw new Error("Supplemento o limiti tariffari non validi.");
  const hasStay = (time: number) => input.stays.some((stay) => stay.checkIn.getTime() <= time && stay.checkOut.getTime() > time);
  const hasBlock = (time: number) => input.blocks.some((block) => block.startDate.getTime() <= time && utc(block.endDate).getTime() >= time);
  const occupied = (time: number) => hasStay(time) || hasBlock(time);
  const today = utc(now).getTime();
  const pickup = input.stays.filter((stay) => stay.bookedAt && stay.bookedAt.getTime() >= now.getTime() - 7 * dayMs && stay.bookedAt <= now && stay.checkOut.getTime() > today).length;
  const rows = [];
  for (let time = from.getTime(); time <= to.getTime(); time += dayMs) {
    const date = new Date(time);
    const lead = Math.floor((time - today) / dayMs);
    let bookedNights = 0, blockedNights = 0;
    for (let offset = 0; offset < 30; offset++) {
      const night = time + offset * dayMs;
      if (hasStay(night)) bookedNights++;
      else if (hasBlock(night)) blockedNights++;
    }
    const occupancy = Math.round(bookedNights / 30 * 100);
    const market = input.market.filter((item) => key(item.date) === key(date) && !["LOCAL", "MOCK"].includes(item.provider.toUpperCase()) && item.currency === "EUR" && item.marketMedianPrice !== null && Number.isFinite(item.marketMedianPrice) && item.marketMedianPrice > 0 && (item.confidence ?? 0) >= 60 && item.capturedAt <= now && now.getTime() - item.capturedAt.getTime() <= 72 * 3600000).sort((a, b) => b.capturedAt.getTime() - a.capturedAt.getTime())[0];
    const factors: { label: string; percent: number }[] = [];
    // Initial internal policy: explicit heuristics, not learned market predictions.
    if ([5, 6].includes(date.getUTCDay())) factors.push({ label: "Venerdì / sabato", percent: 8 });
    if (occupancy >= 80) factors.push({ label: "Occupazione prenotata nei 30 giorni: alta", percent: 8 });
    else if (occupancy >= 60) factors.push({ label: "Occupazione prenotata nei 30 giorni", percent: 3 });
    else if (occupancy < 35 && blockedNights === 0 && input.calendarComplete) factors.push({ label: "Occupazione prenotata nei 30 giorni: bassa", percent: -4 });
    if (lead >= 0 && lead <= 7 && occupancy < 60 && blockedNights === 0 && input.calendarComplete) factors.push({ label: "Arrivo entro 7 giorni e occupazione bassa", percent: -5 });
    if (input.calendarComplete && !occupied(time) && occupied(time - dayMs) && occupied(time + dayMs)) factors.push({ label: "Una notte libera tra due indisponibilità", percent: -5 });
    if (pickup >= 3) factors.push({ label: "Almeno 3 prenotazioni recenti con data di prenotazione nota", percent: 3 });
    const adjustment = Math.max(-20, Math.min(20, factors.reduce((sum, factor) => sum + factor.percent, 0)));
    // Market occupancy basis is not verified for two guests: display provenance, never blend its price.
    const reference = input.baseForTwo;
    const raw = reference === null ? null : money(reference * (1 + adjustment / 100));
    const base = raw === null ? null : money(Math.min(ceiling ?? Infinity, Math.max(floor ?? 0, raw)));
    const status = lead < 0 ? "Passata" : hasStay(time) ? "Prenotata" : hasBlock(time) ? "Bloccata" : "Libera";
    rows.push({ date: key(date), status, occupancy, blockedNights, lead, pickup, factors, adjustment, base, selectedPrice: base === null ? null : money(base + Math.max(0, guests - 2) * extraGuestFee), marketProvider: market?.provider ?? null, marketCapturedAt: market?.capturedAt.toISOString() ?? null, limited: base !== raw, confidence: reference === null ? "Non disponibile" : "Bassa: stima interna" });
  }
  return rows;
}
