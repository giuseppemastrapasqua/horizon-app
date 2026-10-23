import { buildDailyAdvice, type Stay, type Block, type MarketDay } from "@/lib/revenue/daily/build-daily-advice";
import { activationSchema, type ActivationConfig } from "./config";
import { dayRange, parseDay, romeToday } from "./dates";
import { money, projectStay } from "./finance";

export function launchForDate(config: ActivationConfig, date: string) {
  return Boolean(config.launchStart && date >= config.launchStart && date <= config.launchEnd);
}
export function buildActivationPrices(input: { config: ActivationConfig; from: string; to: string; guests: number; maxGuests: number; now?: Date; stays: Stay[]; blocks: Block[]; market: MarketDay[] }) {
  const config = activationSchema.parse(input.config);
  dayRange(input.from, input.to);
  if (config.baseGuests > input.maxGuests) throw new Error("Gli ospiti inclusi superano la capienza.");
  if (!Number.isInteger(input.guests) || input.guests < 1 || input.guests > input.maxGuests) throw new Error("Numero ospiti non valido.");
  const now = input.now ?? new Date();
  const rows = buildDailyAdvice({ from: parseDay(input.from), to: parseDay(input.to), now, today: romeToday(now), baseForTwo: config.base,
    floor: null, ceiling: null, extraGuestFee: 0, guests: Math.min(2, input.maxGuests), maxGuests: input.maxGuests,
    calendarComplete: config.calendarComplete && config.checks.calendar, stays: input.stays, blocks: input.blocks, market: input.market });
  const extra = Math.max(0, input.guests - config.baseGuests) * config.extraGuestFee;
  return rows.map((row) => {
    const launch = launchForDate(config, row.date);
    const discount = launch ? config.launchDiscount : 0;
    // Base/floor/ceiling are all final nightly amounts, incl. cleaning, at base occupancy, before channel markup.
    const launchBase = row.base === null ? null : row.base * (1 - discount / 100);
    const base = launchBase === null ? null : money(Math.min(config.ceiling ?? Infinity, Math.max(config.floor ?? 0, launchBase)));
    const finalBase = base === null ? null : money(base + extra);
    const prices = config.channels.filter((channel) => channel.enabled).map((channel) => {
      if (finalBase === null || channel.commission === null) return { code: channel.code, list: null, final: null, net: null, promotion: channel.promotion, verified: channel.promotionsVerified };
      // Markup preserves the same after-channel amount. Configured promotions stack multiplicatively with the launch adjustment.
      const list = Math.ceil(finalBase / (1 - channel.commission / 100) / (1 - channel.promotion / 100) * 100) / 100;
      const final = money(list * (1 - channel.promotion / 100));
      const net = projectStay(config, final * config.minimumStay, channel.commission).net;
      return { code: channel.code, list, final, net, promotion: channel.promotion, verified: channel.promotionsVerified };
    });
    return { ...row, base: finalBase, launch, launchDiscount: discount, floorProtected: launchBase !== null && launchBase < (config.floor ?? 0), prices, actionable: row.status === "Libera", rationale: [...row.factors.map((factor) => `${factor.label}: ${factor.percent > 0 ? "+" : ""}${factor.percent}%`), ...(launch ? [`Lancio: −${discount}% prima della protezione soglia`] : []), "Stima interna; eventi e competitor non verificati esclusi"] };
  });
}
export type ActivationPrice = ReturnType<typeof buildActivationPrices>[number];
