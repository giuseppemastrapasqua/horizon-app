import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const mocks = vi.hoisted(() => ({
  linkFindUnique: vi.fn(),
  currentLinkFindUnique: vi.fn(),
  guestCheckInLinkUpdateMany: vi.fn(),
  confirmedTransmissionFindFirst: vi.fn(),

  bookingGuestFindMany: vi.fn(),
  bookingGuestUpdate: vi.fn(),
  bookingGuestCreate: vi.fn(),
  bookingGuestDeleteMany: vi.fn(),

  fiscalFindUnique: vi.fn(),
  fiscalUpsert: vi.fn(),


  ross1000BookingDataUpsert: vi.fn(),
  transaction: vi.fn(),

  resolveCountryCode: vi.fn(),
  resolveMunicipalityCode: vi.fn(),
  resolveDocumentTypeCode: vi.fn(),
  isItaly: vi.fn(),
}));

const consumeRateLimitMock = vi.hoisted(() => vi.fn());
const createRateLimitKeyMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/security/rate-limiter", () => ({
  consumeRateLimit: consumeRateLimitMock,
  createRateLimitKey: createRateLimitKeyMock,
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
          resolveCountryCode:
            mocks.resolveCountryCode,
          resolveMunicipalityCode:
            mocks.resolveMunicipalityCode,
          resolveDocumentTypeCode:
            mocks.resolveDocumentTypeCode,
          isItaly: mocks.isItaly,
        };
      }
    },
  }),
);

vi.mock(
  "@/lib/integrations/alloggiati-web/validate-booking-guests",
  () => ({
    validateBookingGuestsForAlloggiati:
      vi.fn(() => ({
        ready: true,
      })),
  }),
);

import {
  saveGuestCheckInAction,
} from "./actions";

function validFormData() {
  const formData = new FormData();

  formData.set("language", "it");
  formData.set("token", "guest-token");
  formData.set("ross1000TourismType", "Culturale");
  formData.set("ross1000TransportType", "Auto");
  formData.set("ross1000RoomsOccupied", "1");

  formData.set(
    "guests.0.role",
    "SINGLE_GUEST",
  );
  formData.set(
    "guests.0.firstName",
    "Mario",
  );
  formData.set(
    "guests.0.lastName",
    "Rossi",
  );
  formData.set(
    "guests.0.gender",
    "MALE",
  );
  formData.set(
    "guests.0.birthDate",
    "1990-01-01",
  );
  formData.set(
    "guests.0.birthCountry",
    "USA",
  );
  formData.set(
    "guests.0.citizenship",
    "USA",
  );
  formData.set(
    "guests.0.residenceCountry",
    "ITALIA",
  );
  formData.set(
    "guests.0.residenceCity",
    "MILANO",
  );
  formData.set(
    "guests.0.residenceProvince",
    "MI",
  );
  formData.set(
    "guests.0.documentType",
    "PASSPORT",
  );
  formData.set(
    "guests.0.documentNumber",
    "TEST123",
  );
  formData.set(
    "guests.0.documentIssueCountry",
    "USA",
  );

  return formData;
}

