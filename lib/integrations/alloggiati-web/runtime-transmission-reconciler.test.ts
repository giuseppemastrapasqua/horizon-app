import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const mocks = vi.hoisted(() => ({
  transmissionFindUnique: vi.fn(),
  bookingFindUnique: vi.fn(),
  getCredentials: vi.fn(),
  getReceipt: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    alloggiatiWebTransmission: {
      findUnique:
        mocks.transmissionFindUnique,
    },
    booking: {
      findUnique: mocks.bookingFindUnique,
    },
  },
}));

vi.mock(
  "./runtime-credential-provider",
  () => ({
    createRuntimeAlloggiatiWebCredentialProvider:
      () => ({
        getCredentials:
          mocks.getCredentials,
      }),
  }),
);

vi.mock(
  "./soap-preflight-transport",
  () => ({
    SoapPreflightAlloggiatiWebTransport:
      class {},
  }),
);

vi.mock("./adapter", () => ({
  AlloggiatiWebAdapter: class {
    async getReceipt(date: string) {
      return mocks.getReceipt(date);
    }
  },
}));

import {
  reconcileRuntimeAlloggiatiTransmission,
} from "./runtime-transmission-reconciler";

describe(
  "reconcileRuntimeAlloggiatiTransmission",
  () => {
    beforeEach(() => {
      vi.clearAllMocks();

      mocks.transmissionFindUnique
        .mockResolvedValue({
          id: "transmission-1",
          bookingId: "booking-1",
          propertyId: "property-1",
          status: "OUTCOME_UNKNOWN",
        });

      mocks.bookingFindUnique
        .mockResolvedValue({
          checkIn: new Date(
            "2026-09-01T00:00:00.000Z",
          ),
        });

      mocks.getCredentials
        .mockResolvedValue({
          username: "user",
          password: "password",
          wsKey: "wskey",
        });

      mocks.getReceipt.mockResolvedValue({
        date: "2026-09-01",
        pdfBase64: "JVBERi0xLjQ=",
      });
    });

    it(
      "recupera la Ricevuta usando il check-in della Booking",
      async () => {
        const result =
          await reconcileRuntimeAlloggiatiTransmission(
            "transmission-1",
          );

        expect(result.status).toBe(
          "RECEIPT_AVAILABLE",
        );

        expect(
          mocks.bookingFindUnique,
        ).toHaveBeenCalledWith({
          where: {
            id: "booking-1",
          },
          select: {
            checkIn: true,
          },
        });

        expect(
          mocks.getCredentials,
        ).toHaveBeenCalledWith({
          propertyId: "property-1",
        });

        expect(
          mocks.getReceipt,
        ).toHaveBeenCalledWith(
          "2026-09-01",
        );
      },
    );

    it(
      "gestisce transmission inesistente",
      async () => {
        mocks.transmissionFindUnique
          .mockResolvedValue(null);

        const result =
          await reconcileRuntimeAlloggiatiTransmission(
            "missing",
          );

        expect(result).toMatchObject({
          status: "CHECK_FAILED",
          transmissionId: "missing",
          message:
            "Transmission Alloggiati Web non trovata.",
        });

        expect(
          mocks.bookingFindUnique,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "non interroga la Ricevuta per stato non ambiguo",
      async () => {
        mocks.transmissionFindUnique
          .mockResolvedValue({
            id: "transmission-1",
            bookingId: "booking-1",
            propertyId: "property-1",
            status: "CONFIRMED",
          });

        const result =
          await reconcileRuntimeAlloggiatiTransmission(
            "transmission-1",
          );

        expect(result.status).toBe(
          "CHECK_FAILED",
        );

        expect(
          mocks.getCredentials,
        ).not.toHaveBeenCalled();

        expect(
          mocks.getReceipt,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "classifica errore Ricevuta senza ritentare Send",
      async () => {
        mocks.getReceipt.mockRejectedValue(
          new Error(
            "Timeout Alloggiati Web",
          ),
        );

        const result =
          await reconcileRuntimeAlloggiatiTransmission(
            "transmission-1",
          );

        expect(result).toMatchObject({
          status: "CHECK_FAILED",
          receiptDate: "2026-09-01",
          message:
            "Timeout Alloggiati Web",
        });

        expect(
          mocks.getReceipt,
        ).toHaveBeenCalledTimes(1);
      },
    );
  },
);