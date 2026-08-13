import { BookingChannel } from "@prisma/client";

import {
  EXTERNAL_BOOKING_STATUSES,
  INTEGRATION_PROVIDERS,
  type NormalizedExternalBooking,
} from "@/lib/integrations/shared/types";

import type { IcalBookingEvent } from "./types";

const DEFAULT_GUEST_NAME =
  "Prenotazione iCal";

export type MapIcalEventToBookingInput = {
  event: IcalBookingEvent;

  externalPropertyId: string;

  channel: BookingChannel;
};

export function mapIcalEventToBooking({
  event,
  externalPropertyId,
  channel,
}: MapIcalEventToBookingInput): NormalizedExternalBooking {
  const normalizedUid =
    event.uid.trim();

  const normalizedPropertyId =
    externalPropertyId.trim();

  if (!normalizedUid) {
    throw new Error(
      "L'evento iCal non contiene un UID valido.",
    );
  }

  if (!normalizedPropertyId) {
    throw new Error(
      "La connessione iCal non contiene un externalPropertyId valido.",
    );
  }

  const checkIn =
    new Date(event.start);

  const checkOut =
    new Date(event.end);

  if (
    Number.isNaN(
      checkIn.getTime(),
    )
  ) {
    throw new Error(
      `L'evento iCal "${normalizedUid}" contiene una data di check-in non valida.`,
    );
  }

  if (
    Number.isNaN(
      checkOut.getTime(),
    )
  ) {
    throw new Error(
      `L'evento iCal "${normalizedUid}" contiene una data di check-out non valida.`,
    );
  }

  if (checkOut <= checkIn) {
    throw new Error(
      `L'evento iCal "${normalizedUid}" contiene un check-out non successivo al check-in.`,
    );
  }

  const guestName =
    event.summary.trim() ||
    DEFAULT_GUEST_NAME;

  return {
    provider:
      INTEGRATION_PROVIDERS.ICAL,

    channel,

    externalBookingId:
      normalizedUid,

    externalPropertyId:
      normalizedPropertyId,

    status:
      mapIcalStatus(
        event.status,
      ),

    guest: {
      fullName:
        guestName,
    },

    checkIn,
    checkOut,

    /*
     * iCal normalmente non espone
     * il numero reale degli ospiti.
     *
     * Usiamo 1 come valore minimo
     * operativo finché una sorgente
     * più ricca non fornisce il dato.
     */
    guests: 1,

    /*
     * iCal normalmente non contiene
     * informazioni economiche.
     *
     * Non inventiamo quindi alcun
     * valore finanziario.
     */
    grossAmount: 0,

    currency: "EUR",

    rawPayload: {
      uid:
        normalizedUid,

      summary:
        event.summary,

      start:
        event.start.toISOString(),

      end:
        event.end.toISOString(),

      status:
        event.status ?? null,

      description:
        event.description ?? null,

      location:
        event.location ?? null,

      isAllDay:
        event.isAllDay,
    },
  };
}

function mapIcalStatus(
  status?: string,
) {
  const normalizedStatus =
    status
      ?.trim()
      .toUpperCase();

  if (
    normalizedStatus ===
    "CANCELLED"
  ) {
    return EXTERNAL_BOOKING_STATUSES.CANCELLED;
  }

  return EXTERNAL_BOOKING_STATUSES.CONFIRMED;
}