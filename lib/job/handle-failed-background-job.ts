import type { BackgroundJob } from "@prisma/client";

import { prisma } from "@/lib/prisma";

type PropertyCodeVerificationPayload = {
  propertyId: string;
  cin: string;
  cir: string;
};

function isPropertyCodeVerificationPayload(
  payload: unknown,
): payload is PropertyCodeVerificationPayload {
  if (
    typeof payload !== "object" ||
    payload === null ||
    Array.isArray(payload)
  ) {
    return false;
  }

  const value =
    payload as Record<string, unknown>;

  return (
    typeof value.propertyId === "string" &&
    typeof value.cin === "string" &&
    typeof value.cir === "string"
  );
}

export async function handleFailedBackgroundJob(
  job: BackgroundJob,
): Promise<void> {
  if (
    job.status !== "FAILED" ||
    job.type !== "PROPERTY_CODE_VERIFICATION"
  ) {
    return;
  }

  if (
    !isPropertyCodeVerificationPayload(job.payload)
  ) {
    return;
  }

  const {
    propertyId,
    cin,
    cir,
  } = job.payload;

  await prisma.property.updateMany({
    where: {
      id: propertyId,
      cin,
      cir,
      codeVerificationStatus: "PENDING",
    },
    data: {
      codeVerificationStatus: "REVIEW_REQUIRED",
      codeVerifiedAt: null,
      codeVerificationNotes:
        job.lastError ??
        "La verifica automatica dei codici non è riuscita.",
    },
  });
}