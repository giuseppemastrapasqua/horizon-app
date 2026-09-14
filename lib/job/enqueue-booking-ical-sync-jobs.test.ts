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

  it("accoda soltanto le connessioni iCal Booking abilitate restituite dalla query", async () => {
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

    expect(count).toBe(1);

    expect(enqueueBackgroundJobMock).toHaveBeenCalledOnce();

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
});
