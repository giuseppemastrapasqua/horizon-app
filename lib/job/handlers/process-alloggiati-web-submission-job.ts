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
        apartmentId: mapping.externalPropertyId,
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

  throw new Error(
    "Alloggiati Web invio disabilitato dopo preflight.",
  );
}
