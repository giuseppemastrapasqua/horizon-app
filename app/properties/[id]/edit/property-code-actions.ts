"use server";

import { revalidatePath } from "next/cache";

import {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
} from "@/lib/audit/constants";
import { enqueueBackgroundJob } from "@/lib/job/enqueue-background-job";
import { prisma } from "@/lib/prisma";
import { AuditService } from "@/services/audit/AuditService";

const PROPERTY_CODE_PATTERN =
  /^[A-Z0-9][A-Z0-9._/-]{2,63}$/;

function normalizePropertyCode(
  value: FormDataEntryValue | null,
) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

function validatePropertyCode(
  code: string,
  label: "CIN" | "CIR",
) {
  if (!code) {
    throw new Error(`${label} obbligatorio.`);
  }

  if (!PROPERTY_CODE_PATTERN.test(code)) {
    throw new Error(
      `${label} non valido. Usa da 3 a 64 caratteri tra lettere, numeri, punto, trattino, barra e underscore.`,
    );
  }
}

export async function updatePropertyCodesAction(
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

  const cin = normalizePropertyCode(
    formData.get("cin"),
  );

  const cir = normalizePropertyCode(
    formData.get("cir"),
  );

  validatePropertyCode(cin, "CIN");
  validatePropertyCode(cir, "CIR");

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

  const currentCin = normalizePropertyCode(
    property.cin,
  );

  const currentCir = normalizePropertyCode(
    property.cir,
  );

  const codesChanged =
    currentCin !== cin || currentCir !== cir;

  await prisma.property.update({
    where: {
      id: propertyId,
    },
    data: {
      cin,
      cir,

      ...(codesChanged
        ? {
            codeVerificationStatus: "PENDING",
            codeVerifiedAt: null,
            codeVerificationNotes: null,
          }
        : {}),
    },
  });

  if (codesChanged) {
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

    await AuditService.log({
      propertyId,
      action: AUDIT_ACTIONS.UPDATE,
      entityType:
        AUDIT_ENTITY_TYPES.PROPERTY_CODES,
      entityId: propertyId,
      description:
        "Codici CIN e CIR aggiornati. Verifica avviata.",
      metadata: {
        previousCin: property.cin,
        previousCir: property.cir,
        cin,
        cir,
      },
    });
  }

  revalidatePath(`/properties/${propertyId}`);
  revalidatePath(
    `/properties/${propertyId}/edit`,
  );
}