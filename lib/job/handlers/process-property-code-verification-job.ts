import type {
  BackgroundJob,
  Prisma,
} from "@prisma/client";
import { AuditAction } from "@prisma/client";

import { AUDIT_ENTITY_TYPES } from "@/lib/audit/constants";
import { prisma } from "@/lib/prisma";
import { verifyPropertyCodes } from "@/lib/properties/verify-property-codes";
import { AuditService } from "@/services/audit/AuditService";

type PropertyCodeVerificationJobPayload = {
  propertyId: string;
  cin: string;
  cir: string;
};

function isJsonObject(
  value: Prisma.JsonValue,
): value is Prisma.JsonObject {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function readRequiredString(
  payload: Prisma.JsonObject,
  key: keyof PropertyCodeVerificationJobPayload,
): string {
  const value = payload[key];

  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    throw new Error(
      `Il payload del job non contiene un valore valido per "${key}".`,
    );
  }

  return value.trim();
}

function parsePayload(
  payload: Prisma.JsonValue,
): PropertyCodeVerificationJobPayload {
  if (!isJsonObject(payload)) {
    throw new Error(
      "Il payload del job di verifica CIN/CIR non è un oggetto JSON valido.",
    );
  }

  return {
    propertyId: readRequiredString(
      payload,
      "propertyId",
    ),
    cin: readRequiredString(
      payload,
      "cin",
    ).toUpperCase(),
    cir: readRequiredString(
      payload,
      "cir",
    ).toUpperCase(),
  };
}

function normalizeCode(
  value: string | null,
): string | null {
  return value?.trim().toUpperCase() ?? null;
}

export async function processPropertyCodeVerificationJob(
  job: BackgroundJob,
): Promise<void> {
  if (job.type !== "PROPERTY_CODE_VERIFICATION") {
    throw new Error(
      `Tipo di job non supportato dall'handler CIN/CIR: ${job.type}.`,
    );
  }

  const payload = parsePayload(job.payload);

  const property = await prisma.property.findUnique({
    where: {
      id: payload.propertyId,
    },
    select: {
      id: true,
      name: true,
      address: true,
      city: true,
      cin: true,
      cir: true,
    },
  });

  if (!property) {
    return;
  }

  const currentCin = normalizeCode(property.cin);
  const currentCir = normalizeCode(property.cir);

  if (
    currentCin !== payload.cin ||
    currentCir !== payload.cir
  ) {
    return;
  }

  const result = await verifyPropertyCodes({
    cin: payload.cin,
    cir: payload.cir,
    propertyName: property.name,
    address: property.address,
    city: property.city,
  });

  await prisma.$transaction(async (transaction) => {
    const updatedProperty =
      await transaction.property.updateMany({
        where: {
          id: property.id,
          cin: payload.cin,
          cir: payload.cir,
          codeVerificationStatus: "PENDING",
        },
        data: {
          codeVerificationStatus: result.status,
          codeVerifiedAt: result.verifiedAt,
          codeVerificationNotes: result.notes,
        },
      });

    if (updatedProperty.count === 0) {
      return;
    }

    const verification =
      await transaction.propertyCodeVerification.create({
        data: {
          propertyId: property.id,
          provider: result.provider,
          cin: payload.cin,
          cir: payload.cir,
          status: result.status,
          notes: result.notes,
          rawResponse:
            result.rawResponse ?? undefined,
        },
      });

    await AuditService.log(
      {
        action: AuditAction.COMPLETE,
        propertyId: property.id,
        entityType:
          AUDIT_ENTITY_TYPES.PROPERTY_CODES,
        entityId: verification.id,
        description: `Verifica CIN/CIR completata con stato ${result.status}.`,
        metadata: {
          status: result.status,
          provider: result.provider,
          cin: payload.cin,
          cir: payload.cir,
        },
      },
      transaction,
    );
  });
}