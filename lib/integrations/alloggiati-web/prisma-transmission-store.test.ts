import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const upsertMock = vi.hoisted(() =>
  vi.fn(),
);

const updateManyMock = vi.hoisted(() =>
  vi.fn(),
);

vi.mock("@/lib/prisma", () => ({
  prisma: {
    alloggiatiWebTransmission: {
      upsert: upsertMock,
      updateMany: updateManyMock,
    },
  },
}));

import {
  PrismaAlloggiatiTransmissionStore,
} from "./prisma-transmission-store";

describe(
  "PrismaAlloggiatiTransmissionStore",
  () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it(
      "prepara una transmission deduplicata per booking e payload",
      async () => {
        const record = {
          id: "transmission-1",
          status: "PREPARED",
        };

        upsertMock.mockResolvedValue(record);

        const store =
          new PrismaAlloggiatiTransmissionStore();

        await expect(
          store.prepare({
            bookingId: "booking-1",
            propertyId: "property-1",
            apartmentId: "123",
            payloadHash: "hash-1",
            recordsCount: 2,
          }),
        ).resolves.toEqual(record);

        expect(
          upsertMock,
        ).toHaveBeenCalledWith({
          where: {
            bookingId_payloadHash: {
              bookingId: "booking-1",
              payloadHash: "hash-1",
            },
          },
          create: {
            bookingId: "booking-1",
            propertyId: "property-1",
            apartmentId: "123",
            payloadHash: "hash-1",
            recordsCount: 2,
          },
          update: {},
        });
      },
    );

    it(
      "porta PREPARED a SENDING atomicamente",
      async () => {
        updateManyMock.mockResolvedValue({
          count: 1,
        });

        const store =
          new PrismaAlloggiatiTransmissionStore();

        await expect(
          store.beginSending(
            "transmission-1",
          ),
        ).resolves.toBe(true);

        expect(
          updateManyMock,
        ).toHaveBeenCalledWith({
          where: {
            id: "transmission-1",
            status: "PREPARED",
          },
          data: {
            status: "SENDING",
            sendStartedAt:
              expect.any(Date),
          },
        });
      },
    );

    it(
      "rifiuta beginSending se la transmission non e PREPARED",
      async () => {
        updateManyMock.mockResolvedValue({
          count: 0,
        });

        const store =
          new PrismaAlloggiatiTransmissionStore();

        await expect(
          store.beginSending(
            "transmission-1",
          ),
        ).resolves.toBe(false);
      },
    );

    it(
      "conferma quando tutti i record sono accettati",
      async () => {
        updateManyMock.mockResolvedValueOnce({
          count: 1,
        });

        const store =
          new PrismaAlloggiatiTransmissionStore();

        await expect(
          store.recordAcceptedRecords(
            "transmission-1",
            2,
          ),
        ).resolves.toBe(true);

        expect(
          updateManyMock,
        ).toHaveBeenCalledTimes(1);

        expect(
          updateManyMock,
        ).toHaveBeenCalledWith({
          where: {
            id: "transmission-1",
            status: "SENDING",
            recordsCount: 2,
          },
          data: {
            status: "CONFIRMED",
            acceptedRecords: 2,
            confirmedAt:
              expect.any(Date),
            lastError: null,
          },
        });
      },
    );

    it(
      "marca PARTIALLY_CONFIRMED quando solo parte dei record e accettata",
      async () => {
        updateManyMock
          .mockResolvedValueOnce({
            count: 0,
          })
          .mockResolvedValueOnce({
            count: 1,
          });

        const store =
          new PrismaAlloggiatiTransmissionStore();

        await expect(
          store.recordAcceptedRecords(
            "transmission-1",
            1,
          ),
        ).resolves.toBe(true);

        expect(
          updateManyMock,
        ).toHaveBeenNthCalledWith(
          2,
          {
            where: {
              id: "transmission-1",
              status: "SENDING",
              recordsCount: {
                gt: 1,
              },
            },
            data: {
              status:
                "PARTIALLY_CONFIRMED",
              acceptedRecords: 1,
              partiallyConfirmedAt:
                expect.any(Date),
              lastError: null,
            },
          },
        );
      },
    );

    it(
      "rifiuta un numero di record accettati non valido",
      async () => {
        const store =
          new PrismaAlloggiatiTransmissionStore();

        await expect(
          store.recordAcceptedRecords(
            "transmission-1",
            0,
          ),
        ).resolves.toBe(false);

        await expect(
          store.recordAcceptedRecords(
            "transmission-1",
            -1,
          ),
        ).resolves.toBe(false);

        await expect(
          store.recordAcceptedRecords(
            "transmission-1",
            1.5,
          ),
        ).resolves.toBe(false);

        expect(
          updateManyMock,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "non conferma se acceptedRecords supera recordsCount",
      async () => {
        updateManyMock
          .mockResolvedValueOnce({
            count: 0,
          })
          .mockResolvedValueOnce({
            count: 0,
          });

        const store =
          new PrismaAlloggiatiTransmissionStore();

        await expect(
          store.recordAcceptedRecords(
            "transmission-1",
            3,
          ),
        ).resolves.toBe(false);

        expect(
          updateManyMock,
        ).toHaveBeenCalledTimes(2);
      },
    );

    it(
      "marca REJECTED solo da SENDING",
      async () => {
        updateManyMock.mockResolvedValue({
          count: 1,
        });

        const store =
          new PrismaAlloggiatiTransmissionStore();

        await expect(
          store.markRejected(
            "transmission-1",
            "Invio rifiutato.",
          ),
        ).resolves.toBe(true);

        expect(
          updateManyMock,
        ).toHaveBeenCalledWith({
          where: {
            id: "transmission-1",
            status: "SENDING",
          },
          data: {
            status: "REJECTED",
            rejectedAt:
              expect.any(Date),
            lastError:
              "Invio rifiutato.",
          },
        });
      },
    );

    it(
      "marca OUTCOME_UNKNOWN solo da SENDING",
      async () => {
        updateManyMock.mockResolvedValue({
          count: 1,
        });

        const store =
          new PrismaAlloggiatiTransmissionStore();

        await expect(
          store.markOutcomeUnknown(
            "transmission-1",
            "Timeout dopo Send.",
          ),
        ).resolves.toBe(true);

        expect(
          updateManyMock,
        ).toHaveBeenCalledWith({
          where: {
            id: "transmission-1",
            status: "SENDING",
          },
          data: {
            status:
              "OUTCOME_UNKNOWN",
            outcomeUnknownAt:
              expect.any(Date),
            lastError:
              "Timeout dopo Send.",
          },
        });
      },
    );
  },
);