import { describe, expect, it } from "vitest";
import { buildMonthlyTaxReport, type TaxStay } from "./build-monthly-report";
const date = (day: string) => new Date(`${day}T00:00:00Z`);
const property = [{ id: "p", name: "Milano", city: "Milano" }];
const stay = (overrides: Partial<TaxStay> = {}): TaxStay => ({ id: "b", propertyId: "p", checkIn: date("2026-09-29"), checkOut: date("2026-10-03"), guests: 1, channel: "BOOKING", classifications: [{ status: "CLASSIFIED", guestTypeCode: 1, tariff: 9.5, taxAmount: 38, intermediary: null }], ...overrides });
describe("monthly tourist tax", () => {
  it("allocates actual nights to each month, excludes checkout and conserves cents", () => {
    const { months } = buildMonthlyTaxReport(2026, property, [stay()])[0];
    expect(months[8].managerCents).toBe(1900);
    expect(months[9].managerCents).toBe(1900);
    expect(months.reduce((sum, month) => sum + month.managerCents, 0)).toBe(3800);
  });
  it("does not reset the 14-night cap at month boundaries", () => {
    const { months } = buildMonthlyTaxReport(2026, property, [stay({ checkIn: date("2026-09-20"), checkOut: date("2026-10-10"), classifications: [{ status: "CLASSIFIED", guestTypeCode: 1, tariff: 9.5, taxAmount: 133, intermediary: null }] })])[0];
    expect(months[8].managerCents).toBe(10450);
    expect(months[9].managerCents).toBe(2850);
    expect(months[9].exemptGuestNights).toBe(6);
  });
  it("never treats absent guest data as exempt or a complete zero balance", () => {
    const october = buildMonthlyTaxReport(2026, property, [stay({ guests: 2, classifications: [] })])[0].months[9];
    expect(october.managerCents).toBe(0);
    expect(october.reviewGuestNights).toBe(4);
    expect(october.guestCount).toBe(2);
    expect(october.estimateCents).toBe(3800);
  });
  it("separates documented portal classifications without inferring handling from channel", () => {
    const portal = stay({ classifications: [{ status: "CLASSIFIED", guestTypeCode: 14, tariff: 9.5, taxAmount: 38, intermediary: "Airbnb" }] });
    const october = buildMonthlyTaxReport(2026, property, [portal])[0].months[9];
    expect(october.portalCents).toBe(1900);
    expect(october.managerCents).toBe(0);
    expect(buildMonthlyTaxReport(2026, property, [stay({ channel: "AIRBNB" })])[0].months[9].managerCents).toBe(1900);
  });
  it("accepts recorded exemptions but rejects inconsistent ordinary totals", () => {
    const exempt = stay({ classifications: [{ status: "CLASSIFIED", guestTypeCode: 2, tariff: 0, taxAmount: 0, intermediary: null }] });
    expect(buildMonthlyTaxReport(2026, property, [exempt])[0].months[9].exemptGuestNights).toBe(2);
    const invalid = stay({ classifications: [{ status: "CLASSIFIED", guestTypeCode: 1, tariff: 9.5, taxAmount: 1, intermediary: null }] });
    expect(buildMonthlyTaxReport(2026, property, [invalid])[0].months[9].reviewGuestNights).toBe(2);
  });
  it("marks unsupported years and municipalities for review", () => {
    const report = buildMonthlyTaxReport(2026, [{ ...property[0], city: "Como" }], [stay()])[0];
    expect(report.months[9].estimateUnavailable).toBe(true);
    expect(report.months[9].managerCents).toBe(0);
    const future = stay({ checkIn: date("2027-01-01"), checkOut: date("2027-01-03") });
    expect(buildMonthlyTaxReport(2027, property, [future])[0].months[0].reviewGuestNights).toBe(2);
  });
});
