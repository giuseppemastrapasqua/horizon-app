import { beforeEach, describe, expect, it, vi } from "vitest";
import { createReportBookingSnapshot } from "@/lib/finance/report-booking-snapshot";
const mocks = vi.hoisted(() => ({
  user: vi.fn(),
  access: vi.fn(),
  report: vi.fn(),
  bookings: vi.fn(),
  template: vi.fn(),
  pdf: vi.fn(),
  commissions: vi.fn(),
  breakdown: vi.fn(),
}));
vi.mock("@/lib/auth/guards", () => ({
  requireUser: mocks.user,
  requirePropertyAccess: mocks.access,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    financeReport: { findUnique: mocks.report },
    booking: { findMany: mocks.bookings },
    financeReportTemplate: { findFirst: mocks.template },
  },
}));
vi.mock("@/lib/pdf/finance-report", () => ({
  buildFinanceReportPdf: mocks.pdf,
}));
vi.mock("@/lib/finance/get-property-ota-commissions", () => ({
  getPropertyOtaCommissionByChannel: mocks.commissions,
  resolveOtaCommissionPercent: vi.fn(),
}));
vi.mock("@/lib/finance/calculations/build-booking-finance-breakdown", () => ({
  buildBookingFinanceBreakdown: mocks.breakdown,
}));
import { GET } from "./route";
const context = { params: Promise.resolve({ reportId: "report-1" }) };
function report(snapshot: unknown) {
  return {
    id: "report-1",
    title: "Saved report",
    referenceMonth: new Date("2026-10-01T00:00:00Z"),
    currency: "EUR",
    grossRevenue: 500,
    finalAmount: 245.7,
    formulaId: null,
    formulaName: "Horizon Standard",
    formulaSnapshot: snapshot,
    createdAt: new Date("2026-10-11"),
    adjustments: [],
    rules: [],
    createdBy: null,
    owner: { fullName: "Owner", email: null, phone: null },
    property: {
      id: "own",
      name: "Property",
      address: "Address",
      city: "City",
      zone: null,
      cleaningCost: 999,
      propertyManagementCommissionPercent: 99,
      propertyManagementCommissionVatPercent: 99,
      propertyManagementCommissionVatMode: "EXCLUDED",
    },
  };
}
describe("saved report PDF", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.user.mockResolvedValue({ id: "owner-1", role: "OWNER" });
    mocks.access.mockResolvedValue({ id: "owner-1" });
    mocks.template.mockResolvedValue(null);
    mocks.commissions.mockResolvedValue(new Map());
    mocks.pdf.mockResolvedValue(new Uint8Array([1, 2, 3]));
  });
  it("uses saved anonymous booking figures after current settings change", async () => {
    const detail = createReportBookingSnapshot(
      [
        {
          id: "booking-1",
          checkIn: new Date("2026-09-29"),
          checkOut: new Date("2026-10-02"),
          nights: 3,
          guests: 2,
          channel: "DIRECT",
          currency: "EUR",
        },
      ],
      [
        {
          grossBooking: 500,
          otaCommission: 0,
          cleaningCost: 50,
          grossProperty: 450,
          managementCommission: 90,
          managementCommissionTaxableBase: 90,
          managementCommissionVat: 19.8,
          managementCommissionTotal: 109.8,
          taxAmount: 94.5,
          otherAmount: null,
          netProperty: 245.7,
        },
      ],
    );
    mocks.report.mockResolvedValue(report({ bookingDetail: detail }));
    expect(
      (
        await GET(
          new Request("https://example.test/reports/monthly/report-1/pdf"),
          context,
        )
      ).status,
    ).toBe(200);
    const input = mocks.pdf.mock.calls[0][0];
    expect(input.bookings[0]).toMatchObject({
      cleaningCost: 50,
      netProperty: 245.7,
      guestName: "Prenotazione OOKING-1",
    });
    expect(mocks.bookings).not.toHaveBeenCalled();
    expect(mocks.breakdown).not.toHaveBeenCalled();
    expect(mocks.commissions).not.toHaveBeenCalled();
  });
  it("does not reconstruct legacy OWNER detail from live guest data", async () => {
    mocks.report.mockResolvedValue(report({ type: "HORIZON_STANDARD" }));
    await GET(
      new Request("https://example.test/reports/monthly/report-1/pdf"),
      context,
    );
    expect(mocks.bookings).not.toHaveBeenCalled();
    expect(mocks.pdf.mock.calls[0][0].bookings).toEqual([]);
    expect(mocks.pdf.mock.calls[0][0].template.showBookingDetails).toBe(false);
  });
  it("denies OPERATOR before loading a report", async () => {
    mocks.user.mockResolvedValue({ id: "operator", role: "OPERATOR" });
    expect(
      (
        await GET(
          new Request("https://example.test/reports/monthly/report-1/pdf"),
          context,
        )
      ).status,
    ).toBe(403);
    expect(mocks.report).not.toHaveBeenCalled();
  });
  it("checks property authorization before producing the PDF", async () => {
    mocks.report.mockResolvedValue(report({ type: "HORIZON_STANDARD" }));
    mocks.access.mockRejectedValue(new Error("foreign property"));
    await expect(
      GET(
        new Request("https://example.test/reports/monthly/report-1/pdf"),
        context,
      ),
    ).rejects.toThrow("foreign property");
    expect(mocks.pdf).not.toHaveBeenCalled();
  });
});
