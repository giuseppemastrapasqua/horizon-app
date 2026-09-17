import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  requirePropertyRole: vi.fn(),
  bookingGuestFindUnique: vi.fn(),
  classificationUpsert: vi.fn(),
  auditLog: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth/guards", () => ({
  requireUser: mocks.requireUser,
  requirePropertyRole:
    mocks.requirePropertyRole,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    bookingGuest: {
      findUnique:
        mocks.bookingGuestFindUnique,
    },
    soggiorniamoFiscalClassification: {
      upsert:
        mocks.classificationUpsert,
    },
  },
}));

vi.mock(
  "@/services/audit/AuditService",
  () => ({
    AuditService: {
      log: mocks.auditLog,
    },
  }),
);

vi.mock("next/cache", () => ({
  revalidatePath:
    mocks.revalidatePath,
}));

import {
  applyManualSoggiorniamoFiscalDecisionAction,
} from "./soggiorniamo-actions";

describe(
  "applyManualSoggiorniamoFiscalDecisionAction",
  () => {
    beforeEach(() => {
      vi.clearAllMocks();

      mocks.requireUser.mockResolvedValue({
        id: "user-1",
      });

      mocks.requirePropertyRole
        .mockResolvedValue(undefined);

      mocks.bookingGuestFindUnique
        .mockResolvedValue({
          id: "guest-1",
          booking: {
            id: "booking-1",
            propertyId: "property-1",
            checkIn: new Date(
              "2026-09-01T00:00:00.000Z",
            ),
            checkOut: new Date(
              "2026-09-04T00:00:00.000Z",
            ),
          },
        });

      mocks.classificationUpsert
        .mockResolvedValue({});

      mocks.auditLog
        .mockResolvedValue(undefined);
    });

    it(
      "calcola il codice 1 dalle date canoniche",
      async () => {
        const result =
          await applyManualSoggiorniamoFiscalDecisionAction({
            bookingGuestId: "guest-1",
            guestTypeCode: 1,

            // Devono essere ignorati.
            tariff: 999,
            taxAmount: 999,
          });

        expect(result).toMatchObject({
          success: true,
          decision: {
            bookingGuestId: "guest-1",
            guestTypeCode: 1,
            tariff: 9.5,
            taxAmount: 28.5,
            source: "MANUAL",
            status: "CLASSIFIED",
            reason:
              "MANUAL_ORDINARY_RATE",
          },
        });

        expect(
          mocks.requirePropertyRole,
        ).toHaveBeenCalledWith(
          "property-1",
          ["OWNER", "MANAGER"],
        );

        expect(
          mocks.classificationUpsert,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              bookingGuestId: "guest-1",
            },
            create:
              expect.objectContaining({
                guestTypeCode: 1,
                tariff: 9.5,
                taxAmount: 28.5,
                source: "MANUAL",
                status: "CLASSIFIED",
              }),
          }),
        );

        expect(
          mocks.auditLog,
        ).toHaveBeenCalledTimes(1);

        expect(
          mocks.revalidatePath,
        ).toHaveBeenCalledWith(
          "/bookings/booking-1",
        );
      },
    );

    it(
      "richiede importi espliciti per codice 14",
      async () => {
        await expect(
          applyManualSoggiorniamoFiscalDecisionAction({
            bookingGuestId: "guest-1",
            guestTypeCode: 14,
          }),
        ).rejects.toThrow(
          "Explicit tariff and taxAmount are required",
        );

        expect(
          mocks.classificationUpsert,
        ).not.toHaveBeenCalled();

        expect(
          mocks.auditLog,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "salva codice 14 con valori espliciti",
      async () => {
        const result =
          await applyManualSoggiorniamoFiscalDecisionAction({
            bookingGuestId: "guest-1",
            guestTypeCode: 14,
            intermediary:
              "  Portale test  ",
            tariff: 0,
            taxAmount: 0,
          });

        expect(result).toMatchObject({
          success: true,
          decision: {
            guestTypeCode: 14,
            tariff: 0,
            taxAmount: 0,
            intermediary:
              "Portale test",
            source: "MANUAL",
            status: "CLASSIFIED",
          },
        });
      },
    );

    it(
      "rifiuta categorie non supportate",
      async () => {
        await expect(
          applyManualSoggiorniamoFiscalDecisionAction({
            bookingGuestId: "guest-1",
            guestTypeCode: 99,
          }),
        ).rejects.toThrow(
          "Categoria Soggiorniamo non supportata.",
        );

        expect(
          mocks.bookingGuestFindUnique,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "blocca il salvataggio senza ruolo autorizzato",
      async () => {
        mocks.requirePropertyRole
          .mockRejectedValue(
            new Error("Forbidden"),
          );

        await expect(
          applyManualSoggiorniamoFiscalDecisionAction({
            bookingGuestId: "guest-1",
            guestTypeCode: 1,
          }),
        ).rejects.toThrow("Forbidden");

        expect(
          mocks.classificationUpsert,
        ).not.toHaveBeenCalled();

        expect(
          mocks.auditLog,
        ).not.toHaveBeenCalled();
      },
    );
  },
);