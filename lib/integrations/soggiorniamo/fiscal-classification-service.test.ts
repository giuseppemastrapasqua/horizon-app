import { describe, expect, it, vi } from "vitest";

import {
  buildAutomaticFiscalClassification,
  classifyAndPersistBookingGuests,
} from "./fiscal-classification-service";

const CHECK_IN = new Date(
  "2026-09-16T00:00:00.000Z",
);

const CHECK_OUT = new Date(
  "2026-09-19T00:00:00.000Z",
);

describe(
  "Soggiorniamo fiscal classification service",
  () => {
    it(
      "costruisce classificazione automatica completa per minore",
      () => {
        expect(
          buildAutomaticFiscalClassification(
            {
              id: "guest-minor",
              birthDate: new Date(
                "2010-01-01T00:00:00.000Z",
              ),
              residenceCountry: "ITALIA",
              residenceCity: "ROMA",
              residenceProvince: "RM",
            },
            CHECK_IN,
            CHECK_OUT,
          ),
        ).toEqual({
          bookingGuestId: "guest-minor",
          guestTypeCode: 2,
          tariff: 0,
          taxAmount: 0,
          intermediary: null,
          source: "AUTO",
          status: "CLASSIFIED",
          reason: "MINOR_UNDER_18",
        });
      },
    );

    it(
      "classifica automaticamente residente Milano con imposta zero",
      () => {
        expect(
          buildAutomaticFiscalClassification(
            {
              id: "guest-milan",
              birthDate: new Date(
                "1980-01-01T00:00:00.000Z",
              ),
              residenceCountry: "ITALIA",
              residenceCity: "MILANO",
              residenceProvince: "MI",
            },
            CHECK_IN,
            CHECK_OUT,
          ),
        ).toEqual({
          bookingGuestId: "guest-milan",
          guestTypeCode: 13,
          tariff: 0,
          taxAmount: 0,
          intermediary: null,
          source: "AUTO",
          status: "CLASSIFIED",
          reason: "MILAN_RESIDENT",
        });
      },
    );

    it(
      "lascia in review adulto senza regola fiscale sicura",
      () => {
        expect(
          buildAutomaticFiscalClassification(
            {
              id: "guest-adult",
              birthDate: new Date(
                "1980-01-01T00:00:00.000Z",
              ),
              residenceCountry: "ITALIA",
              residenceCity: "ROMA",
              residenceProvince: "RM",
            },
            CHECK_IN,
            CHECK_OUT,
          ),
        ).toEqual({
          bookingGuestId: "guest-adult",
          guestTypeCode: null,
          tariff: null,
          taxAmount: null,
          intermediary: null,
          source: "AUTO",
          status: "REVIEW_REQUIRED",
          reason:
            "FISCAL_CLASSIFICATION_REQUIRED",
        });
      },
    );

    it(
      "crea classificazione AUTO quando non esiste",
      async () => {
        const findByBookingGuestId =
          vi.fn().mockResolvedValue(null);

        const upsert =
          vi.fn().mockResolvedValue(undefined);

        const results =
          await classifyAndPersistBookingGuests({
            booking: {
              id: "booking-1",
              checkIn: CHECK_IN,
              checkOut: CHECK_OUT,
              bookingGuests: [
                {
                  id: "guest-1",
                  birthDate: new Date(
                    "2010-01-01T00:00:00.000Z",
                  ),
                  residenceCountry: "ITALIA",
                  residenceCity: "ROMA",
                  residenceProvince: "RM",
                },
              ],
            },
            repository: {
              findByBookingGuestId,
              upsert,
            },
          });

        expect(
          findByBookingGuestId,
        ).toHaveBeenCalledWith("guest-1");

        expect(upsert).toHaveBeenCalledTimes(1);

        expect(results).toEqual([
          {
            bookingGuestId: "guest-1",
            action: "UPSERTED",
            classification:
              expect.objectContaining({
                bookingGuestId: "guest-1",
                guestTypeCode: 2,
                tariff: 0,
                taxAmount: 0,
                source: "AUTO",
                status: "CLASSIFIED",
              }),
          },
        ]);
      },
    );

    it(
      "ricalcola e aggiorna una precedente classificazione AUTO",
      async () => {
        const findByBookingGuestId =
          vi.fn().mockResolvedValue({
            bookingGuestId: "guest-1",
            source: "AUTO",
          });

        const upsert =
          vi.fn().mockResolvedValue(undefined);

        const results =
          await classifyAndPersistBookingGuests({
            booking: {
              id: "booking-1",
              checkIn: CHECK_IN,
              checkOut: CHECK_OUT,
              bookingGuests: [
                {
                  id: "guest-1",
                  birthDate: new Date(
                    "1980-01-01T00:00:00.000Z",
                  ),
                  residenceCountry: "ITALIA",
                  residenceCity: "MILANO",
                  residenceProvince: "MI",
                },
              ],
            },
            repository: {
              findByBookingGuestId,
              upsert,
            },
          });

        expect(upsert).toHaveBeenCalledTimes(1);

        expect(upsert).toHaveBeenCalledWith({
          where: {
            bookingGuestId: "guest-1",
          },
          create: expect.objectContaining({
            guestTypeCode: 13,
            tariff: 0,
            taxAmount: 0,
            source: "AUTO",
          }),
          update: expect.objectContaining({
            guestTypeCode: 13,
            tariff: 0,
            taxAmount: 0,
            source: "AUTO",
            status: "CLASSIFIED",
            reason: "MILAN_RESIDENT",
          }),
        });

        expect(results[0]).toEqual(
          expect.objectContaining({
            action: "UPSERTED",
          }),
        );
      },
    );

    it(
      "non sovrascrive mai una classificazione MANUAL",
      async () => {
        const findByBookingGuestId =
          vi.fn().mockResolvedValue({
            bookingGuestId: "guest-manual",
            source: "MANUAL",
          });

        const upsert =
          vi.fn().mockResolvedValue(undefined);

        const results =
          await classifyAndPersistBookingGuests({
            booking: {
              id: "booking-1",
              checkIn: CHECK_IN,
              checkOut: CHECK_OUT,
              bookingGuests: [
                {
                  id: "guest-manual",
                  birthDate: new Date(
                    "2010-01-01T00:00:00.000Z",
                  ),
                  residenceCountry: "ITALIA",
                  residenceCity: "MILANO",
                  residenceProvince: "MI",
                },
              ],
            },
            repository: {
              findByBookingGuestId,
              upsert,
            },
          });

        expect(
          findByBookingGuestId,
        ).toHaveBeenCalledWith(
          "guest-manual",
        );

        expect(upsert).not.toHaveBeenCalled();

        expect(results).toEqual([
          {
            bookingGuestId: "guest-manual",
            action: "PRESERVED_MANUAL",
          },
        ]);
      },
    );

    it(
      "gestisce insieme AUTO e MANUAL senza contaminazioni",
      async () => {
        const findByBookingGuestId =
          vi.fn(async (guestId: string) => {
            if (
              guestId === "guest-manual"
            ) {
              return {
                bookingGuestId: guestId,
                source: "MANUAL" as const,
              };
            }

            return null;
          });

        const upsert =
          vi.fn().mockResolvedValue(undefined);

        const results =
          await classifyAndPersistBookingGuests({
            booking: {
              id: "booking-mixed",
              checkIn: CHECK_IN,
              checkOut: CHECK_OUT,
              bookingGuests: [
                {
                  id: "guest-auto",
                  birthDate: new Date(
                    "2010-01-01T00:00:00.000Z",
                  ),
                  residenceCountry: "ITALIA",
                  residenceCity: "ROMA",
                  residenceProvince: "RM",
                },
                {
                  id: "guest-manual",
                  birthDate: new Date(
                    "1980-01-01T00:00:00.000Z",
                  ),
                  residenceCountry: "ITALIA",
                  residenceCity: "MILANO",
                  residenceProvince: "MI",
                },
              ],
            },
            repository: {
              findByBookingGuestId,
              upsert,
            },
          });

        expect(upsert).toHaveBeenCalledTimes(1);

        expect(upsert).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              bookingGuestId: "guest-auto",
            },
            create: expect.objectContaining({
              guestTypeCode: 2,
              tariff: 0,
              taxAmount: 0,
              source: "AUTO",
            }),
          }),
        );

        expect(results).toEqual([
          expect.objectContaining({
            bookingGuestId: "guest-auto",
            action: "UPSERTED",
          }),
          {
            bookingGuestId: "guest-manual",
            action: "PRESERVED_MANUAL",
          },
        ]);
      },
    );
  },
);
