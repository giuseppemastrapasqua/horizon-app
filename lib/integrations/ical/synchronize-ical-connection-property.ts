import { prisma } from "@/lib/prisma";

import { createIcalBookingClientFromConnection } from "./create-ical-booking-client-from-connection";
import {
  synchronizeIcalAvailability,
  type SynchronizeIcalAvailabilityResult,
} from "./synchronize-ical-availability";

const SYNC_STATUS_SUCCESS =
  "SUCCESS";

const SYNC_STATUS_ERROR =
  "ERROR";

export type SynchronizeIcalConnectionPropertyInput = {
  connectionId: string;
  propertyId: string;

  /*
   * Mantenuti per compatibilità con i
   * chiamanti esistenti.
   *
   * Un feed iCal è uno snapshot completo:
   * non deve essere riconciliato tramite
   * paginazione o updatedAfter.
   */
  updatedAfter?: Date;
  pageLimit?: number;
  maxPages?: number;
};

export async function synchronizeIcalConnectionProperty({
  connectionId,
  propertyId,
}: SynchronizeIcalConnectionPropertyInput): Promise<SynchronizeIcalAvailabilityResult> {
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

    /*
     * La factory valida già il mapping.
     * Recuperiamo qui soltanto il suo ID
     * senza cambiare il contratto della
     * factory e i relativi test.
     */
    const connectionProperty =
      await prisma.integrationConnectionProperty.findUnique({
        where: {
          connectionId_propertyId: {
            connectionId:
              normalizedConnectionId,

            propertyId:
              normalizedPropertyId,
          },
        },

        select: {
          id: true,
          propertyId: true,
        },
      });

    if (!connectionProperty) {
      throw new Error(
        `Nessuna proprietà "${normalizedPropertyId}" associata alla connessione "${normalizedConnectionId}".`,
      );
    }

    if (
      connectionProperty.propertyId !==
      normalizedPropertyId
    ) {
      throw new Error(
        "Il mapping iCal appartiene a una struttura diversa da quella richiesta.",
      );
    }

    const result =
      await synchronizeIcalAvailability({
        client,

        integrationConnectionPropertyId:
          connectionProperty.id,

        propertyId:
          normalizedPropertyId,
      });

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
     * Lo stato diagnostico non deve mai
     * sostituire l'errore originale.
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
       * Manteniamo l'errore originale
       * della sincronizzazione.
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
