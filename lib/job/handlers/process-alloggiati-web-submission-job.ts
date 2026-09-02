import type {
  BackgroundJob,
  Prisma,
} from "@prisma/client";

import type {
  AlloggiatiWebCredentialProvider,
} from "@/lib/integrations/alloggiati-web/credential-provider";
import {
  prepareBookingSubmission,
} from "@/lib/integrations/alloggiati-web/prepare-booking-submission";
import {
  preflightAlloggiatiSubmission,
} from "@/lib/integrations/alloggiati-web/preflight-submission";
import {
  prismaAlloggiatiTransmissionStore,
} from "@/lib/integrations/alloggiati-web/prisma-transmission-store";
import {
  createAlloggiatiSubmissionFingerprint,
} from "@/lib/integrations/alloggiati-web/submission-fingerprint";
import type {
  AlloggiatiWebSubmissionValidator,
} from "@/lib/integrations/alloggiati-web/preflight-submission";
import {
  PublicAlloggiatiReferenceProvider,
} from "@/lib/integrations/alloggiati-web/public-reference-provider";
import type {
  AlloggiatiReferenceResolver,
} from "@/lib/integrations/alloggiati-web/reference-resolver";
import {
  createRuntimeAlloggiatiWebCredentialProvider,
} from "@/lib/integrations/alloggiati-web/runtime-credential-provider";
import {
  createRuntimeAlloggiatiWebValidator,
} from "@/lib/integrations/alloggiati-web/runtime-validator";
import { prisma } from "@/lib/prisma";

type AlloggiatiWebSubmissionPayload = {
  bookingId: string;
  propertyId: string;
};

type ProcessAlloggiatiWebSubmissionJobDependencies = {
  getReferenceResolver?: (
  ) => Promise<AlloggiatiReferenceResolver>;
  prepareSubmission?: typeof prepareBookingSubmission;
  credentialProvider?: AlloggiatiWebCredentialProvider;
  createValidator?: (
    credentials: {
      username: string;
      password: string;
      wsKey: string;
    },
  ) => AlloggiatiWebSubmissionValidator;
  createFingerprint?: typeof createAlloggiatiSubmissionFingerprint;
  transmissionStore?: {
    prepare: typeof prismaAlloggiatiTransmissionStore.prepare;
  };
};

const publicReferenceProvider =
  new PublicAlloggiatiReferenceProvider();

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
  dependencies:
    ProcessAlloggiatiWebSubmissionJobDependencies = {},
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

  const connection =
    await prisma.alloggiatiWebProperty.findUnique({
      where: {
        propertyId: payload.propertyId,
      },
      select: {
        apartmentId: true,
      },
    });

  if (!connection) {
    throw new Error(
      "Alloggiati Web non configurato per la struttura.",
    );
  }

  if (
    !/^\d+$/.test(
      connection.apartmentId.trim(),
    )
  ) {
    throw new Error(
      "IdAppartamento Alloggiati Web non valido.",
    );
  }

  if (booking.nights < 1 || booking.nights > 30) {
    throw new Error(
      "Permanenza Alloggiati non valida: deve essere tra 1 e 30 giorni.",
    );
  }

  if (
    booking.guests !==
    booking.bookingGuests.length
  ) {
    throw new Error(
      "Dati ospiti Alloggiati incompleti rispetto alla prenotazione.",
    );
  }

  const getReferenceResolver =
    dependencies.getReferenceResolver ??
    (() => publicReferenceProvider.getResolver());

  const resolver =
    await getReferenceResolver();

  const prepareSubmission =
    dependencies.prepareSubmission ??
    prepareBookingSubmission;

  const submission =
    await prepareSubmission(
      {
        checkIn: booking.checkIn,
        nights: booking.nights,
        expectedGuests: booking.guests,
        guests: booking.bookingGuests,
        apartmentId:
          connection.apartmentId.trim(),
      },
      resolver,
    );

  const credentialProvider =
    dependencies.credentialProvider ??
    createRuntimeAlloggiatiWebCredentialProvider();

  const credentials =
    await credentialProvider.getCredentials({
      propertyId: payload.propertyId,
    });

  const createValidator =
    dependencies.createValidator ??
    createRuntimeAlloggiatiWebValidator;

  const validator =
    createValidator(credentials);

  await preflightAlloggiatiSubmission(
    submission,
    validator,
  );

  const createFingerprint =
    dependencies.createFingerprint ??
    createAlloggiatiSubmissionFingerprint;

  const payloadHash =
    createFingerprint(submission);

  const transmissionStore =
    dependencies.transmissionStore ??
    prismaAlloggiatiTransmissionStore;

  await transmissionStore.prepare({
    bookingId: booking.id,
    propertyId: payload.propertyId,
    apartmentId:
      connection.apartmentId.trim(),
    payloadHash,
    recordsCount:
      submission.records.length,
  });

  throw new Error(
    "Alloggiati Web invio disabilitato dopo preflight.",
  );
}
