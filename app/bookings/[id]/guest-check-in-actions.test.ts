import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const requireUserMock = vi.hoisted(() => vi.fn());
const requirePropertyAccessMock = vi.hoisted(() => vi.fn());
const requirePropertyRoleMock = vi.hoisted(() => vi.fn());
const bookingFindUniqueMock = vi.hoisted(() => vi.fn());
const connectionFindUniqueMock = vi.hoisted(() => vi.fn());
const transmissionFindFirstMock = vi.hoisted(() => vi.fn());
const enqueueBackgroundJobMock = vi.hoisted(() => vi.fn());
const auditLogMock = vi.hoisted(() => vi.fn());
const revalidatePathMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth/guards", () => ({
  requireUser: requireUserMock,
  requirePropertyAccess: requirePropertyAccessMock,
  requirePropertyRole: requirePropertyRoleMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    booking: { findUnique: bookingFindUniqueMock },
    alloggiatiWebProperty: { findUnique: connectionFindUniqueMock },
    alloggiatiWebTransmission: {
      findFirst: transmissionFindFirstMock,
    },
  },
}));

vi.mock("@/lib/job/enqueue-background-job", () => ({
  enqueueBackgroundJob: enqueueBackgroundJobMock,
}));

vi.mock("@/services/audit/AuditService", () => ({
  AuditService: { log: auditLogMock },
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock("@/lib/notifications/email/send-email", () => ({
  sendEmail: vi.fn(),
}));

import {
  enqueueGuestCheckInAlloggiatiSubmissionAction,
} from "./guest-check-in-actions";

describe("enqueueGuestCheckInAlloggiatiSubmissionAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-13T12:00:00.000Z"));

    requireUserMock.mockResolvedValue({ id: "user-1" });
    requirePropertyAccessMock.mockResolvedValue({ id: "user-1" });
    requirePropertyRoleMock.mockResolvedValue({ id: "user-1" });

    bookingFindUniqueMock.mockResolvedValue({
      id: "booking-1",
      propertyId: "property-1",
      checkIn: new Date("2026-09-13T00:00:00.000Z"),
      guests: 1,
      bookingGuests: [{ id: "guest-1" }],
    });

    connectionFindUniqueMock.mockResolvedValue({
      id: "connection-1",
    });

    transmissionFindFirstMock.mockResolvedValue(null);

    enqueueBackgroundJobMock.mockResolvedValue({
      id: "job-1",
      status: "QUEUED",
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("accoda un job deduplicato senza inviare direttamente", async () => {
    await expect(
      enqueueGuestCheckInAlloggiatiSubmissionAction("booking-1"),
    ).resolves.toEqual({
      success: true,
      jobId: "job-1",
    });

    expect(requirePropertyRoleMock).toHaveBeenCalledWith(
      "property-1",
      ["OWNER", "MANAGER"],
    );

    expect(enqueueBackgroundJobMock).toHaveBeenCalledWith({
      type: "ALLOGGIATI_WEB_SUBMISSION",
      payload: {
        bookingId: "booking-1",
        propertyId: "property-1",
      },
      deduplicationKey: "alloggiati-web-submission:booking-1",
      maxAttempts: 1,
    });

    expect(auditLogMock).toHaveBeenCalledTimes(1);
    expect(revalidatePathMock).toHaveBeenCalledWith(
      "/bookings/booking-1",
    );
  });

  it("rifiuta dati ospiti incompleti", async () => {
    bookingFindUniqueMock.mockResolvedValue({
      id: "booking-1",
      propertyId: "property-1",
      checkIn: new Date("2026-09-13T00:00:00.000Z"),
      guests: 2,
      bookingGuests: [{ id: "guest-1" }],
    });

    await expect(
      enqueueGuestCheckInAlloggiatiSubmissionAction("booking-1"),
    ).rejects.toThrow(
      "Dati ospiti Alloggiati incompleti rispetto alla prenotazione.",
    );

    expect(enqueueBackgroundJobMock).not.toHaveBeenCalled();
  });

  it("blocca una schedina già confermata", async () => {
    transmissionFindFirstMock.mockResolvedValue({
      id: "transmission-1",
    });

    await expect(
      enqueueGuestCheckInAlloggiatiSubmissionAction("booking-1"),
    ).rejects.toThrow(
      "La schedina è già stata trasmessa e confermata da Alloggiati Web.",
    );

    expect(enqueueBackgroundJobMock).not.toHaveBeenCalled();
  });

  it("blocca l'invio prima del giorno di check-in", async () => {
    bookingFindUniqueMock.mockResolvedValue({
      id: "booking-1",
      propertyId: "property-1",
      checkIn: new Date("2026-09-18T00:00:00.000Z"),
      guests: 1,
      bookingGuests: [{ id: "guest-1" }],
    });

    await expect(
      enqueueGuestCheckInAlloggiatiSubmissionAction("booking-1"),
    ).rejects.toThrow(
      "Alloggiati Web sarà disponibile dal giorno del check-in.",
    );

    expect(connectionFindUniqueMock).not.toHaveBeenCalled();
    expect(enqueueBackgroundJobMock).not.toHaveBeenCalled();
  });
});