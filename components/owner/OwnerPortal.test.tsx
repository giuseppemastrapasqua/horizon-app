import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  role: vi.fn(),
  scope: vi.fn(),
  bookings: vi.fn(),
  booking: vi.fn(),
  tasks: vi.fn(),
  reports: vi.fn(),
  documents: vi.fn(),
  propertyDocuments: vi.fn(),
}));
vi.mock("@/lib/auth/guards", () => ({
  requireRoles: mocks.role,
  getAccessiblePropertyIds: mocks.scope,
}));
vi.mock("@/components/Navigation", () => ({ Navigation: () => null }));
vi.mock("@/app/calendar/owner-personal-use-actions", () => ({
  reserveOwnerPersonalUse: vi.fn(),
  releaseOwnerPersonalUse: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("404");
  },
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    booking: { findMany: mocks.bookings, findFirst: mocks.booking },
    task: { findMany: mocks.tasks },
    financeReport: { findMany: mocks.reports },
    document: { findMany: mocks.documents },
    propertyDocument: { findMany: mocks.propertyDocuments },
  },
}));
import {
  OwnerBookingDetail,
  OwnerBookings,
  OwnerDocuments,
  OwnerTasks,
} from "./OwnerPortal";

describe("OWNER server data projections", () => {
  afterEach(() => vi.unstubAllGlobals());
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("React", React);
    mocks.role.mockResolvedValue({ id: "owner-1", role: "OWNER" });
    mocks.scope.mockResolvedValue(["owned-property"]);
    for (const query of [
      mocks.bookings,
      mocks.tasks,
      mocks.reports,
      mocks.documents,
      mocks.propertyDocuments,
    ])
      query.mockResolvedValue([]);
  });
  it("cannot replace the portfolio scope by choosing a foreign property", async () => {
    await OwnerBookings({ propertyId: "foreign-property" });
    expect(mocks.bookings.mock.calls[0][0].where).toEqual({
      propertyId: { in: ["owned-property"], equals: "foreign-property" },
    });
    expect(mocks.bookings.mock.calls[0][0].select).not.toHaveProperty(
      "guestName",
    );
    expect(mocks.bookings.mock.calls[0][0].select).not.toHaveProperty(
      "guestEmail",
    );
    expect(mocks.bookings.mock.calls[0][0].select).not.toHaveProperty(
      "internalNotes",
    );
  });
  it("combines owner scope with an overlapping stay period", async () => {
    await OwnerBookings({ propertyId: "owned-property", from: "2026-10-01", to: "2026-10-31" });
    expect(mocks.bookings.mock.calls[0][0].where).toEqual({ propertyId: { in: ["owned-property"], equals: "owned-property" }, checkOut: { gt: new Date("2026-10-01T00:00:00Z") }, checkIn: { lt: new Date("2026-11-01T00:00:00Z") } });
  });
  it("does not query bookings for an invalid period", async () => {
    await OwnerBookings({ from: "2026-10-31", to: "2026-10-01" });
    expect(mocks.bookings).not.toHaveBeenCalled();
  });
  it("returns 404 for a booking outside the OWNER portfolio", async () => {
    mocks.booking.mockResolvedValue(null);
    await expect(OwnerBookingDetail({ id: "foreign-booking" })).rejects.toThrow(
      "404",
    );
    expect(mocks.booking.mock.calls[0][0].where).toEqual({
      id: "foreign-booking",
      propertyId: { in: ["owned-property"] },
    });
  });
  it("filters operational tasks in the database and omits booking and staff relations", async () => {
    await OwnerTasks({});
    const query = mocks.tasks.mock.calls[0][0];
    expect(query.where).toMatchObject({
      propertyId: { in: ["owned-property"] },
      type: { in: ["MAINTENANCE", "ISSUE"] },
    });
    expect(query.select).not.toHaveProperty("booking");
    expect(query.select).not.toHaveProperty("owner");
    expect(query.select).not.toHaveProperty("description");
  });
  it("only loads published invoices and safe property attachments", async () => {
    await OwnerDocuments();
    expect(mocks.documents.mock.calls[0][0].where).toMatchObject({
      propertyId: { in: ["owned-property"] },
      status: { in: ["FINAL", "ISSUED"] },
    });
    expect(mocks.documents.mock.calls[0][0].select).not.toHaveProperty(
      "content",
    );
    expect(
      mocks.propertyDocuments.mock.calls[0][0].where.type.in,
    ).not.toContain("IDENTITY_DOCUMENT");
  });
  it("computes totals over the full authorized period excluding cancelled and technical rows", async () => {
    await OwnerBookings({ propertyId: "owned-property", from: "2026-10-01", to: "2026-10-31" });
    const summary=mocks.bookings.mock.calls[1][0];
    expect(summary.where.propertyId).toEqual({in:["owned-property"],equals:"owned-property"});
    expect(summary.where.bookingStatus).toEqual({not:"CANCELLED"});
    expect(summary.where.guestName).toEqual({not:"CLOSED"});
    expect(summary).not.toHaveProperty("take");
    expect(summary.select).not.toHaveProperty("guestEmail");
  });

});
