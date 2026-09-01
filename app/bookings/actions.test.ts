import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const requireUserMock = vi.hoisted(() =>
  vi.fn(),
);

const requirePropertyAccessMock = vi.hoisted(() =>
  vi.fn(),
);

const requirePropertyRoleMock = vi.hoisted(() =>
  vi.fn(),
);

const propertyFindUniqueMock = vi.hoisted(() =>
  vi.fn(),
);

const bookingFindUniqueMock = vi.hoisted(() =>
  vi.fn(),
);

vi.mock("@/lib/auth/guards", () => ({
  requireUser: requireUserMock,
  requirePropertyAccess: requirePropertyAccessMock,
  requirePropertyRole: requirePropertyRoleMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    property: {
      findUnique: propertyFindUniqueMock,
    },
    booking: {
      findUnique: bookingFindUniqueMock,
    },
  },
}));

vi.mock("@/lib/events/emit", () => ({
  emitEvent: vi.fn(),
}));

vi.mock("@/lib/events/process-pending", () => ({
  processPendingEvents: vi.fn(),
}));

vi.mock("@/services/audit/AuditService", () => ({
  AuditService: {
    log: vi.fn(),
  },
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

import {
  createBooking,
  setBookingOperationalStatus,
} from "./actions";

describe("booking permissions", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    requireUserMock.mockResolvedValue({
      id: "user-1",
    });

    requirePropertyRoleMock.mockResolvedValue({
      id: "user-1",
    });

    requirePropertyAccessMock.mockResolvedValue({
      id: "user-1",
    });
  });

  it("richiede OWNER o MANAGER per creare una prenotazione", async () => {
    const formData = new FormData();

    formData.set("propertyId", "property-1");
    formData.set("guestName", "Mario Rossi");

    propertyFindUniqueMock.mockResolvedValue(null);

    await expect(
      createBooking(formData),
    ).rejects.toThrow(
      "Immobile non trovato.",
    );

    expect(
      requirePropertyRoleMock,
    ).toHaveBeenCalledWith(
      "property-1",
      ["OWNER", "MANAGER"],
    );

    expect(
      requirePropertyAccessMock,
    ).not.toHaveBeenCalled();
  });

  it("mantiene l'accesso operativo per aggiornare lo stato", async () => {
    bookingFindUniqueMock.mockResolvedValue({
      propertyId: "property-1",
    });

    await expect(
      setBookingOperationalStatus(
        "booking-1",
        "OK",
      ),
    ).rejects.toThrow();

    expect(
      requirePropertyAccessMock,
    ).toHaveBeenCalledWith(
      "property-1",
    );

    expect(
      requirePropertyRoleMock,
    ).not.toHaveBeenCalled();
  });
});