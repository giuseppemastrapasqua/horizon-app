import {
  AvailabilityBlockSource,
} from "@prisma/client";
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const fetchEventsMock =
  vi.hoisted(() =>
    vi.fn(),
  );

const findManyMock =
  vi.hoisted(() =>
    vi.fn(),
  );

const upsertMock =
  vi.hoisted(() =>
    vi.fn(),
  );

const deleteManyMock =
  vi.hoisted(() =>
    vi.fn(),
  );

const transactionMock =
  vi.hoisted(() =>
    vi.fn(),
  );

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction:
      transactionMock,
  },
}));

import {
  synchronizeIcalAvailability,
} from "./synchronize-ical-availability";

describe(
  "synchronizeIcalAvailability",
  () => {
    const client = {
      fetchEvents:
        fetchEventsMock,
    } as never;

    beforeEach(() => {
      fetchEventsMock.mockReset();
      findManyMock.mockReset();
      upsertMock.mockReset();
      deleteManyMock.mockReset();
      transactionMock.mockReset();

      transactionMock.mockImplementation(
        async (
          callback: (
            transaction: unknown,
          ) => Promise<unknown>,
        ) =>
          callback({
            propertyAvailabilityBlock: {
              findMany:
                findManyMock,

              upsert:
                upsertMock,

              deleteMany:
                deleteManyMock,
            },
          }),
      );

      findManyMock.mockResolvedValue(
        [],
      );

      upsertMock.mockResolvedValue({
        id:
          "created-block",
      });

      deleteManyMock.mockResolvedValue({
        count:
          0,
      });
    });

    it("crea i blocchi per gli eventi all-day attivi", async () => {
      fetchEventsMock.mockResolvedValue([
        event({
          uid:
            "booking-1",
          start:
            "2026-09-10",
          end:
            "2026-09-13",
        }),
        event({
          uid:
            "booking-2",
          start:
            "2026-09-20",
          end:
            "2026-09-22",
        }),
      ]);

      const result =
        await synchronizeIcalAvailability({
          client,
          integrationConnectionPropertyId:
            "connection-property-1",
          propertyId:
            "property-1",
        });

      expect(result).toMatchObject({
        fetchedEvents:
          2,
        insertedBlocks:
          2,
        updatedBlocks:
          0,
        deletedBlocks:
          0,
        skippedEvents:
          0,
      });

      expect(
        upsertMock,
      ).toHaveBeenCalledTimes(2);

      expect(
        upsertMock,
      ).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          create:
            expect.objectContaining({
              propertyId:
                "property-1",
              startDate:
                new Date(
                  "2026-09-10T00:00:00.000Z",
                ),
              endDate:
                new Date(
                  "2026-09-12T00:00:00.000Z",
                ),
              source:
                AvailabilityBlockSource.INTEGRATION,
              note:
                "Disponibilità iCal.",
              integrationConnectionPropertyId:
                "connection-property-1",
              externalEventId:
                "booking-1",
              externalSummary:
                "Reserved",
            }),
        }),
      );
    });

    it("aggiorna un blocco quando cambiano le date", async () => {
      findManyMock.mockResolvedValue([
        existingBlock({
          id:
            "block-1",
          externalEventId:
            "booking-1",
          startDate:
            "2026-09-10",
          endDate:
            "2026-09-12",
        }),
      ]);

      fetchEventsMock.mockResolvedValue([
        event({
          uid:
            "booking-1",
          start:
            "2026-09-11",
          end:
            "2026-09-14",
        }),
      ]);

      const result =
        await synchronizeIcalAvailability({
          client,
          integrationConnectionPropertyId:
            "connection-property-1",
          propertyId:
            "property-1",
        });

      expect(result).toMatchObject({
        insertedBlocks:
          0,
        updatedBlocks:
          1,
        deletedBlocks:
          0,
      });

      expect(
        upsertMock,
      ).toHaveBeenCalledTimes(1);
    });

    it("non riscrive un blocco già identico", async () => {
      findManyMock.mockResolvedValue([
        existingBlock({
          id:
            "block-1",
          externalEventId:
            "booking-1",
          startDate:
            "2026-09-10",
          endDate:
            "2026-09-12",
        }),
      ]);

      fetchEventsMock.mockResolvedValue([
        event({
          uid:
            "booking-1",
          start:
            "2026-09-10",
          end:
            "2026-09-13",
        }),
      ]);

      const result =
        await synchronizeIcalAvailability({
          client,
          integrationConnectionPropertyId:
            "connection-property-1",
          propertyId:
            "property-1",
        });

      expect(result).toMatchObject({
        insertedBlocks:
          0,
        updatedBlocks:
          0,
        deletedBlocks:
          0,
      });

      expect(
        upsertMock,
      ).not.toHaveBeenCalled();

      expect(
        deleteManyMock,
      ).not.toHaveBeenCalled();
    });

    it("aggiorna un blocco quando cambia il summary esterno", async () => {
      findManyMock.mockResolvedValue([
        existingBlock({
          id:
            "block-1",
          externalEventId:
            "booking-1",
          externalSummary:
            null,
        }),
      ]);

      fetchEventsMock.mockResolvedValue([
        event({
          uid:
            "booking-1",
          start:
            "2026-09-10",
          end:
            "2026-09-13",
        }),
      ]);

      const result =
        await synchronizeIcalAvailability({
          client,
          integrationConnectionPropertyId:
            "connection-property-1",
          propertyId:
            "property-1",
        });

      expect(result).toMatchObject({
        insertedBlocks:
          0,
        updatedBlocks:
          1,
        deletedBlocks:
          0,
      });

      expect(
        upsertMock,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          update:
            expect.objectContaining({
              externalSummary:
                "Reserved",
            }),
        }),
      );
    });
    it("elimina un blocco quando l'evento diventa CANCELLED", async () => {
      findManyMock.mockResolvedValue([
        existingBlock({
          id:
            "block-1",
          externalEventId:
            "booking-1",
          startDate:
            "2026-09-10",
          endDate:
            "2026-09-12",
        }),
      ]);

      fetchEventsMock.mockResolvedValue([
        event({
          uid:
            "booking-1",
          status:
            "CANCELLED",
          start:
            "2026-09-10",
          end:
            "2026-09-13",
        }),
      ]);

      deleteManyMock.mockResolvedValue({
        count:
          1,
      });

      const result =
        await synchronizeIcalAvailability({
          client,
          integrationConnectionPropertyId:
            "connection-property-1",
          propertyId:
            "property-1",
        });

      expect(result.deletedBlocks)
        .toBe(1);

      expect(
        deleteManyMock,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          where:
            expect.objectContaining({
              id: {
                in: [
                  "block-1",
                ],
              },
              integrationConnectionPropertyId:
                "connection-property-1",
              source:
                AvailabilityBlockSource.INTEGRATION,
            }),
        }),
      );
    });

    it("elimina un blocco quando il suo UID non compare più nello snapshot", async () => {
      findManyMock.mockResolvedValue([
        existingBlock({
          id:
            "block-1",
          externalEventId:
            "booking-1",
        }),
      ]);

      fetchEventsMock.mockResolvedValue([
        event({
          uid:
            "booking-2",
          start:
            "2026-09-20",
          end:
            "2026-09-22",
        }),
      ]);

      deleteManyMock.mockResolvedValue({
        count:
          1,
      });

      const result =
        await synchronizeIcalAvailability({
          client,
          integrationConnectionPropertyId:
            "connection-property-1",
          propertyId:
            "property-1",
        });

      expect(result.deletedBlocks)
        .toBe(1);

      expect(
        deleteManyMock,
      ).toHaveBeenCalledTimes(1);
    });

    it("non tocca i blocchi manuali", async () => {
      fetchEventsMock.mockResolvedValue([]);

      await synchronizeIcalAvailability({
        client,
        integrationConnectionPropertyId:
          "connection-property-1",
        propertyId:
          "property-1",
      });

      expect(
        findManyMock,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          where:
            expect.objectContaining({
              integrationConnectionPropertyId:
                "connection-property-1",
              source:
                AvailabilityBlockSource.INTEGRATION,
            }),
        }),
      );

      expect(
        deleteManyMock,
      ).not.toHaveBeenCalled();
    });

    it("conserva un evento esistente quando il nuovo evento è invalido", async () => {
      findManyMock.mockResolvedValue([
        existingBlock({
          id:
            "block-1",
          externalEventId:
            "booking-1",
        }),
      ]);

      fetchEventsMock.mockResolvedValue([
        event({
          uid:
            "booking-1",
          isAllDay:
            false,
          start:
            "2026-09-10",
          end:
            "2026-09-13",
        }),
      ]);

      const result =
        await synchronizeIcalAvailability({
          client,
          integrationConnectionPropertyId:
            "connection-property-1",
          propertyId:
            "property-1",
        });

      expect(result.skippedEvents)
        .toBe(1);

      expect(result.deletedBlocks)
        .toBe(0);

      expect(
        upsertMock,
      ).not.toHaveBeenCalled();

      expect(
        deleteManyMock,
      ).not.toHaveBeenCalled();
    });

    it("rifiuta due VEVENT conflittuali con lo stesso UID", async () => {
      fetchEventsMock.mockResolvedValue([
        event({
          uid:
            "duplicate-1",
          start:
            "2026-09-10",
          end:
            "2026-09-13",
        }),
        event({
          uid:
            "duplicate-1",
          start:
            "2026-09-20",
          end:
            "2026-09-23",
        }),
      ]);

      await expect(
        synchronizeIcalAvailability({
          client,
          integrationConnectionPropertyId:
            "connection-property-1",
          propertyId:
            "property-1",
        }),
      ).rejects.toThrow(
        'Il feed iCal contiene VEVENT conflittuali con UID "duplicate-1".',
      );

      expect(
        transactionMock,
      ).not.toHaveBeenCalled();
    });

    it("valida gli identificativi prima di scaricare il feed", async () => {
      await expect(
        synchronizeIcalAvailability({
          client,
          integrationConnectionPropertyId:
            "   ",
          propertyId:
            "property-1",
        }),
      ).rejects.toThrow(
        "integrationConnectionPropertyId non valido.",
      );

      await expect(
        synchronizeIcalAvailability({
          client,
          integrationConnectionPropertyId:
            "connection-property-1",
          propertyId:
            "   ",
        }),
      ).rejects.toThrow(
        "propertyId non valido.",
      );

      expect(
        fetchEventsMock,
      ).not.toHaveBeenCalled();

      expect(
        transactionMock,
      ).not.toHaveBeenCalled();
    });
  },
);

function event({
  uid,
  start,
  end,
  status,
  isAllDay = true,
}: {
  uid: string;
  start: string;
  end: string;
  status?: string;
  isAllDay?: boolean;
}) {
  return {
    uid,
    summary:
      "Reserved",
    start:
      new Date(
        `${start}T00:00:00.000Z`,
      ),
    end:
      new Date(
        `${end}T00:00:00.000Z`,
      ),
    status,
    description:
      undefined,
    location:
      undefined,
    isAllDay,
  };
}

function existingBlock({
  id,
  externalEventId,
  startDate =
    "2026-09-10",
  endDate =
    "2026-09-12",
  externalSummary =
    "Reserved",
  note =
    "Disponibilità iCal.",
}: {
  id: string;
  externalEventId: string;
  startDate?: string;
  endDate?: string;
  externalSummary?: string | null;
  note?: string;
}) {
  return {
    id,
    propertyId:
      "property-1",
    externalEventId,
    externalSummary,
    startDate:
      new Date(
        `${startDate}T00:00:00.000Z`,
      ),
    endDate:
      new Date(
        `${endDate}T00:00:00.000Z`,
      ),
    note,
  };
}


