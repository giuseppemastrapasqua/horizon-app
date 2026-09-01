import type {
  BackgroundJob,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

type AlloggiatiWebSubmissionPayload = {
  bookingId: string;
  propertyId: string;
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
  key: keyof AlloggiatiWebSubmissionPayload,
): string {
  const value = payload[key];

  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    throw new Error(
      `ALLOGGIATI_WEB_SUBMISSION senza ${key}.`,
    );
  }

  return value.trim();
}

function parsePayload(
  payload: Prisma.JsonValue,
): AlloggiatiWebSubmissionPayload {
  if (!isJsonObject(payload)) {
    throw new Error(
      "ALLOGGIATI_WEB_SUBMISSION con payload JSON non valido.",
    );
  }

  return {
    bookingId: readRequiredString(
      payload,
      "bookingId",
    ),
    propertyId: readRequiredString(
      payload,
      "propertyId",
    ),
  };
}

export async function processAlloggiatiWebSubmissionJob(
  job: BackgroundJob,
): Promise<void> {
  if (job.type !== "ALLOGGIATI_WEB_SUBMISSION") {
    throw new Error(
      `Tipo di job non supportato dall'handler Alloggiati Web: ${job.type}.`,
    );
  }

  const payload = parsePayload(job.payload);

  const booking = await prisma.booking.findUnique({
    where: {
      id: payload.bookingId,
    },
    select: {
      id: true,
      propertyId: true,
      checkIn: true,
      checkOut: true,
      nights: true,
      guests: true,
      bookingGuests: {
        select: {
          role: true,
          firstName: true,
          lastName: true,
          gender: true,
          birthDate: true,
          birthCity: true,
          birthProvince: true,
          birthCountry: true,
          citizenship: true,
          documentType: true,
          documentNumber: true,
          documentIssueCountry: true,
          documentIssueCity: true,
        },
      },
    },
  });

  if (!booking) {
    throw new Error(
      `Prenotazione Alloggiati non trovata: ${payload.bookingId}.`,
    );
  }

  if (booking.propertyId !== payload.propertyId) {
    throw new Error(
      "La prenotazione Alloggiati non appartiene alla struttura del job.",
    );
  }

  const mapping =
    await prisma.integrationPropertyMapping.findUnique({
      where: {
        provider_propertyId: {
          provider: "ALLOGGIATI_WEB",
          propertyId: payload.propertyId,
        },
      },
      select: {
        externalPropertyId: true,
      },
    });

  if (!mapping) {
    throw new Error(
      "Mapping ALLOGGIATI_WEB non configurato per la struttura.",
    );
  }

  if (booking.nights < 1 || booking.nights > 30) {
    throw new Error(
      "Permanenza Alloggiati non valida: deve essere tra 1 e 30 giorni.",
    );
  }

  if (booking.guests !== booking.bookingGuests.length) {
    throw new Error(
      "Dati ospiti Alloggiati incompleti rispetto alla prenotazione.",
    );
  }

  throw new Error(
    "Alloggiati Web reference resolver e trasporto reale non ancora configurati.",
  );
}
