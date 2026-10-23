import { describe, expect, it } from "vitest";
import { automaticMovements, automaticTotals, readInvoice, readOwnerAmounts, type AutomaticAccounting } from "./automatic";
import { calculateAccounting } from "./calculate";
import { initialAccounting } from "./config";

const source: AutomaticAccounting = { loadedAt: "2026-10-23T12:00:00Z", warnings: [], invoices: [{ id: "invoice", propertyName: "Test", month: "2026-10", status: "DRAFT", base: 200_00, vat: 44_00, total: 244_00 }],
  reports: [{ id: "report", propertyId: "p", propertyName: "Test", month: "2026-10", gross: 1_000_00, ownerNet: 500_00, ota: 200_00, f24: 50_00, cleaning: 50_00 }], cleaning: [{ id: "b", propertyName: "Test", date: "2026-10-23", amount: 50_00 }] };

describe("automatic accounting", () => {
  it("shows owner gross, OTA and F24 without deducting them again from invoice compensation", () => {
    const totals = automaticTotals(source);
    expect(totals).toMatchObject({ gross: 1_000_00, compensation: 200_00, invoiceVat: 44_00, ota: 200_00, f24: 50_00, collaborators: 50_00, draftTotal: 200_00 });
    const result = calculateAccounting({ ...initialAccounting, fiscalConfirmed: true, contributionEstimate: 0, movements: automaticMovements(source, 2026) }, 2026);
    expect(result.income).toBe(200_00); expect(result.expenses).toBe(50_00); expect(result.taxesPaid).toBe(0);
    expect(result.net).toBe(138_00);
  });
  it("uses invoice snapshot amounts and keeps invoice VAT separate", () => {
    expect(readInvoice({ kind: "COMMISSION_INVOICE", commission: { taxableBase: 100.01, vat: 22, total: 122.01, currency: "EUR" } })).toEqual({ base: 10001, vat: 2200, total: 12201 });
    expect(readInvoice({ kind: "COMMISSION_INVOICE", commission: { taxableBase: 100, vat: 0, total: 100, currency: "USD" } })).toBeNull();
  });
  it("reads saved per-booking amounts, ignoring current settings and report rules", () => {
    const b = { id: "b", checkIn: "2026-10-01T00:00:00Z", checkOut: "2026-10-03T00:00:00Z", nights: 2, guests: 2, channel: "BOOKING", currency: "EUR", breakdown: { grossBooking: 100, otaCommission: 20, cleaningCost: 10, grossProperty: 70, managementCommission: 14, managementCommissionTaxableBase: 14, managementCommissionVat: 0, managementCommissionTotal: 14, taxAmount: 11.76, otherAmount: 0, netProperty: 44.24 } };
    expect(readOwnerAmounts({ bookingDetail: { version: 1, bookings: [b] } }, [{ category: "OTA_COMMISSION", operation: "SUBTRACT", calculatedAmount: 999 }])).toEqual({ ota: 2000, f24: 1176, cleaning: 1000 });
  });
  it("uses signed saved rule categories for legacy reports and flags missing data", () => {
    expect(readOwnerAmounts({}, [{ category: "OTA_COMMISSION", operation: "SUBTRACT", calculatedAmount: 20 }, { category: "OTA_COMMISSION", operation: "ADD", calculatedAmount: 2 }])).toEqual({ ota: 1800, f24: null, cleaning: null });
    expect(automaticTotals({ ...source, reports: [{ ...source.reports[0], ota: null }] }).ota).toBeNull();
  });
});
