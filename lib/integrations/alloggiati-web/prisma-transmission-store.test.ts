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
      "conferma solo una transmission SENDING",
      async () => {
        updateManyMock.mockResolvedValue({
          count: 1,
        });

        const store =
          new PrismaAlloggiatiTransmissionStore();

        await expect(
          store.confirm(
            "transmission-1",
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
            status: "CONFIRMED",
            confirmedAt:
              expect.any(Date),
            lastError: null,
          },
        });
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
