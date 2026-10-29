import { describe, expect, it } from "vitest";
import { createReportBookingSnapshot } from "./report-booking-snapshot";
import { buildPropertyMonthlyStatement, type StatementReport } from "./property-monthly-statement";

const booking = { id: "b1", externalBookingId: "6480809347", checkIn: new Date("2026-09-29"), checkOut: new Date("2026-10-02"), nights: 3, guests: 2, channel: "BOOKING", currency: "EUR" };
const breakdown = { grossBooking: 500, otaCommission: 100, cleaningCost: 50, grossProperty: 350, managementCommission: 70, managementCommissionTaxableBase: 70, managementCommissionVat: 15.4, managementCommissionTotal: 85.4, taxAmount: 55.566, otherAmount: null, netProperty: 209.034 };
export function statementFixture(): StatementReport {
  return {
    id: "report-1", referenceMonth: new Date("2026-10-01"), createdAt: new Date("2026-11-01"), currency: "EUR",
    grossRevenue: 500, finalAmount: 209.03,
    formulaSnapshot: { bookingDetail: createReportBookingSnapshot([booking], [breakdown]) },
    property: { name: "Immobile di prova", address: "Indirizzo sintetico", city: "Milano" },
    owner: { fullName: "Proprietario di prova" }, adjustments: [],
  };
}
describe("property monthly statement", () => {
  it("projects saved amounts to cents, includes VAT once and does not recalculate F24", () => {
    const result = buildPropertyMonthlyStatement(statementFixture());
    expect(result.rows[0]).toMatchObject({ reference: "6480809347", gross: 50000, otaNet: 40000, income: 26460, cleaning: 5000, managementBase: 7000, managementVat: 1540, management: 8540, f24: 5557, other: 0, net: 20903 });
    expect(result.totals.income).toBe(26460);
    expect(result.payable).toBe(20903);
    expect(result.incomplete).toBe(false);
  });
  it("adds signed adjustments to the saved balance", () => {
    const report = statementFixture(); report.adjustments = [{ description: "Acquisto phon", amount: -30 }, { description: "Rimborso", amount: 10 }];
    const result = buildPropertyMonthlyStatement(report);
    expect(result.adjustmentTotal).toBe(-2000); expect(result.payable).toBe(18903);
  });
  it("preserves original totals and exposes detail differences", () => {
    const report = statementFixture(); report.finalAmount = 220;
    const result = buildPropertyMonthlyStatement(report);
    expect(result.payable).toBe(22000); expect(result.difference).toBe(1097); expect(result.incomplete).toBe(true);
  });
  it("does not invent legacy booking rows, OTA or F24", () => {
    const result = buildPropertyMonthlyStatement({ ...statementFixture(), formulaSnapshot: {} });
    expect(result.rows).toEqual([]); expect(result.totals.f24).toBeNull(); expect(result.totals.otaNet).toBeNull();
    expect(result.payable).toBe(20903); expect(result.incomplete).toBe(true);
  });
  it("distinguishes a saved empty month from missing history", () => {
    const result = buildPropertyMonthlyStatement({ ...statementFixture(), grossRevenue: 0, finalAmount: 0, formulaSnapshot: { bookingDetail: createReportBookingSnapshot([], []) } });
    expect(result.totals.f24).toBe(0); expect(result.payable).toBe(0); expect(result.incomplete).toBe(false);
  });
  it("uses current references only when saved references are missing and never changes amounts", () => {
    const report = { ...statementFixture(), formulaSnapshot: { bookingDetail: createReportBookingSnapshot([{ ...booking, externalBookingId: null }], [breakdown]) } };
    const result = buildPropertyMonthlyStatement(report, [{ id: "b1", externalBookingId: "current-reference" }]);
    expect(result.rows[0].reference).toBe("current-reference"); expect(result.payable).toBe(20903);
    expect(result.warnings.join(" ")).toContain("anagrafica attuale");
    expect(buildPropertyMonthlyStatement(statementFixture(), [{ id: "b1", externalBookingId: "changed" }]).rows[0].reference).toBe("6480809347");
  });
  it("does not convert unknown tax or OTA amounts to zero", () => {
    const result = buildPropertyMonthlyStatement({ ...statementFixture(), formulaSnapshot: { bookingDetail: createReportBookingSnapshot([booking], [{ ...breakdown, taxAmount: null, otaCommission: null }]) } });
    expect(result.totals.income).toBeNull(); expect(result.rows[0].income).toBeNull(); expect(result.totals.f24).toBeNull(); expect(result.rows[0].otaNet).toBeNull(); expect(result.incomplete).toBe(true);
  });
  it("rejects corrupt snapshots and mixed currencies", () => {
    expect(() => buildPropertyMonthlyStatement({ ...statementFixture(), formulaSnapshot: { bookingDetail: { version: 9 } } })).toThrow();
    expect(() => buildPropertyMonthlyStatement({ ...statementFixture(), currency: "USD" })).toThrow("Valute");
  });
});
