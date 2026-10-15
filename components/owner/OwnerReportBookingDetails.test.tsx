import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const query = vi.hoisted(() => vi.fn());
vi.mock("@/lib/prisma", () => ({ prisma: { booking: { findMany: query } } }));
import { OwnerReportBookingDetails } from "./OwnerReportBookingDetails";
import { createReportBookingSnapshot, readReportBookingSnapshot } from "@/lib/finance/report-booking-snapshot";
const booking = { id: "booking-own", checkIn: new Date("2026-09-29T00:00:00Z"), checkOut: new Date("2026-10-02T00:00:00Z"), nights: 3, guests: 2, channel: "BOOKING", currency: "EUR", grossAmount: 500 };
const props = { propertyId: "own-property", month: new Date("2026-10-01T00:00:00Z"), currency: "EUR", grossRevenue: 500 };
describe("OWNER report booking detail", () => {
  beforeEach(() => { vi.clearAllMocks(); vi.stubGlobal("React", React); query.mockResolvedValue([booking]); });
  afterEach(() => vi.unstubAllGlobals());
  it("uses immutable saved rows without reading live bookings", async () => {
    const breakdown = { grossBooking: 500, otaCommission: 50, cleaningCost: 60, grossProperty: 390, managementCommission: 78, managementCommissionTaxableBase: 78, managementCommissionVat: 17.16, managementCommissionTotal: 95.16, taxAmount: 0, otherAmount: null, netProperty: 294.84 };
    const saved = readReportBookingSnapshot({ bookingDetail: createReportBookingSnapshot([booking], [breakdown]) });
    const html = renderToStaticMarkup(await OwnerReportBookingDetails({ ...props, saved }));
    expect(query).not.toHaveBeenCalled();
    expect(html).toContain("Vedi calcolo salvato");
    expect(html).toContain("294,84");
  });
  it("scopes historical live references and labels a difference without changing saved totals", async () => {
    const html = renderToStaticMarkup(await OwnerReportBookingDetails({ ...props, grossRevenue: 600, saved: null }));
    expect(query.mock.calls[0][0].where.propertyId).toBe("own-property");
    expect(query.mock.calls[0][0].select).not.toHaveProperty("guestName");
    expect(html).toContain("dati attuali");
    expect(html).toContain("Differenza dal lordo salvato");
    expect(html).not.toContain("Vedi calcolo salvato");
  });
});
