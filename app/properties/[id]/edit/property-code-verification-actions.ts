"use server";

import { revalidatePath } from "next/cache";

import { enqueueBackgroundJob } from "@/lib/job/enqueue-background-job";
import { prisma } from "@/lib/prisma";

function normalizePropertyCode(value: string | null) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

export async function requestPropertyCodeVerificationAction(
  formData: FormData,
): Promise<void> {
  const propertyId = String(
    formData.get("propertyId") ?? "",
  ).trim();

  if (!propertyId) {
    throw new Error(
      "Identificativo immobile mancante.",
    );
  }

  const property =
    await prisma.property.findUnique({
      where: {
        id: propertyId,
      },
      select: {
        cin: true,
        cir: true,
      },
    });

  if (!property) {
    throw new Error("Immobile non trovato.");
  }

  const cin = normalizePropertyCode(
    property.cin,
  );

  const cir = normalizePropertyCode(
    property.cir,
  );

  if (!cin || !cir) {
    throw new Error(
      "Inserisci e salva sia il CIN sia il CIR prima di richiedere la verifica.",
    );
  }

  await prisma.property.update({
    where: {
      id: propertyId,
    },
    data: {
      codeVerificationStatus: "PENDING",
      codeVerifiedAt: null,
      codeVerificationNotes:
        "Verifica dei codici accodata.",
    },
  });

  await enqueueBackgroundJob({
    type: "PROPERTY_CODE_VERIFICATION",
    payload: {
      propertyId,
      cin,
      cir,
    },
    deduplicationKey:
      `property-code-verification:${propertyId}:${cin}:${cir}`,
  });

  revalidatePath(`/properties/${propertyId}`);
  revalidatePath(
    `/properties/${propertyId}/edit`,
  );
}