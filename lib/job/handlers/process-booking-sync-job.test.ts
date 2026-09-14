import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const synchronizeIcalMock = vi.hoisted(() => vi.fn());
const getBookingProviderClientMock = vi.hoisted(() => vi.fn());
const synchronizeExternalBookingsMock = vi.hoisted(() => vi.fn());

vi.mock(
  "@/lib/integrations/ical/synchronize-ical-connection-property",
  () => ({
    synchronizeIcalConnectionProperty: synchronizeIcalMock,
  }),
);

vi.mock(
  "@/lib/integrations/shared/provider-registry",
  () => ({
    getBookingProviderClient: getBookingProviderClientMock,
  }),
);

vi.mock(
  "@/lib/integrations/shared/synchronize-external-bookings",
  () => ({
    synchronizeExternalBookings: synchronizeExternalBookingsMock,
  }),
);

vi.mock(
  "@/lib/integrations/shared/prisma-booking-domain-service",
  () => ({
    prismaBookingDomainService: {},
  }),
);

import { processBookingSyncJob } from "./process-booking-sync-job";

describe("processBookingSyncJob", () => {
  beforeEach(() => {
    synchronizeIcalMock.mockReset();
    getBookingProviderClientMock.mockReset();
    synchronizeExternalBookingsMock.mockReset();
  });

  it("sincronizza direttamente la connessione iCal quando connectionId e propertyId sono presenti", async () => {
    await processBookingSyncJob({
      id: "job-1",
      type: "BOOKING_SYNC",
      status: "RUNNING",
      payload: {
        provider: "BOOKING_COM",
        connectionId: "connection-1",
        propertyId: "property-1",
        pageLimit: 50,
        maxPages: 20,
      },
      attempts: 1,
      maxAttempts: 3,
      availableAt: new Date(),
      startedAt: new Date(),
      finishedAt: null,
      lastError: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deduplicationKey: null,
      heartbeatAt: null,
    });

    expect(synchronizeIcalMock).toHaveBeenCalledWith({
      connectionId: "connection-1",
      propertyId: "property-1",
      pageLimit: 50,
      maxPages: 20,
    });

    expect(getBookingProviderClientMock).not.toHaveBeenCalled();
    expect(synchronizeExternalBookingsMock).not.toHaveBeenCalled();
  });

  it("rifiuta un payload iCal incompleto", async () => {
    await expect(
      processBookingSyncJob({
        id: "job-2",
        type: "BOOKING_SYNC",
        status: "RUNNING",
        payload: {
          provider: "BOOKING_COM",
          connectionId: "connection-1",
        },
        attempts: 1,
        maxAttempts: 3,
        availableAt: new Date(),
        startedAt: new Date(),
        finishedAt: null,
        lastError: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deduplicationKey: null,
        heartbeatAt: null,
      }),
    ).rejects.toThrow(
      "Payload BOOKING_SYNC iCal incompleto",
    );

    expect(getBookingProviderClientMock).not.toHaveBeenCalled();
  });
});
