import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  linkFindUnique: vi.fn(),
  currentLinkFindUnique: vi.fn(),
  guestCheckInLinkUpdateMany: vi.fn(),
  confirmedTransmissionFindFirst: vi.fn(),
  bookingGuestDeleteMany: vi.fn(),
  bookingGuestCreateMany: vi.fn(),
  transaction: vi.fn(),
  resolveCountryCode: vi.fn(),
  resolveMunicipalityCode: vi.fn(),
  resolveDocumentTypeCode: vi.fn(),
  isItaly: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    guestCheckInLink: {
      findUnique: mocks.linkFindUnique,
    },
    $transaction: mocks.transaction,
  },
}));

vi.mock(
  "@/lib/integrations/alloggiati-web/public-reference-provider",
  () => ({
    PublicAlloggiatiReferenceProvider: class {
      async getResolver() {
        return {
          resolveCountryCode: mocks.resolveCountryCode,
          resolveMunicipalityCode: mocks.resolveMunicipalityCode,
          resolveDocumentTypeCode: mocks.resolveDocumentTypeCode,
          isItaly: mocks.isItaly,
        };
      }
    },
  }),
);

vi.mock(
  "@/lib/integrations/alloggiati-web/validate-booking-guests",
  () => ({
    validateBookingGuestsForAlloggiati: vi.fn(() => ({
      ready: true,
    })),
  }),
);

import { saveGuestCheckInAction } from "./actions";

function validFormData() {
  const formData = new FormData();
  formData.set("language", "it");
  formData.set("token", "guest-token");
  formData.set("guests.0.role", "SINGLE_GUEST");
  formData.set("guests.0.firstName", "Mario");
  formData.set("guests.0.lastName", "Rossi");
  formData.set("guests.0.gender", "MALE");
  formData.set("guests.0.birthDate", "1990-01-01");
  formData.set("guests.0.birthCountry", "USA");
  formData.set("guests.0.citizenship", "USA");
  formData.set("guests.0.documentType", "PASSPORT");
  formData.set("guests.0.documentNumber", "TEST123");
  formData.set("guests.0.documentIssueCountry", "USA");
  return formData;
}

describe("saveGuestCheckInAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    mocks.linkFindUnique.mockResolvedValue({
      expiresAt,
      revokedAt: null,
      booking: {
        id: "booking-1",
        guests: 1,
      },
    });

    mocks.currentLinkFindUnique.mockResolvedValue({
      expiresAt,
      revokedAt: null,
      bookingId: "booking-1",
    });

    mocks.resolveCountryCode.mockResolvedValue("US");
    mocks.resolveMunicipalityCode.mockResolvedValue("001");
    mocks.resolveDocumentTypeCode.mockResolvedValue("PAS");
    mocks.isItaly.mockResolvedValue(false);

    mocks.transaction.mockImplementation(async (callback) =>
      callback({
        guestCheckInLink: {
          findUnique: mocks.currentLinkFindUnique,
          updateMany: mocks.guestCheckInLinkUpdateMany,
        },
        alloggiatiWebTransmission: {
          findFirst: mocks.confirmedTransmissionFindFirst,
        },
        bookingGuest: {
          deleteMany: mocks.bookingGuestDeleteMany,
          createMany: mocks.bookingGuestCreateMany,
        },
      }),
    );
  });

  it("salva gli ospiti e chiude automaticamente il link", async () => {
    mocks.confirmedTransmissionFindFirst.mockResolvedValue(null);

    await expect(
      saveGuestCheckInAction(validFormData()),
    ).resolves.toEqual({
      success: true,
    });

    expect(
      mocks.bookingGuestDeleteMany,
    ).toHaveBeenCalledWith({
      where: {
        bookingId: "booking-1",
      },
    });

    expect(
      mocks.bookingGuestCreateMany,
    ).toHaveBeenCalledTimes(1);

    expect(
      mocks.guestCheckInLinkUpdateMany,
    ).toHaveBeenCalledTimes(1);

    expect(
      mocks.guestCheckInLinkUpdateMany,
    ).toHaveBeenCalledWith({
      where: {
        bookingId: "booking-1",
        tokenHash: expect.any(String),
        revokedAt: null,
      },
      data: {
        revokedAt: expect.any(Date),
      },
    });
  });
  it("blocca le modifiche se la schedina è già CONFIRMED", async () => {
    mocks.confirmedTransmissionFindFirst.mockResolvedValue({
      id: "transmission-1",
    });

    await expect(
      saveGuestCheckInAction(validFormData()),
    ).rejects.toThrow(
      "La schedina è già stata trasmessa ad Alloggiati Web e i dati non possono più essere modificati.",
    );

    expect(
      mocks.confirmedTransmissionFindFirst,
    ).toHaveBeenCalledWith({
      where: {
        bookingId: "booking-1",
        status: "CONFIRMED",
      },
      select: { id: true },
    });

    expect(
      mocks.bookingGuestDeleteMany,
    ).not.toHaveBeenCalled();
    expect(
      mocks.bookingGuestCreateMany,
    ).not.toHaveBeenCalled();
  });
});
