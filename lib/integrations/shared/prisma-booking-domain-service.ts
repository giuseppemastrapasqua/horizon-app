import { createHash } from "node:crypto";

import {
  AuditAction,
  BookingOperationalStatus,
  BookingStatus,
} from "@prisma/client";

import { AUDIT_ENTITY_TYPES } from "@/lib/audit/constants";
import { emitEvent } from "@/lib/events/emit";
import { findOrCreateGuest } from "@/lib/guests/find-or-create-guest";
import { prisma } from "@/lib/prisma";
import { AuditService } from "@/services/audit/AuditService";

import type { BookingUpsertInput } from "./booking-upsert-input";
import type { BookingDomainService } from "./domain-booking-service";
import type { ExternalPropertyResolver } from "./external-property-resolver";
import { prismaExternalPropertyResolver } from "./prisma-external-property-resolver";
import { EXTERNAL_BOOKING_STATUSES } from "./types";

const MILLISECONDS_PER_DAY =
  1000 * 60 * 60 * 24;

function calculateNights(
  checkIn: Date,
  checkOut: Date,
): number {
  const difference =
    checkOut.getTime() -
    checkIn.getTime();

  if (difference <= 0) {
    throw new Error(
      "Il check-out deve essere successivo al check-in.",
    );
  }

  return Math.ceil(
    difference /
      MILLISECONDS_PER_DAY,
  );
}

function mapExternalBookingStatus(
  status: string,
): BookingStatus {
  switch (status) {
    case EXTERNAL_BOOKING_STATUSES.PENDING:
      return BookingStatus.PENDING;

    case EXTERNAL_BOOKING_STATUSES.CONFIRMED:
      return BookingStatus.CONFIRMED;

    case EXTERNAL_BOOKING_STATUSES.CHECKED_IN:
      return BookingStatus.CHECKED_IN;

    case EXTERNAL_BOOKING_STATUSES.CHECKED_OUT:
      return BookingStatus.CHECKED_OUT;

    case EXTERNAL_BOOKING_STATUSES.CANCELLED:
      return BookingStatus.CANCELLED;

    default:
      throw new Error(
        `Stato esterno della prenotazione non supportato: "${status}".`,
      );
  }
}

function optionalText(
  value?: string,
): string | null {
  const normalizedValue =
    value?.trim();

  return normalizedValue || null;
}

function optionalConnectionId(
  value?: string,
): string | null {
  const normalizedValue =
    value?.trim();

  return normalizedValue || null;
}

function createBookingUpdateFingerprint({
  booking,
  bookingStatus,
  guestName,
  guestEmail,
  guestPhone,
  propertyId,
  ownerId,
  nights,
  integrationConnectionId,
}: {
  booking: BookingUpsertInput;
  bookingStatus: BookingStatus;
  guestName: string;
  guestEmail: string | null;
  guestPhone: string | null;
  propertyId: string;
  ownerId: string;
  nights: number;
  integrationConnectionId: string | null;
}): string {
  const serializedState =
    JSON.stringify({
      integrationConnectionId,

      propertyId,
      ownerId,

      guestName,
      guestEmail,
      guestPhone,

      checkIn:
        booking.checkIn.toISOString(),

      checkOut:
        booking.checkOut.toISOString(),

      nights,
      guests:
        booking.guests,

      grossAmount:
        booking.grossAmount,

      currency:
        booking.currency,

      bookingStatus,
    });

  return createHash("sha256")
    .update(serializedState)
    .digest("hex");
}

