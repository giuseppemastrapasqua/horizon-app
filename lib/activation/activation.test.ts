import { describe, expect, it } from "vitest";
import { activationSchema, initialConfig } from "./config";
import { addMonths, dayRange, romeToday } from "./dates";
import { projectStay } from "./finance";
import { buildActivationPrices } from "./pricing";

const config = () => initialConfig({ base: 120, baseGuests: 2, extraGuestFee: 20, cleaning: 60, management: 20, vat: 22, vatMode: "INCLUDED", minimumStay: 2, commissions: [{ channel: "BOOKING", percent: 25 }, { channel: "AIRBNB", percent: 16 }] });
const input = () => ({ config: config(), from: "2026-10-23", to: "2026-12-23", now: new Date("2026-10-23T10:00:00Z"), guests: 2, maxGuests: 4, stays: [], blocks: [], market: [] });
describe("activation pricing and launch", () => {
  it("covers the complete requested two-month period, DST included", () => {
    const rows = buildActivationPrices(input());
    expect(rows).toHaveLength(62);
    expect(rows[0].date).toBe("2026-10-23"); expect(rows.at(-1)?.date).toBe("2026-12-23");
    expect(new Set(rows.map((row) => row.date)).size).toBe(62);
    expect(dayRange("2026-10-23", "2026-12-21")).toHaveLength(60);
  });
  it("clamps month-end dates and uses the Italian local day", () => {
    expect(addMonths("2026-12-31", 2)).toBe("2027-02-28");
    expect(addMonths("2023-12-31", 2)).toBe("2024-02-29");
    expect(romeToday(new Date("2026-10-23T22:30:00Z"))).toBe("2026-10-24");
    expect(() => dayRange("2026-02-30", "2026-03-01")).toThrow();
  });
  it("applies launch only inside its period and protects the final minimum", () => {
    const data = input(); Object.assign(data.config, { launchStart: "2026-10-23", launchEnd: "2026-10-24", launchDiscount: 50, floor: 95, exitCriteria: "Rivedere al giorno 3" });
    const rows = buildActivationPrices(data);
    expect(rows[0].base).toBe(95); expect(rows[0].floorProtected).toBe(true);
    expect(rows[1].launch).toBe(true); expect(rows[2].launch).toBe(false); expect(rows[2].base).toBe(120);
  });
  it("respects base occupancy of four rather than charging supplements from guest three", () => {
    const data = input(); data.maxGuests = 8; data.guests = 4; data.config.baseGuests = 4;
    const base = buildActivationPrices(data)[0].base!;
    data.guests = 6; expect(buildActivationPrices(data)[0].base).toBe(base + 40);
  });
  it("reconstructs gross channel prices including promotion and preserves after-channel revenue", () => {
    const data = input(); data.config.channels[0].promotion = 10;
    const row = buildActivationPrices(data)[0], price = row.prices[0];
    expect(price.final! * 0.75).toBeCloseTo(row.base!, 1);
    expect(price.final).toBeCloseTo(price.list! * 0.9, 1);
    expect(price.net).toBeCloseTo(projectStay(data.config, row.base! * 2, 0).net, 1);
  });
  it("never supplies an actionable price for booked or blocked dates, checkout is free", () => {
    const data = { ...input(), stays: [{ checkIn: new Date("2026-10-23T00:00:00Z"), checkOut: new Date("2026-10-25T00:00:00Z"), bookedAt: null }], blocks: [{ startDate: new Date("2026-10-26T00:00:00Z"), endDate: new Date("2026-10-26T00:00:00Z") }] };
    const rows = buildActivationPrices(data);
    expect(rows[0].actionable).toBe(false); expect(rows[1].status).toBe("Prenotata"); expect(rows[2].actionable).toBe(true); expect(rows[3].status).toBe("Bloccata");
  });
  it("keeps missing base or commissions explicit and rejects unsafe configuration", () => {
    const data = input(); data.config.base = null; expect(buildActivationPrices(data)[0].prices[0].final).toBeNull();
    data.config.base = 120; data.config.channels[0].commission = null; expect(buildActivationPrices(data)[0].prices[0].final).toBeNull();
    data.config.launchDiscount = 10; expect(() => buildActivationPrices(data)).toThrow();
    expect(activationSchema.safeParse({ ...config(), ceiling: 80, floor: 100 }).success).toBe(false);
    expect(activationSchema.safeParse({ ...config(), channels: Array(4).fill(config().channels[0]) }).success).toBe(false);
  });
  it("deducts cleaning once, handles VAT modes, and never invents personal tax", () => {
    const settings = config();
    const result = projectStay(settings, 1000, 25);
    expect(result.net).toBe(552); // (1000 - 250 - 60) * 80%
    settings.vatMode = "EXCLUDED";
    expect(projectStay(settings, 1000, 25).net).toBe(521.64);
    settings.otherCosts = 600;
    expect(projectStay(settings, 1000, 25).net).toBeLessThan(0);
  });
});
