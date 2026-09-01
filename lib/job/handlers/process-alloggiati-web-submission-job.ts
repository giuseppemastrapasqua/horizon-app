import type { BackgroundJob } from "@prisma/client";

type AlloggiatiWebSubmissionPayload = {
  bookingId?: string;
  propertyId?: string;
};

export async function processAlloggiatiWebSubmissionJob(
  job: BackgroundJob,
): Promise<void> {
  const payload =
    job.payload as AlloggiatiWebSubmissionPayload;

  if (!payload.bookingId) {
    throw new Error(
      "ALLOGGIATI_WEB_SUBMISSION senza bookingId.",
    );
  }

  if (!payload.propertyId) {
    throw new Error(
      "ALLOGGIATI_WEB_SUBMISSION senza propertyId.",
    );
  }

  throw new Error(
    "Alloggiati Web adapter non ancora configurato.",
  );
}