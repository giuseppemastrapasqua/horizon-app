"use server";

import {
  AvailabilityBlockSource,
} from "@prisma/client";
import { revalidatePath } from "next/cache";

import { requirePropertyAccess } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

function parseDate(
  value: FormDataEntryValue | null,
  fieldName: string,
) {
  const text =
    String(value ?? "").trim();

  if (!text) {
    throw new Error(
      `${fieldName} mancante.`,
    );
  }

  const date =
    new Date(
      `${text}T00:00:00.000Z`,
    );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    throw new Error(
      `${fieldName} non valida.`,
    );
  }

  return date;
}

function addDays(
  date: Date,
  amount: number,
) {
  const result =
    new Date(date);

  result.setUTCDate(
    result.getUTCDate() +
      amount,
  );

  return result;
}

export async function closePropertyPeriodAction(
  formData: FormData,
) {
  const propertyId =
    String(
      formData.get(
        "propertyId",
      ) ?? "",
    ).trim();

  if (!propertyId) {
    throw new Error(
      "Immobile mancante.",
    );
  }

  await requirePropertyAccess(propertyId);

  const startDate =
    parseDate(
      formData.get(
        "startDate",
      ),
      "Data iniziale",
    );

  const endDate =
    parseDate(
      formData.get(
        "endDate",
      ),
      "Data finale",
    );

  if (
    endDate <
    startDate
  ) {
    throw new Error(
      "La data finale non può precedere quella iniziale.",
    );
  }

  /*
   * Cerchiamo eventuali chiusure
   * manuali sovrapposte o adiacenti.
   *
   * In questo modo evitiamo di
   * accumulare tanti piccoli blocchi.
   */
  const dayBefore =
    addDays(
      startDate,
      -1,
    );

  const dayAfter =
    addDays(
      endDate,
      1,
    );

  await prisma.$transaction(
    async (transaction) => {
      const overlapping =
        await transaction.propertyAvailabilityBlock.findMany({
          where: {
            propertyId,

            source:
              AvailabilityBlockSource.MANUAL,

            startDate: {
              lte:
                dayAfter,
            },

            endDate: {
              gte:
                dayBefore,
            },
          },

          orderBy: {
            startDate:
              "asc",
          },
        });

      let mergedStart =
        startDate;

      let mergedEnd =
        endDate;

      for (
        const block
        of overlapping
      ) {
        if (
          block.startDate <
          mergedStart
        ) {
          mergedStart =
            block.startDate;
        }

        if (
          block.endDate >
          mergedEnd
        ) {
          mergedEnd =
            block.endDate;
        }
      }

      if (
        overlapping.length >
        0
      ) {
        await transaction.propertyAvailabilityBlock.deleteMany({
          where: {
            id: {
              in:
                overlapping.map(
                  (block) =>
                    block.id,
                ),
            },
          },
        });
      }

      await transaction.propertyAvailabilityBlock.create({
        data: {
          propertyId,

          startDate:
            mergedStart,

          endDate:
            mergedEnd,

          source:
            AvailabilityBlockSource.MANUAL,

          note:
            "Chiusura manuale da calendario Horizon.",
        },
      });
    },
  );
  revalidatePath(
    `/properties/${propertyId}`,
  );
}

export async function openPropertyPeriodAction(
  formData: FormData,
) {
  const propertyId =
    String(
      formData.get(
        "propertyId",
      ) ?? "",
    ).trim();

  if (!propertyId) {
    throw new Error(
      "Immobile mancante.",
    );
  }

  await requirePropertyAccess(propertyId);

  const startDate =
    parseDate(
      formData.get(
        "startDate",
      ),
      "Data iniziale",
    );

  const endDate =
    parseDate(
      formData.get(
        "endDate",
      ),
      "Data finale",
    );

  if (
    endDate <
    startDate
  ) {
    throw new Error(
      "La data finale non può precedere quella iniziale.",
    );
  }

  await prisma.$transaction(
    async (transaction) => {
      const overlapping =
        await transaction.propertyAvailabilityBlock.findMany({
          where: {
            propertyId,

            source:
              AvailabilityBlockSource.MANUAL,

            startDate: {
              lte:
                endDate,
            },

            endDate: {
              gte:
                startDate,
            },
          },
        });

      for (
        const block
        of overlapping
      ) {
        if (
          startDate <=
            block.startDate &&
          endDate >=
            block.endDate
        ) {
          await transaction.propertyAvailabilityBlock.delete({
            where: {
              id:
                block.id,
            },
          });

          continue;
        }

        if (
          startDate >
            block.startDate &&
          endDate <
            block.endDate
        ) {
          const originalEnd =
            block.endDate;

          await transaction.propertyAvailabilityBlock.update({
            where: {
              id:
                block.id,
            },

            data: {
              endDate:
                addDays(
                  startDate,
                  -1,
                ),
            },
          });

          await transaction.propertyAvailabilityBlock.create({
            data: {
              propertyId,

              startDate:
                addDays(
                  endDate,
                  1,
                ),

              endDate:
                originalEnd,

              source:
                block.source,

              note:
                block.note,

              createdById:
                block.createdById,
            },
          });

          continue;
        }

        if (
          startDate <=
            block.startDate &&
          endDate <
            block.endDate
        ) {
          await transaction.propertyAvailabilityBlock.update({
            where: {
              id:
                block.id,
            },

            data: {
              startDate:
                addDays(
                  endDate,
                  1,
                ),
            },
          });

          continue;
        }

        if (
          startDate >
            block.startDate &&
          endDate >=
            block.endDate
        ) {
          await transaction.propertyAvailabilityBlock.update({
            where: {
              id:
                block.id,
            },

            data: {
              endDate:
                addDays(
                  startDate,
                  -1,
                ),
            },
          });
        }
      }
    },
  );
  revalidatePath(
    `/properties/${propertyId}`,
  );
}