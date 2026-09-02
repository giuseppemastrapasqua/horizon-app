import { prisma } from "@/lib/prisma";

import { AlloggiatiWebAdapter } from "./adapter";
import { createRuntimeAlloggiatiWebCredentialProvider } from "./runtime-credential-provider";
import { SoapPreflightAlloggiatiWebTransport } from "./soap-preflight-transport";
import {
  reconcileAlloggiatiTransmission,
  type AlloggiatiReconciliationResult,
} from "./transmission-reconciler";

export async function reconcileRuntimeAlloggiatiTransmission(
  transmissionId: string,
): Promise<AlloggiatiReconciliationResult> {
  const transmission =
    await prisma.alloggiatiWebTransmission.findUnique({
      where: {
        id: transmissionId,
      },
      select: {
        id: true,
        bookingId: true,
        propertyId: true,
        status: true,
      },
    });

  if (!transmission) {
    return {
      status: "CHECK_FAILED",
      transmissionId,
      message:
        "Transmission Alloggiati Web non trovata.",
    };
  }

  const credentialProvider =
    createRuntimeAlloggiatiWebCredentialProvider();

  return reconcileAlloggiatiTransmission(
    transmission,
    {
      loadBooking: async (bookingId) =>
        prisma.booking.findUnique({
          where: {
            id: bookingId,
          },
          select: {
            checkIn: true,
          },
        }),

      getReceipt: async (date) => {
        const credentials =
          await credentialProvider.getCredentials({
            propertyId: transmission.propertyId,
          });

        const adapter =
          new AlloggiatiWebAdapter(
            new SoapPreflightAlloggiatiWebTransport(),
            credentials,
          );

        return adapter.getReceipt(date);
      },
    },
  );
}