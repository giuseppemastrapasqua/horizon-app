"use server";

import { revalidatePath } from "next/cache";

import { requirePropertyAccess } from "@/lib/auth/guards";
import { enqueueBackgroundJob } from "@/lib/job/enqueue-background-job";
import { prisma } from "@/lib/prisma";
import { upsertIntegrationPropertyMapping } from "@/lib/integrations/shared/upsert-integration-property-mapping";
import {
  INTEGRATION_PROVIDERS,
  type IntegrationProvider,
} from "@/lib/integrations/shared/types";

function isIntegrationProvider(
  value: string,
): value is IntegrationProvider {
  return Object.values(
    INTEGRATION_PROVIDERS,
  ).includes(value as IntegrationProvider);
}

export async function updatePropertyIntegrationAction(
  formData: FormData,
): Promise<void> {
  const propertyId = String(
    formData.get("propertyId") ?? "",
  ).trim();

  const providerValue = String(
    formData.get("provider") ?? "",
  ).trim();

  const externalPropertyId = String(
    formData.get("externalPropertyId") ?? "",
  ).trim();

  if (!propertyId) {
    throw new Error(
      "Identificativo immobile mancante.",
    );
  }

  await requirePropertyAccess(propertyId);

  if (!providerValue) {
    throw new Error(
      "Provider di integrazione mancante.",
    );
  }

  if (!isIntegrationProvider(providerValue)) {
    throw new Error(
      `Provider di integrazione non valido: "${providerValue}".`,
    );
  }

  if (!externalPropertyId) {
    throw new Error(
      "Inserisci l’identificativo esterno dell’immobile.",
    );
  }

  await upsertIntegrationPropertyMapping({
    provider: providerValue,
    propertyId,
    externalPropertyId,
  });

  revalidatePropertyPaths(propertyId);
}

export async function synchronizePropertyIntegrationAction(
  formData: FormData,
): Promise<void> {
  const propertyId = String(
    formData.get("propertyId") ?? "",
  ).trim();

  const providerValue = String(
    formData.get("provider") ?? "",
  ).trim();

  if (!propertyId) {
    throw new Error(
      "Identificativo immobile mancante.",
    );
  }

  await requirePropertyAccess(propertyId);

  if (!isIntegrationProvider(providerValue)) {
    throw new Error(
      `Provider di integrazione non valido: "${providerValue}".`,
    );
  }

  if (
    providerValue !==
    INTEGRATION_PROVIDERS.BOOKING_COM
  ) {
    throw new Error(
      `La sincronizzazione per "${providerValue}" non è ancora disponibile.`,
    );
  }

  const mapping =
    await prisma.integrationPropertyMapping.findFirst({
      where: {
        propertyId,
        provider: "BOOKING_COM",
      },
      select: {
        externalPropertyId: true,
      },
    });

  if (!mapping) {
    throw new Error(
      "Configurazione Booking.com non trovata per questo immobile.",
    );
  }

  const externalPropertyId =
    mapping.externalPropertyId;

  await enqueueBackgroundJob({
    type: "BOOKING_SYNC",
    payload: {
      provider: providerValue,
      externalPropertyId,
      pageLimit: 50,
      maxPages: 20,
    },
    deduplicationKey:
      `booking-sync:${providerValue}:${propertyId}:${externalPropertyId}`,
  });

  revalidatePropertyPaths(propertyId);
}

function revalidatePropertyPaths(
  propertyId: string,
): void {
  revalidatePath(
    `/properties/${propertyId}`,
  );

  revalidatePath(
    `/properties/${propertyId}/edit`,
  );
}