import type { BackgroundJob } from "@prisma/client";
import { NonRetryableBackgroundJobError } from "@/lib/job/background-job-errors";
import { prisma } from "@/lib/prisma";
import { PublicAlloggiatiReferenceProvider } from "@/lib/integrations/alloggiati-web/public-reference-provider";
import { prepareRoss1000Transmission } from "@/lib/integrations/ross1000/prepare-transmission";
import { createRuntimeRoss1000CredentialProvider } from "@/lib/integrations/ross1000/runtime-credential-provider";
import { Ross1000SoapTransport } from "@/lib/integrations/ross1000/soap-transport";
import { prismaRoss1000TransmissionStore } from "@/lib/integrations/ross1000/prisma-transmission-store";
import { sendRoss1000Transmission } from "@/lib/integrations/ross1000/transmission-send-orchestrator";

export async function processRoss1000SubmissionJob(
  job: BackgroundJob,
): Promise<void> {
  if (job.type !== "ROSS1000_SUBMISSION")
    throw new NonRetryableBackgroundJobError(
      "Tipo di job ROSS1000 non valido.",
    );
  const payload = job.payload;
  if (!payload || typeof payload !== "object" || Array.isArray(payload))
    throw new NonRetryableBackgroundJobError("Payload ROSS1000 non valido.");
  if (
    typeof payload.transmissionId === "string" &&
    payload.transmissionId.trim()
  ) {
    if (process.env.HORIZON_ROSS1000_SEND_ENABLED !== "true")
      throw new NonRetryableBackgroundJobError("Invio ROSS1000 non abilitato.");
    const transmission = await prismaRoss1000TransmissionStore.getById(
      payload.transmissionId.trim(),
    );
    if (
      !transmission ||
      typeof payload.propertyId !== "string" ||
      transmission.propertyId !== payload.propertyId
    )
      throw new NonRetryableBackgroundJobError(
        "Trasmissione ROSS1000 non associata alla struttura del job.",
      );
    // A completed duplicate job is harmless; SENDING/UNKNOWN are never retried as new sends.
    if (transmission.status === "CONFIRMED") return;
    if (transmission.status !== "PREPARED")
      throw new NonRetryableBackgroundJobError(
        "Trasmissione non pronta o con esito da verificare.",
      );
    await sendRoss1000Transmission(
      transmission.id,
      createRuntimeRoss1000CredentialProvider(),
      new Ross1000SoapTransport(),
      prismaRoss1000TransmissionStore,
    );
    return;
  }
  // Historical booking-event jobs only prepare a payload; they do not send it.
  if (typeof payload.bookingId !== "string" || !payload.bookingId.trim())
    throw new NonRetryableBackgroundJobError(
      "Job ROSS1000 senza prenotazione o trasmissione.",
    );
  const booking = await prisma.booking.findUnique({
    where: { id: payload.bookingId.trim() },
    select: { propertyId: true, checkIn: true, checkOut: true },
  });
  if (!booking)
    throw new NonRetryableBackgroundJobError(
      "Prenotazione ROSS1000 non trovata.",
    );
  if (
    typeof payload.propertyId === "string" &&
    payload.propertyId !== booking.propertyId
  )
    throw new NonRetryableBackgroundJobError(
      "Prenotazione ROSS1000 non associata alla struttura del job.",
    );
  const connection = await prisma.ross1000Property.findUnique({
    where: { propertyId: booking.propertyId },
    select: { id: true },
  });
  if (!connection) return;
  const movementDate = new Date(
    `${job.createdAt.toISOString().slice(0, 10)}T00:00:00.000Z`,
  );
  const nextDay = new Date(movementDate.getTime() + 86400000);
  if (booking.checkIn >= nextDay || booking.checkOut < movementDate) return;
  const resolver = await new PublicAlloggiatiReferenceProvider().getResolver();
  await prepareRoss1000Transmission(booking.propertyId, movementDate, resolver);
}
