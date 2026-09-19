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
const guestCheckInLinkFindUniqueMock = vi.hoisted(() => vi.fn());
const guestCheckInLinkUpsertMock = vi.hoisted(() => vi.fn());
const guestCheckInLinkUpdateManyMock = vi.hoisted(() => vi.fn());
const transactionMock = vi.hoisted(() => vi.fn());
const connectionFindUniqueMock = vi.hoisted(() => vi.fn());
const transmissionFindFirstMock = vi.hoisted(() => vi.fn());
const enqueueBackgroundJobMock = vi.hoisted(() => vi.fn());
const auditLogMock = vi.hoisted(() => vi.fn());
const revalidatePathMock = vi.hoisted(() => vi.fn());
const sendEmailMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth/guards", () => ({
  requireUser: requireUserMock,
  requirePropertyAccess: requirePropertyAccessMock,
  requirePropertyRole: requirePropertyRoleMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    booking: { findUnique: bookingFindUniqueMock },
    guestCheckInLink: {
      findUnique: guestCheckInLinkFindUniqueMock,
      upsert: guestCheckInLinkUpsertMock,
      updateMany: guestCheckInLinkUpdateManyMock,
    },
    $transaction: transactionMock,
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
  sendEmail: sendEmailMock,
}));

import {
  enqueueGuestCheckInAlloggiatiSubmissionAction,
  sendGuestCheckInEmailAction,
} from "./guest-check-in-actions";

describe("guest check-in actions", () => {
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
      guestName: "Mario Rossi",
      guestEmail: "mario@example.com",
      checkIn: new Date("2026-09-13T00:00:00.000Z"),
      checkOut: new Date("2026-09-20T00:00:00.000Z"),
      guests: 1,
      bookingGuests: [{ id: "guest-1" }],
      property: {
        name: "Duomo Apartment",
      },
    });

    connectionFindUniqueMock.mockResolvedValue({
      id: "connection-1",
    });

    transmissionFindFirstMock.mockResolvedValue(null);

    enqueueBackgroundJobMock.mockResolvedValue({
      id: "job-1",
      status: "QUEUED",
    });

    sendEmailMock.mockResolvedValue({});

    guestCheckInLinkFindUniqueMock.mockResolvedValue(null);

    guestCheckInLinkUpsertMock.mockResolvedValue({
      id: "link-1",
    });

    transactionMock.mockImplementation(
      async (callback: (transaction: unknown) => unknown) =>
        callback({
          guestCheckInLink: {
            findUnique: guestCheckInLinkFindUniqueMock,
            upsert: guestCheckInLinkUpsertMock,
            updateMany: guestCheckInLinkUpdateManyMock,
          },
        }),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("invia l'email del check-in e persiste il link usato nell'email", async () => {
    await expect(
      sendGuestCheckInEmailAction("booking-1"),
    ).resolves.toEqual({
      success: true,
      expiresAt: expect.any(String),
    });

    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "mario@example.com",
        subject:
          "Dati ospiti per il soggiorno - Duomo Apartment",
        html: expect.stringContaining(
          "/check-in/",
        ),
      }),
    );

    const emailCall = sendEmailMock.mock.calls[0][0];
    const emailUrlMatch = emailCall.html.match(
      /href="([^"]+)"/,
    );

    expect(emailUrlMatch?.[1]).toContain(
      "/check-in/",
    );

    expect(guestCheckInLinkUpsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          bookingId: "booking-1",
        },
        create: expect.objectContaining({
          bookingId: "booking-1",
          tokenHash: expect.any(String),
          expiresAt: expect.any(Date),
        }),
        update: expect.objectContaining({
          tokenHash: expect.any(String),
          expiresAt: expect.any(Date),
          revokedAt: null,
        }),
      }),
    );

    expect(auditLogMock).toHaveBeenCalled();
    expect(revalidatePathMock).toHaveBeenCalledWith(
      "/bookings/booking-1",
    );
  });

  it("revoca il link appena persistito se la consegna email fallisce", async () => {
    sendEmailMock.mockRejectedValueOnce(
      new Error("email unavailable"),
    );

    guestCheckInLinkUpdateManyMock.mockResolvedValue({
      count: 1,
    });

    await expect(
      sendGuestCheckInEmailAction("booking-1"),
    ).rejects.toThrow("email unavailable");

    expect(
      guestCheckInLinkUpdateManyMock,
    ).toHaveBeenCalledWith({
      where: {
        bookingId: "booking-1",
        tokenHash: expect.any(String),
        revokedAt: null,
      },
      data: {
        revokedAt: expect.any(Date),
      },
    });

    expect(auditLogMock).not.toHaveBeenCalledWith(
      expect.objectContaining({
        description: "Email schedina ospiti inviata.",
      }),
    );
  });
  it("non invia l'email se manca l'indirizzo dell'ospite", async () => {
    bookingFindUniqueMock.mockResolvedValue({
      id: "booking-1",
      propertyId: "property-1",
      guestName: "Mario Rossi",
      guestEmail: "   ",
      checkOut: new Date("2026-09-20T00:00:00.000Z"),
      property: {
        name: "Duomo Apartment",
      },
    });

    await expect(
      sendGuestCheckInEmailAction("booking-1"),
    ).rejects.toThrow(
      "La prenotazione non contiene un indirizzo email ospite.",
    );

    expect(sendEmailMock).not.toHaveBeenCalled();
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("non registra l'audit di email inviata se la consegna fallisce", async () => {
    sendEmailMock.mockRejectedValueOnce(
      new Error("email unavailable"),
    );

    await expect(
      sendGuestCheckInEmailAction("booking-1"),
    ).rejects.toThrow("email unavailable");

    expect(auditLogMock).not.toHaveBeenCalledWith(
      expect.objectContaining({
        description: "Email schedina ospiti inviata.",
      }),
    );
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("rigenera il link se ne esiste già uno e revoca quello precedente", async () => {
    guestCheckInLinkFindUniqueMock.mockResolvedValue({
      id: "previous-link",
    });

    await sendGuestCheckInEmailAction("booking-1");

    expect(guestCheckInLinkUpsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          bookingId: "booking-1",
        },
        update: {
          tokenHash: expect.any(String),
          expiresAt: expect.any(Date),
          revokedAt: null,
        },
      }),
    );

    expect(auditLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          regenerated: true,
        }),
      }),
      expect.anything(),
    );
  });
});

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
