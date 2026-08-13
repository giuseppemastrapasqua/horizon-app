"use server";

import {
  PricingOverrideSource,
} from "@prisma/client";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";

export async function savePropertyPricingOverrideAction(
  formData: FormData,
): Promise<void> {
  const propertyId =
    String(
      formData.get("propertyId") ?? "",
    ).trim();

  const startDateValue =
    String(
      formData.get("startDate") ?? "",
    ).trim();

  const endDateValue =
    String(
      formData.get("endDate") ?? "",
    ).trim();

  const nightlyPrice =
    parseOptionalNumber(
      formData.get("nightlyPrice"),
    );

  const minimumStay =
    parseOptionalInteger(
      formData.get("minimumStay"),
    );

  const maximumStay =
    parseOptionalInteger(
      formData.get("maximumStay"),
    );

  const cleaningCost =
    parseRequiredNumber(
      formData.get("cleaningCost"),
      "Costo pulizia",
    );

  const occupancyIncluded =
    parseOptionalInteger(
      formData.get("includedGuests"),
    );

  if (!propertyId) {
    throw new Error(
      "propertyId mancante.",
    );
  }

  if (
    !startDateValue ||
    !endDateValue
  ) {
    throw new Error(
      "Seleziona un periodo Da - A.",
    );
  }

  const startDate =
    parseDate(
      startDateValue,
      "Data iniziale",
    );

  const endDate =
    parseDate(
      endDateValue,
      "Data finale",
    );

  if (
    endDate.getTime() <
    startDate.getTime()
  ) {
    throw new Error(
      "La data finale non può precedere quella iniziale.",
    );
  }

  if (
    nightlyPrice !== null &&
    nightlyPrice < 0
  ) {
    throw new Error(
      "Il prezzo notte non può essere negativo.",
    );
  }

  if (
    minimumStay !== null &&
    minimumStay < 1
  ) {
    throw new Error(
      "Il minimum stay deve essere almeno 1.",
    );
  }

  if (
    maximumStay !== null &&
    maximumStay < 1
  ) {
    throw new Error(
      "Il maximum stay deve essere almeno 1.",
    );
  }

  if (
    minimumStay !== null &&
    maximumStay !== null &&
    maximumStay < minimumStay
  ) {
    throw new Error(
      "Il maximum stay non può essere inferiore al minimum stay.",
    );
  }

  if (cleaningCost < 0) {
    throw new Error(
      "Il costo pulizia non può essere negativo.",
    );
  }

  if (
    occupancyIncluded !== null &&
    occupancyIncluded < 1
  ) {
    throw new Error(
      "Gli ospiti inclusi devono essere almeno 1.",
    );
  }

  await prisma.$transaction(
    async (transaction) => {
      const property =
        await transaction.property.findUnique({
          where: {
            id: propertyId,
          },
          select: {
            id: true,
          },
        });

      if (!property) {
        throw new Error(
          "Immobile non trovato.",
        );
      }

      /*
       * Il costo pulizia è una configurazione
       * della property, quindi viene aggiornato
       * indipendentemente dall'intervallo.
       */
      await transaction.property.update({
        where: {
          id: propertyId,
        },
        data: {
          cleaningCost,
        },
      });

      /*
       * Rate Plan principale della struttura.
       *
       * Se la property non possiede ancora
       * alcun piano tariffario attivo/default,
       * il primo prezzo valido salvato dal
       * calendario diventa la baseline Revenue.
       *
       * Gli override successivi NON modificano
       * automaticamente questa baseline.
       */
      const existingRatePlan =
        await transaction.propertyRatePlan.findFirst({
          where: {
            propertyId,
            active: true,
          },

          orderBy: [
            {
              isDefault:
                "desc",
            },
            {
              createdAt:
                "asc",
            },
          ],
        });

      if (
        !existingRatePlan &&
        nightlyPrice !== null &&
        nightlyPrice > 0
      ) {
        await transaction.propertyRatePlan.create({
          data: {
            propertyId,

            name:
              "Standard",

            code:
              "STANDARD",

            active:
              true,

            isDefault:
              true,

            basePrice:
              nightlyPrice,

            currency:
              "EUR",

            minimumStay:
              minimumStay ??
              1,

            maximumStay,

            occupancyIncluded:
              occupancyIncluded ??
              1,
          },
        });
      }

      const hasPeriodOverride =
        nightlyPrice !== null ||
        minimumStay !== null ||
        maximumStay !== null ||
        occupancyIncluded !== null;

      if (!hasPeriodOverride) {
        return;
      }

      /*
       * Se viene salvato nuovamente lo stesso
       * identico intervallo manuale, sostituiamo
       * la configurazione precedente.
       *
       * Gli intervalli parzialmente sovrapposti
       * saranno gestiti successivamente dal
       * resolver di priorità.
       */
      await transaction.propertyPriceOverride.deleteMany({
        where: {
          propertyId,
          startDate,
          endDate,
          source:
            PricingOverrideSource.MANUAL,
        },
      });

      await transaction.propertyPriceOverride.create({
        data: {
          propertyId,
          startDate,
          endDate,
          nightlyPrice,
          minimumStay,
          maximumStay,
          occupancyIncluded,
          source:
            PricingOverrideSource.MANUAL,
        },
      });
    },
  );

  revalidatePath(
    `/properties/${propertyId}`,
  );

  revalidatePath(
    `/properties/${propertyId}/edit`,
  );
}

function parseDate(
  value: string,
  label: string,
): Date {
  const date =
    new Date(
      `${value}T00:00:00.000Z`,
    );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    throw new Error(
      `${label} non valida.`,
    );
  }

  return date;
}

function parseOptionalNumber(
  value: FormDataEntryValue | null,
): number | null {
  const normalized =
    String(
      value ?? "",
    ).trim();

  if (!normalized) {
    return null;
  }

  const number =
    Number(normalized);

  if (
    !Number.isFinite(number)
  ) {
    throw new Error(
      "Valore numerico non valido.",
    );
  }

  return number;
}

function parseRequiredNumber(
  value: FormDataEntryValue | null,
  label: string,
): number {
  const normalized =
    String(
      value ?? "",
    ).trim();

  const number =
    Number(normalized);

  if (
    !normalized ||
    !Number.isFinite(number)
  ) {
    throw new Error(
      `${label} non valido.`,
    );
  }

  return number;
}

function parseOptionalInteger(
  value: FormDataEntryValue | null,
): number | null {
  const number =
    parseOptionalNumber(
      value,
    );

  if (number === null) {
    return null;
  }

  if (
    !Number.isInteger(number)
  ) {
    throw new Error(
      "Il numero di notti deve essere un intero.",
    );
  }

  return number;
}