describe(
  "saveGuestCheckInAction",
  () => {
    beforeEach(() => {
      vi.clearAllMocks();
      createRateLimitKeyMock.mockReturnValue(
        "guest-check-in:hashed-token",
      );
      consumeRateLimitMock.mockResolvedValue({
        allowed: true,
        remaining: 9,
        retryAfterSeconds: 0,
      });

      const expiresAt = new Date(
        Date.now() + 60 * 60 * 1000,
      );

      mocks.linkFindUnique.mockResolvedValue({
        expiresAt,
        revokedAt: null,
        booking: {
          id: "booking-1",
          property: {
            ross1000Property: null,
          },
          guests: 1,
          checkIn: new Date(
            "2026-09-16T00:00:00.000Z",
          ),
          checkOut: new Date(
            "2026-09-19T00:00:00.000Z",
          ),
        },
      });

      mocks.currentLinkFindUnique.mockResolvedValue({
        expiresAt,
        revokedAt: null,
        bookingId: "booking-1",
      });

      mocks.resolveCountryCode.mockResolvedValue(
        "US",
      );
      mocks.resolveMunicipalityCode.mockResolvedValue(
        "F205",
      );
      mocks.resolveDocumentTypeCode.mockResolvedValue(
        "PAS",
      );
      mocks.isItaly.mockImplementation(
        async (value: string) =>
          value === "ITALIA",
      );

      mocks.confirmedTransmissionFindFirst
        .mockResolvedValue(null);

      mocks.guestCheckInLinkUpdateMany
        .mockResolvedValue({
          count: 1,
        });

      mocks.bookingGuestFindMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          {
            id: "guest-1",
            birthDate: new Date(
              "1990-01-01T00:00:00.000Z",
            ),
            residenceCountry: "ITALIA",
            residenceCity: "MILANO",
            residenceProvince: "MI",
          },
        ]);

      mocks.bookingGuestCreate.mockResolvedValue({
        id: "guest-1",
      });

      mocks.fiscalFindUnique.mockResolvedValue(
        null,
      );

      mocks.fiscalUpsert.mockResolvedValue({
        id: "classification-1",
      });

      mocks.transaction.mockImplementation(
        async (callback) =>
          callback({
            guestCheckInLink: {
              findUnique:
                mocks.currentLinkFindUnique,
              updateMany:
                mocks.guestCheckInLinkUpdateMany,
            },
            alloggiatiWebTransmission: {
              findFirst:
                mocks.confirmedTransmissionFindFirst,
            },
            bookingGuest: {
              findMany:
                mocks.bookingGuestFindMany,
              update:
                mocks.bookingGuestUpdate,
              create:
                mocks.bookingGuestCreate,
              deleteMany:
                mocks.bookingGuestDeleteMany,
            },
            ross1000BookingData: {
              upsert: mocks.ross1000BookingDataUpsert,
            },
            soggiorniamoFiscalClassification: {
              findUnique:
                mocks.fiscalFindUnique,
              upsert:
                mocks.fiscalUpsert,
            },
          }),
      );
    });

    it.each([
      ["formato non canonico", "01/01/1990"],
      ["data inesistente", "1990-02-31"],
      ["data futura", "2999-01-01"],
    ])(
      "rifiuta la data di nascita: %s",
      async (_caseName, birthDate) => {
        const formData = validFormData();
        formData.set(
          "guests.0.birthDate",
          birthDate,
        );

        await expect(
          saveGuestCheckInAction(formData),
        ).rejects.toThrow();

        expect(
          mocks.transaction,
        ).not.toHaveBeenCalled();
        expect(
          mocks.bookingGuestCreate,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "richiede il comune di rilascio per un documento rilasciato in Italia",
      async () => {
        const formData = validFormData();
        formData.set(
          "guests.0.documentIssueCountry",
          "ITALIA",
        );

        await expect(
          saveGuestCheckInAction(formData),
        ).rejects.toThrow(
          "Per un documento rilasciato in Italia è obbligatorio il comune di rilascio.",
        );

        expect(
          mocks.transaction,
        ).not.toHaveBeenCalled();
        expect(
          mocks.bookingGuestCreate,
        ).not.toHaveBeenCalled();
      },
    );
    it(
      "blocca tentativi ripetuti prima del lookup del link",
      async () => {
        consumeRateLimitMock.mockResolvedValueOnce({
          allowed: false,
          remaining: 0,
          retryAfterSeconds: 300,
        });

        await expect(
          saveGuestCheckInAction(validFormData()),
        ).rejects.toThrow();

        expect(createRateLimitKeyMock).toHaveBeenCalledWith(
          "guest-check-in-submit",
          expect.any(String),
        );

        expect(consumeRateLimitMock).toHaveBeenCalledWith({
          key: "guest-check-in:hashed-token",
          limit: 10,
          windowSeconds: 15 * 60,
        });

        expect(mocks.linkFindUnique).not.toHaveBeenCalled();
        expect(mocks.transaction).not.toHaveBeenCalled();
      },
    );
    it(
      "salva gli ospiti, classifica Soggiorniamo e chiude il link",
      async () => {
        await expect(
          saveGuestCheckInAction(
            validFormData(),
          ),
        ).resolves.toEqual({
          success: true,
        });

        expect(
          mocks.bookingGuestCreate,
        ).toHaveBeenCalledTimes(1);

        expect(
          mocks.bookingGuestDeleteMany,
        ).toHaveBeenCalledWith({
          where: {
            bookingId: "booking-1",
            id: {
              notIn: ["guest-1"],
            },
          },
        });

        expect(
          mocks.fiscalFindUnique,
        ).toHaveBeenCalledWith({
          where: {
            bookingGuestId: "guest-1",
          },
          select: {
            bookingGuestId: true,
            source: true,
          },
        });

        expect(
          mocks.fiscalUpsert,
        ).toHaveBeenCalledTimes(1);

        expect(
          mocks.guestCheckInLinkUpdateMany,
        ).toHaveBeenCalledWith({
          where: {
            bookingId: "booking-1",
            tokenHash: expect.any(String),
            revokedAt: null,
            expiresAt: {
              gt: expect.any(Date),
            },
          },
          data: {
            revokedAt: expect.any(Date),
          },
        });
      },
    );

    it(
      "rifiuta il salvataggio se il link sicuro non può essere consumato",
      async () => {
        mocks.guestCheckInLinkUpdateMany
          .mockResolvedValue({
            count: 0,
          });

        await expect(
          saveGuestCheckInAction(
            validFormData(),
          ),
        ).rejects.toThrow();

        expect(
          mocks.guestCheckInLinkUpdateMany,
        ).toHaveBeenCalledWith({
          where: {
            bookingId: "booking-1",
            tokenHash: expect.any(String),
            revokedAt: null,
            expiresAt: {
              gt: expect.any(Date),
            },
          },
          data: {
            revokedAt: expect.any(Date),
          },
        });
      },
    );

    it(
      "mantiene lo stesso BookingGuest e preserva MANUAL",
      async () => {
        mocks.bookingGuestFindMany
          .mockReset()
          .mockResolvedValueOnce([
            {
              id: "guest-existing",
              firstName: "Mario",
              lastName: "Rossi",
              birthDate: new Date(
                "1990-01-01T00:00:00.000Z",
              ),
            },
          ])
          .mockResolvedValueOnce([
            {
              id: "guest-existing",
              birthDate: new Date(
                "1990-01-01T00:00:00.000Z",
              ),
              residenceCountry: "ITALIA",
              residenceCity: "MILANO",
              residenceProvince: "MI",
            },
          ]);

        mocks.fiscalFindUnique.mockResolvedValue({
          bookingGuestId:
            "guest-existing",
          source: "MANUAL",
        });

        await expect(
          saveGuestCheckInAction(
            validFormData(),
          ),
        ).resolves.toEqual({
          success: true,
        });

        expect(
          mocks.bookingGuestUpdate,
        ).toHaveBeenCalledWith({
          where: {
            id: "guest-existing",
          },
          data: expect.objectContaining({
            firstName: "Mario",
            lastName: "Rossi",
          }),
        });

        expect(
          mocks.bookingGuestCreate,
        ).not.toHaveBeenCalled();

        expect(
          mocks.fiscalUpsert,
        ).not.toHaveBeenCalled();

        expect(
          mocks.bookingGuestDeleteMany,
        ).toHaveBeenCalledWith({
          where: {
            bookingId: "booking-1",
            id: {
              notIn: [
                "guest-existing",
              ],
            },
          },
        });
      },
    );

    it(
      "sostituisce l'identità ospite se nome o data di nascita cambiano",
      async () => {
        mocks.bookingGuestFindMany
          .mockReset()
          .mockResolvedValueOnce([
            {
              id: "old-guest",
              firstName: "Luigi",
              lastName: "Bianchi",
              birthDate: new Date(
                "1980-01-01T00:00:00.000Z",
              ),
            },
          ])
          .mockResolvedValueOnce([
            {
              id: "new-guest",
              birthDate: new Date(
                "1990-01-01T00:00:00.000Z",
              ),
              residenceCountry: "ITALIA",
              residenceCity: "MILANO",
              residenceProvince: "MI",
            },
          ]);

        mocks.bookingGuestCreate.mockResolvedValue({
          id: "new-guest",
        });

        await expect(
          saveGuestCheckInAction(
            validFormData(),
          ),
        ).resolves.toEqual({
          success: true,
        });

        expect(
          mocks.bookingGuestUpdate,
        ).not.toHaveBeenCalled();

        expect(
          mocks.bookingGuestCreate,
        ).toHaveBeenCalledTimes(1);

        expect(
          mocks.bookingGuestDeleteMany,
        ).toHaveBeenCalledWith({
          where: {
            bookingId: "booking-1",
            id: {
              notIn: ["new-guest"],
            },
          },
        });
      },
    );

    it("consente la correzione dei dati dopo una trasmissione REJECTED", async () => {
      mocks.confirmedTransmissionFindFirst.mockResolvedValue(null);

      await expect(
        saveGuestCheckInAction(validFormData()),
      ).resolves.toEqual({
        success: true,
      });

      expect(mocks.confirmedTransmissionFindFirst).toHaveBeenCalledWith({
        where: {
          bookingId: "booking-1",
          status: {
            in: [
              "PREPARED",
              "SENDING",
              "CONFIRMED",
              "PARTIALLY_CONFIRMED",
              "OUTCOME_UNKNOWN",
            ],
          },
        },
        select: {
          id: true,
        },
      });
    });

    it.each([
      "PREPARED",
      "SENDING",
      "PARTIALLY_CONFIRMED",
      "OUTCOME_UNKNOWN",
    ])("blocca le modifiche se la trasmissione è %s", async (status) => {
      mocks.confirmedTransmissionFindFirst.mockResolvedValue({
        id: "transmission-1",
        status,
      });

      await expect(
        saveGuestCheckInAction(validFormData()),
      ).rejects.toThrow(
        "La schedina è già stata trasmessa ad Alloggiati Web e i dati non possono più essere modificati.",
      );

      expect(mocks.bookingGuestFindMany).not.toHaveBeenCalled();
      expect(mocks.bookingGuestUpdate).not.toHaveBeenCalled();
      expect(mocks.bookingGuestCreate).not.toHaveBeenCalled();
      expect(mocks.bookingGuestDeleteMany).not.toHaveBeenCalled();
      expect(mocks.fiscalUpsert).not.toHaveBeenCalled();
    });

    it.each([
      ["motivo soggiorno mancante", "ross1000TourismType", ""],
      ["mezzo di trasporto non valido", "ross1000TransportType", "TELETRASPORTO"],
      ["camere occupate zero", "ross1000RoomsOccupied", "0"],
      ["camere occupate oltre la capacità", "ross1000RoomsOccupied", "3"],
      ["camere occupate non intere", "ross1000RoomsOccupied", "1.5"],
    ])("rifiuta dati ROSS1000 mancanti o non validi: %s", async (_caseName, field, value) => {
      mocks.linkFindUnique.mockResolvedValue({
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        revokedAt: null,
        booking: {
          id: "booking-1",
          guests: 1,
          checkIn: new Date("2026-09-16T00:00:00.000Z"),
          checkOut: new Date("2026-09-19T00:00:00.000Z"),
          property: {
            ross1000Property: {
              id: "ross-property-1",
              roomsAvailable: 2,
            },
          },
        },
      });

      const formData = validFormData();
      formData.set(field, value);

      await expect(
        saveGuestCheckInAction(formData),
      ).rejects.toThrow();

      expect(mocks.transaction).not.toHaveBeenCalled();
      expect(mocks.ross1000BookingDataUpsert).not.toHaveBeenCalled();
      expect(mocks.bookingGuestCreate).not.toHaveBeenCalled();
    });
    it("salva motivo del soggiorno e mezzo di trasporto per una struttura ROSS1000", async () => {
      const currentLink = await mocks.linkFindUnique.mock.results[0]?.value;
      void currentLink;

      mocks.linkFindUnique.mockResolvedValue({
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        revokedAt: null,
        booking: {
          id: "booking-1",
          guests: 1,
          checkIn: new Date("2026-09-16T00:00:00.000Z"),
          checkOut: new Date("2026-09-19T00:00:00.000Z"),
          property: {
            ross1000Property: {
              id: "ross-property-1",
              roomsAvailable: 2,
            },
          },
        },
      });

      await expect(
        saveGuestCheckInAction(validFormData()),
      ).resolves.toEqual({
        success: true,
      });

      expect(
        mocks.ross1000BookingDataUpsert,
      ).toHaveBeenCalledWith({
        where: {
          bookingId: "booking-1",
        },
        create: {
          bookingId: "booking-1",
          tourismType: "Culturale",
          transportType: "Auto",
          roomsOccupied: 1,
        },
        update: {
          tourismType: "Culturale",
          transportType: "Auto",
          roomsOccupied: 1,
        },
      });
    });
    it(
      "blocca le modifiche se la schedina è già CONFIRMED",
      async () => {
        mocks.confirmedTransmissionFindFirst
          .mockResolvedValue({
            id: "transmission-1",
          });

        await expect(
          saveGuestCheckInAction(
            validFormData(),
          ),
        ).rejects.toThrow(
          "La schedina è già stata trasmessa ad Alloggiati Web e i dati non possono più essere modificati.",
        );

        expect(
          mocks.confirmedTransmissionFindFirst,
        ).toHaveBeenCalledWith({
          where: {
            bookingId: "booking-1",
            status: {
              in: [
                "PREPARED",
                "SENDING",
                "CONFIRMED",
                "PARTIALLY_CONFIRMED",
                "OUTCOME_UNKNOWN",
              ],
            },
          },
          select: {
            id: true,
          },
        });

        expect(
          mocks.bookingGuestFindMany,
        ).not.toHaveBeenCalled();

        expect(
          mocks.bookingGuestUpdate,
        ).not.toHaveBeenCalled();

        expect(
          mocks.bookingGuestCreate,
        ).not.toHaveBeenCalled();

        expect(
          mocks.bookingGuestDeleteMany,
        ).not.toHaveBeenCalled();

        expect(
          mocks.fiscalUpsert,
        ).not.toHaveBeenCalled();
      },
    );
  },
);

