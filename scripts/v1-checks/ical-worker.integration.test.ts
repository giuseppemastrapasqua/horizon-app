import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { assertIsolatedDatabase } from "./seed";
const download = vi.hoisted(() => vi.fn());
vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/integrations/ical/fetch-ical-calendar", () => ({ fetchIcalCalendar: download }));
import { prisma } from "@/lib/prisma";
import { enqueueBookingIcalSyncJobs } from "@/lib/job/enqueue-booking-ical-sync-jobs";
import { processNextBackgroundJob } from "@/lib/job/process-next-background-job";
import { GET, POST } from "@/app/api/internal/background-jobs/process/route";

const prefix = "v1-ical-cycle";
const ownerId = `${prefix}-owner`;
const propertyId = `${prefix}-property`;
let failingUrl: string | undefined;
let emptyUrl: string | undefined;
const feed = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nUID:fixture-stay\r\nDTSTART;VALUE=DATE:20261020\r\nDTEND;VALUE=DATE:20261023\r\nSUMMARY:Reserved\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n`;

describe.skipIf(process.env.HORIZON_V1_ISOLATED_TEST !== "true")("isolated PostgreSQL iCal worker cycle", () => {
  beforeAll(async () => {
    assertIsolatedDatabase();
    const [{ name }] = await prisma.$queryRaw<Array<{ name: string }>>`SELECT current_database() AS name`;
    expect(name).toBe("horizon_v1_test");
    expect(await prisma.backgroundJob.count()).toBe(0);
    await prisma.user.create({ data: { id: ownerId, fullName: "iCal fixture owner", email: "ical-cycle@example.com", role: "OWNER" } });
    await prisma.property.create({ data: { id: propertyId, name: "iCal fixture property", address: "Synthetic address", ownerId, maxGuests: 2 } });
    await prisma.propertyAvailabilityBlock.create({ data: { propertyId, startDate: new Date("2026-11-01"), endDate: new Date("2026-11-02"), source: "MANUAL", note: "Preserve fixture personal use" } });
    for (let index = 0; index < 12; index++) {
      const connectionId = `${prefix}-${index}`;
      await prisma.integrationConnection.create({ data: { id: connectionId, ownerId, name: "Fixture feed", connectorKey: "ical", transport: "ICAL", properties: { create: { id: `${connectionId}-mapping`, propertyId, externalPropertyId: `external-${index}`, config: { channel: index % 2 ? "AIRBNB" : "BOOKING", feedUrl: `https://fixture.example.com/${index}.ics` } } } } });
    }
    download.mockImplementation(async (url: string) => {
      if (url === failingUrl) throw new Error("Synthetic feed timeout");
      return url === emptyUrl ? "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nEND:VCALENDAR\r\n" : feed;
    });
  });
  afterAll(async () => {
    assertIsolatedDatabase();
    await prisma.backgroundJob.deleteMany({ where: { deduplicationKey: { startsWith: `booking-sync:ical:${prefix}-` } } });
    await prisma.property.deleteMany({ where: { id: propertyId } });
    await prisma.user.deleteMany({ where: { id: ownerId } });
    await prisma.$disconnect();
  });

  it("deduplica pianificatori concorrenti e smaltisce oltre dieci feed attraverso GET e POST", async () => {
    expect(await Promise.all([enqueueBookingIcalSyncJobs(), enqueueBookingIcalSyncJobs()])).toEqual([12, 12]);
    expect(await prisma.backgroundJob.count({ where: { status: "QUEUED" } })).toBe(12);
    const previousCron = process.env.CRON_SECRET;
    const previousWorker = process.env.BACKGROUND_JOB_SECRET;
    process.env.CRON_SECRET = "isolated-ical-cron";
    process.env.BACKGROUND_JOB_SECRET = "isolated-ical-worker";
    try {
      const first = await GET(new Request("http://127.0.0.1/api/internal/background-jobs/process", { headers: { authorization: "Bearer isolated-ical-cron" } }));
      expect(first.status).toBe(200);
      expect((await first.json()).processedJobs).toBe(10);
      expect(await prisma.backgroundJob.count({ where: { status: "QUEUED" } })).toBe(2);
      const second = await POST(new Request("http://127.0.0.1/api/internal/background-jobs/process", { method: "POST", headers: { authorization: "Bearer isolated-ical-worker" } }));
      expect(second.status).toBe(200);
      expect((await second.json()).processedJobs).toBe(2);
    } finally {
      if (previousCron === undefined) delete process.env.CRON_SECRET; else process.env.CRON_SECRET = previousCron;
      if (previousWorker === undefined) delete process.env.BACKGROUND_JOB_SECRET; else process.env.BACKGROUND_JOB_SECRET = previousWorker;
    }
    expect(await prisma.backgroundJob.count({ where: { status: "COMPLETED" } })).toBe(12);
    expect(await prisma.propertyAvailabilityBlock.count({ where: { propertyId, source: "INTEGRATION" } })).toBe(12);
    expect(await prisma.booking.count({ where: { propertyId } })).toBe(0);
    const blocks = await prisma.propertyAvailabilityBlock.findMany({ where: { propertyId, source: "INTEGRATION" } });
    expect(blocks.every(block => block.endDate.toISOString().startsWith("2026-10-22"))).toBe(true);
    expect(await prisma.integrationConnection.count({ where: { ownerId, lastSyncStatus: "SUCCESS" } })).toBe(12);
  });

  it("due worker concorrenti non elaborano lo stesso job o duplicano i blocchi", async () => {
    await enqueueBookingIcalSyncJobs();
    for (let pair = 0; pair < 6; pair++) {
      expect(await Promise.all([processNextBackgroundJob(), processNextBackgroundJob()])).toEqual([true, true]);
    }
    expect(await processNextBackgroundJob()).toBe(false);
    expect(await prisma.propertyAvailabilityBlock.count({ where: { propertyId, source: "INTEGRATION" } })).toBe(12);
    expect(await prisma.backgroundJob.count({ where: { attempts: { not: 1 } } })).toBe(0);
  });

  it("preserva disponibilità in errore, registra retry e recupera senza duplicazioni", async () => {
    failingUrl = "https://fixture.example.com/1.ics";
    await enqueueBookingIcalSyncJobs();
    for (let index = 0; index < 12; index++) await processNextBackgroundJob();
    const failed = await prisma.backgroundJob.findFirstOrThrow({ where: { status: "QUEUED" } });
    expect(failed.attempts).toBe(1);
    expect(failed.lastError).toContain("Synthetic feed timeout");
    expect(failed.availableAt.getTime()).toBeGreaterThan(Date.now());
    expect(await prisma.propertyAvailabilityBlock.count({ where: { propertyId, source: "INTEGRATION" } })).toBe(12);
    expect(await processNextBackgroundJob()).toBe(false);
    failingUrl = undefined;
    await prisma.backgroundJob.update({ where: { id: failed.id }, data: { availableAt: new Date(0) } });
    expect(await processNextBackgroundJob()).toBe(true);
    const recovered = await prisma.backgroundJob.findUniqueOrThrow({ where: { id: failed.id } });
    expect(recovered.status).toBe("COMPLETED");
    expect(recovered.attempts).toBe(2);
    expect(recovered.lastError).toBeNull();
  });

  it("rimuove solo gli eventi scomparsi dal mapping, mantenendo uso personale e altri feed", async () => {
    emptyUrl = "https://fixture.example.com/1.ics";
    await enqueueBookingIcalSyncJobs();
    for (let index = 0; index < 12; index++) await processNextBackgroundJob();
    expect(await prisma.propertyAvailabilityBlock.count({ where: { propertyId, source: "INTEGRATION" } })).toBe(11);
    expect(await prisma.propertyAvailabilityBlock.count({ where: { propertyId, source: "MANUAL" } })).toBe(1);
  });
});
