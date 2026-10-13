import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const findManyMock = vi.hoisted(() => vi.fn());
const enqueueBackgroundJobMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({
  prisma: {
    integrationConnectionProperty: {
      findMany: findManyMock,
    },
  },
}));

vi.mock("@/lib/job/enqueue-background-job", () => ({
  enqueueBackgroundJob: enqueueBackgroundJobMock,
}));

import { enqueueBookingIcalSyncJobs } from "./enqueue-booking-ical-sync-jobs";

describe("enqueueBookingIcalSyncJobs", () => {
  beforeEach(() => {
    findManyMock.mockReset();
    enqueueBackgroundJobMock.mockReset();
  });

  it("accoda Booking e Airbnb con provider e identità distinti", async () => {
    findManyMock.mockResolvedValue([
      {
        connectionId: "connection-booking",
        propertyId: "property-1",
        config: { channel: "BOOKING" },
      },
      {
        connectionId: "connection-other",
        propertyId: "property-2",
        config: { channel: "AIRBNB" },
      },
    ]);

    enqueueBackgroundJobMock.mockResolvedValue({
      id: "job-1",
    });

    const count = await enqueueBookingIcalSyncJobs();

    expect(count).toBe(2);

    expect(enqueueBackgroundJobMock).toHaveBeenCalledTimes(2);
    expect(findManyMock).toHaveBeenCalledWith(expect.objectContaining({
      where: { connection: { connectorKey: "ical", transport: "ICAL", enabled: true } },
    }));
    expect(enqueueBackgroundJobMock).toHaveBeenNthCalledWith(2, {
      type: "BOOKING_SYNC",
      payload: { provider: "AIRBNB", connectionId: "connection-other", propertyId: "property-2", pageLimit: 50, maxPages: 20 },
      deduplicationKey: "booking-sync:ical:connection-other:property-2",
    });

    expect(enqueueBackgroundJobMock).toHaveBeenCalledWith({
      type: "BOOKING_SYNC",
      payload: {
        provider: "BOOKING_COM",
        connectionId: "connection-booking",
        propertyId: "property-1",
        pageLimit: 50,
        maxPages: 20,
      },
      deduplicationKey:
        "booking-sync:ical:connection-booking:property-1",
    });
  });

  it("ignora configurazioni mancanti, malformate e canali non supportati", async () => {
    findManyMock.mockResolvedValue([null, [], {}, { channel: 7 }, { channel: "VRBO" }].map(config => ({
      connectionId: "connection-invalid", propertyId: "property-1", config,
    })));
    expect(await enqueueBookingIcalSyncJobs()).toBe(0);
    expect(enqueueBackgroundJobMock).not.toHaveBeenCalled();
  });

  it("mantiene chiavi stabili e distinte per due proprietà della stessa connessione", async () => {
    findManyMock.mockResolvedValue(["property-1", "property-2"].map(propertyId => ({
      connectionId: "connection-airbnb", propertyId, config: { channel: "AIRBNB" },
    })));
    await enqueueBookingIcalSyncJobs();
    await enqueueBookingIcalSyncJobs();
    const keys = enqueueBackgroundJobMock.mock.calls.map(([input]) => input.deduplicationKey);
    expect(keys).toEqual([
      "booking-sync:ical:connection-airbnb:property-1", "booking-sync:ical:connection-airbnb:property-2",
      "booking-sync:ical:connection-airbnb:property-1", "booking-sync:ical:connection-airbnb:property-2",
    ]);
  });
});
