import { prisma } from "@/lib/prisma";

import { prismaBookingDomainService } from "../shared/prisma-booking-domain-service";
import {
  synchronizeExternalBookings,
  type SynchronizeExternalBookingsResult,
} from "../shared/synchronize-external-bookings";

import { createIcalBookingClientFromConnection } from "./create-ical-booking-client-from-connection";

const SYNC_STATUS_SUCCESS =
  "SUCCESS";

const SYNC_STATUS_ERROR =
  "ERROR";

export type SynchronizeIcalConnectionPropertyInput = {
  connectionId: string;
  propertyId: string;

  updatedAfter?: Date;
  pageLimit?: number;
  maxPages?: number;
};

export async function synchronizeIcalConnectionProperty({
  connectionId,
  propertyId,
  updatedAfter,
  pageLimit,
  maxPages,
}: SynchronizeIcalConnectionPropertyInput): Promise<SynchronizeExternalBookingsResult> {
  const normalizedConnectionId =
    connectionId.trim();

  const normalizedPropertyId =
    propertyId.trim();

  if (!normalizedConnectionId) {
    throw new Error(
      "integrationConnectionId non valido.",
    );
  }

  if (!normalizedPropertyId) {
    throw new Error(
      "propertyId non valido.",
    );
  }

  try {
    const client =
      await createIcalBookingClientFromConnection({
        connectionId:
          normalizedConnectionId,

        propertyId:
          normalizedPropertyId,
      });

    const result =
      await synchronizeExternalBookings(
        client,
        prismaBookingDomainService,
        {
          updatedAfter,
          pageLimit,
          maxPages,
        },
      );

    await prisma.integrationConnection.update({
      where: {
        id:
          normalizedConnectionId,
      },

      data: {
        lastSyncAt:
          result.completedAt,

        lastSyncStatus:
          SYNC_STATUS_SUCCESS,

        lastSyncError:
          null,
      },
    });

    return result;
  } catch (error) {
    const failedAt =
      new Date();

    const errorMessage =
      getErrorMessage(error);

    /*
     * Proviamo a registrare il fallimento
     * senza sostituire l'errore originale
     * della sincronizzazione.
     */
    try {
      await prisma.integrationConnection.update({
        where: {
          id:
            normalizedConnectionId,
        },

        data: {
          lastSyncAt:
            failedAt,

          lastSyncStatus:
            SYNC_STATUS_ERROR,

          lastSyncError:
            errorMessage,
        },
      });
    } catch {
      /*
       * Lo stato di sync è diagnostico.
       *
       * Se il suo aggiornamento fallisce,
       * il chiamante deve comunque ricevere
       * l'errore originale che ha causato
       * il fallimento della sincronizzazione.
       */
    }

    throw error;
  }
}

function getErrorMessage(
  error: unknown,
): string {
  if (
    error instanceof Error
  ) {
    return error.message;
  }

  return "Errore sconosciuto durante la sincronizzazione iCal.";
}