export class PrismaBookingDomainService
  implements BookingDomainService
{
  constructor(
    private readonly propertyResolver: ExternalPropertyResolver =
      prismaExternalPropertyResolver,
  ) {}

  async upsertBooking(
    booking: BookingUpsertInput,
  ): Promise<{
    inserted: number;
    updated: number;
    skipped: number;
  }> {
    const integrationConnectionId =
      optionalConnectionId(
        booking.integrationConnectionId,
      );

    const resolvedProperty =
      await this.propertyResolver.resolveProperty({
        provider:
          booking.provider,

        externalPropertyId:
          booking.externalPropertyId,

        integrationConnectionId:
          integrationConnectionId ??
          undefined,
      });

    if (!resolvedProperty) {
      throw new Error(
        `Nessun immobile Horizon associato alla proprietà esterna "${booking.externalPropertyId}" del provider "${booking.provider}".`,
      );
    }

    const nights =
      calculateNights(
        booking.checkIn,
        booking.checkOut,
      );

    const bookingStatus =
      mapExternalBookingStatus(
        booking.externalStatus,
      );

    const guestName =
      booking.guestFullName.trim();

    if (!guestName) {
      throw new Error(
        "Il nome dell'ospite è obbligatorio.",
      );
    }

    const guestEmail =
      optionalText(
        booking.guestEmail,
      );

    const guestPhone =
      optionalText(
        booking.guestPhone,
      );

    return prisma.$transaction(
      async (transaction) => {
        /*
         * Nuovo framework:
         *
         * integrationConnectionId +
         * externalBookingId
         *
         * identificano in modo univoco
         * la booking all'interno della
         * specifica sorgente.
         *
         * Legacy:
         *
         * quando non esiste ancora una
         * IntegrationConnection usiamo
         * channel + externalBookingId e
         * richiediamo esplicitamente
         * integrationConnectionId=null.
         */
        const existingBooking =
          integrationConnectionId
            ? await transaction.booking.findUnique({
                where: {
                  integrationConnectionId_externalBookingId:
                    {
                      integrationConnectionId,
                      externalBookingId:
                        booking.externalBookingId,
                    },
                },
                select: {
                  id: true,

                  integrationConnectionId:
                    true,

                  propertyId:
                    true,

                  ownerId:
                    true,

                  guestId:
                    true,

                  guestName:
                    true,

                  guestEmail:
                    true,

                  guestPhone:
                    true,

                  checkIn:
                    true,

                  checkOut:
                    true,

                  nights:
                    true,

                  guests:
                    true,

                  grossAmount:
                    true,

                  currency:
                    true,

                  bookingStatus:
                    true,

                  operationalStatus:
                    true,
                },
              })
            : await transaction.booking.findFirst({
                where: {
                  integrationConnectionId:
                    null,

                  channel:
                    booking.channel,

                  externalBookingId:
                    booking.externalBookingId,
                },
                select: {
                  id: true,

                  integrationConnectionId:
                    true,

                  propertyId:
                    true,

                  ownerId:
                    true,

                  guestId:
                    true,

                  guestName:
                    true,

                  guestEmail:
                    true,

                  guestPhone:
                    true,

                  checkIn:
                    true,

                  checkOut:
                    true,

                  nights:
                    true,

                  guests:
                    true,

                  grossAmount:
                    true,

                  currency:
                    true,

                  bookingStatus:
                    true,

                  operationalStatus:
                    true,
                },
              });

        const { guest } =
          await findOrCreateGuest(
            {
              fullName:
                guestName,

              email:
                guestEmail,

              phone:
                guestPhone,
            },
            transaction,
          );

        if (!existingBooking) {
          const createdBooking =
            await transaction.booking.create({
              data: {
                propertyId:
                  resolvedProperty.propertyId,

                ownerId:
                  resolvedProperty.ownerId,

                guestId:
                  guest.id,

                channel:
                  booking.channel,

                externalBookingId:
                  booking.externalBookingId,

                integrationConnectionId,

                guestName,
                guestEmail,
                guestPhone,

                checkIn:
                  booking.checkIn,

                checkOut:
                  booking.checkOut,

                nights,

                guests:
                  booking.guests,

                grossAmount:
                  booking.grossAmount,

                currency:
                  booking.currency,

                bookingStatus,

                operationalStatus:
                  BookingOperationalStatus.OK,
              },
            });

          await AuditService.log(
            {
              action:
                AuditAction.CREATE,

              propertyId:
                resolvedProperty.propertyId,

              entityType:
                AUDIT_ENTITY_TYPES.BOOKING,

              entityId:
                createdBooking.id,

              description:
                "Prenotazione sincronizzata creata.",

              metadata: {
                provider:
                  booking.provider,

                integrationConnectionId,

                externalBookingId:
                  booking.externalBookingId,

                externalPropertyId:
                  booking.externalPropertyId,

                channel:
                  booking.channel,

                bookingStatus,
              },
            },
            transaction,
          );

          await emitEvent(
            {
              eventType:
                "BOOKING_CREATED",

              aggregateType:
                "BOOKING",

              aggregateId:
                createdBooking.id,

              payload: {
                bookingId:
                  createdBooking.id,

                propertyId:
                  createdBooking.propertyId,

                ownerId:
                  createdBooking.ownerId,

                guestName:
                  createdBooking.guestName,

                checkIn:
                  createdBooking.checkIn.toISOString(),

                checkOut:
                  createdBooking.checkOut.toISOString(),

                channel:
                  createdBooking.channel,

                provider:
                  booking.provider,

                integrationConnectionId,

                externalBookingId:
                  booking.externalBookingId,
              },

              idempotencyKey:
                `BOOKING_CREATED:${createdBooking.id}`,
            },
            transaction,
          );

          return {
            inserted: 1,
            updated: 0,
            skipped: 0,
          };
        }

        const hasChanges =
          existingBooking.integrationConnectionId !==
            integrationConnectionId ||

          existingBooking.propertyId !==
            resolvedProperty.propertyId ||

          existingBooking.ownerId !==
            resolvedProperty.ownerId ||

          existingBooking.guestId !==
            guest.id ||

          existingBooking.guestName !==
            guestName ||

          existingBooking.guestEmail !==
            guestEmail ||

          existingBooking.guestPhone !==
            guestPhone ||

          existingBooking.checkIn.getTime() !==
            booking.checkIn.getTime() ||

          existingBooking.checkOut.getTime() !==
            booking.checkOut.getTime() ||

          existingBooking.nights !==
            nights ||

          existingBooking.guests !==
            booking.guests ||

          Number(
            existingBooking.grossAmount,
          ) !==
            booking.grossAmount ||

          existingBooking.currency !==
            booking.currency ||

          existingBooking.bookingStatus !==
            bookingStatus;

        if (!hasChanges) {
          return {
            inserted: 0,
            updated: 0,
            skipped: 1,
          };
        }

        await transaction.booking.update({
          where: {
            id:
              existingBooking.id,
          },

          data: {
            integrationConnectionId,

            propertyId:
              resolvedProperty.propertyId,

            ownerId:
              resolvedProperty.ownerId,

            guestId:
              guest.id,

            guestName,
            guestEmail,
            guestPhone,

            checkIn:
              booking.checkIn,

            checkOut:
              booking.checkOut,

            nights,

            guests:
              booking.guests,

            grossAmount:
              booking.grossAmount,

            currency:
              booking.currency,

            bookingStatus,
          },
        });

        await AuditService.log(
          {
            action:
              AuditAction.UPDATE,

            propertyId:
              resolvedProperty.propertyId,

            entityType:
              AUDIT_ENTITY_TYPES.BOOKING,

            entityId:
              existingBooking.id,

            description:
              "Prenotazione sincronizzata aggiornata.",

            metadata: {
              provider:
                booking.provider,

              integrationConnectionId,

              externalBookingId:
                booking.externalBookingId,

              externalPropertyId:
                booking.externalPropertyId,

              channel:
                booking.channel,

              previousBookingStatus:
                existingBooking.bookingStatus,

              bookingStatus,
            },
          },
          transaction,
        );

        const eventPayload = {
          bookingId:
            existingBooking.id,

          propertyId:
            resolvedProperty.propertyId,

          ownerId:
            resolvedProperty.ownerId,

          guestName,

          checkIn:
            booking.checkIn.toISOString(),

          checkOut:
            booking.checkOut.toISOString(),

          channel:
            booking.channel,

          provider:
            booking.provider,

          integrationConnectionId,

          externalBookingId:
            booking.externalBookingId,
        };

        const becameCancelled =
          bookingStatus ===
            BookingStatus.CANCELLED &&
          existingBooking.bookingStatus !==
            BookingStatus.CANCELLED;

        if (becameCancelled) {
          await emitEvent(
            {
              eventType:
                "BOOKING_CANCELLED",

              aggregateType:
                "BOOKING",

              aggregateId:
                existingBooking.id,

              payload:
                eventPayload,

              idempotencyKey:
                `BOOKING_CANCELLED:${existingBooking.id}`,
            },
            transaction,
          );
        } else if (
          bookingStatus !==
          BookingStatus.CANCELLED
        ) {
          const fingerprint =
            createBookingUpdateFingerprint({
              booking,
              bookingStatus,
              guestName,
              guestEmail,
              guestPhone,

              propertyId:
                resolvedProperty.propertyId,

              ownerId:
                resolvedProperty.ownerId,

              nights,

              integrationConnectionId,
            });

          await emitEvent(
            {
              eventType:
                "BOOKING_UPDATED",

              aggregateType:
                "BOOKING",

              aggregateId:
                existingBooking.id,

              payload:
                eventPayload,

              idempotencyKey:
                `BOOKING_UPDATED:${existingBooking.id}:${fingerprint}`,
            },
            transaction,
          );
        }

        return {
          inserted: 0,
          updated: 1,
          skipped: 0,
        };
      },
    );
  }
}

export const prismaBookingDomainService =
  new PrismaBookingDomainService();