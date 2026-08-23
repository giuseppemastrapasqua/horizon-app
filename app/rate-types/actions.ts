"use server";

import {
  revalidatePath,
} from "next/cache";

import {
  redirect,
} from "next/navigation";

import {
  prisma,
} from "@/lib/prisma";

import { requirePropertyAccess } from "@/lib/auth/guards";

const CORE_RATE_TYPES = [
  {
    code: "STANDARD",
    name: "Standard Rate",
    isDefault: true,
  },
  {
    code: "NON_REFUNDABLE",
    name: "Non Refundable",
    isDefault: false,
  },
  {
    code: "WEEKLY",
    name: "Weekly Rate",
    isDefault: false,
  },
  {
    code: "MONTHLY",
    name: "Monthly Rate",
    isDefault: false,
  },
] as const;

export async function saveRateTypesAction(
  formData: FormData,
) {

  const propertyId =
    readRequiredText(
      formData,
      "propertyId",
      "Struttura",
    );
  await requirePropertyAccess(propertyId);

  const property =
    await assertProperty(
      propertyId,
    );

  const maxGuests =
    property.maxGuests;


  const configuration = {
    STANDARD: {
      active: true,
      discount: 0,
      minimumStay:
        parseStay(
          formData.get(
            "standardMinimumStay",
          ),
          "Standard Rate · minimo notti",
        ),

      maximumStay:
        parseMaximumStay(
          formData.get(
            "standardMaximumStay",
          ),
          "Standard Rate · massimo notti",
        ),
      minimumGuests:
        parseGuestCount(
          formData.get(
            "standardMinimumGuests",
          ),
          "Standard Rate · minimo ospiti",
        ),

      occupancyIncluded:
        parseGuestCount(
          formData.get(
            "standardOccupancyIncluded",
          ),
          "Standard Rate · ospiti inclusi",
        ),

      extraGuestPrice:
        parseGuestExtra(
          formData.get(
            "standardExtraGuestPrice",
          ),
          "Standard Rate · extra ospite",
        ),
    },

    NON_REFUNDABLE: {
      active:
        formData.get(
          "nonRefundableActive",
        ) === "on",

      discount:
        parseDiscount(
          formData.get(
            "nonRefundableDiscount",
          ),
          "Non Refundable",
        ),

      minimumStay:
        parseStay(
          formData.get(
            "nonRefundableMinimumStay",
          ),
          "Non Refundable · minimo notti",
        ),

      maximumStay:
        parseMaximumStay(
          formData.get(
            "nonRefundableMaximumStay",
          ),
          "Non Refundable · massimo notti",
        ),
      minimumGuests:
        parseGuestCount(
          formData.get(
            "nonRefundableMinimumGuests",
          ),
          "Non Refundable · minimo ospiti",
        ),

      occupancyIncluded:
        parseGuestCount(
          formData.get(
            "nonRefundableOccupancyIncluded",
          ),
          "Non Refundable · ospiti inclusi",
        ),

      extraGuestPrice:
        parseGuestExtra(
          formData.get(
            "nonRefundableExtraGuestPrice",
          ),
          "Non Refundable · extra ospite",
        ),
    },

    WEEKLY: {
      active:
        formData.get(
          "weeklyActive",
        ) === "on",

      discount:
        parseDiscount(
          formData.get(
            "weeklyDiscount",
          ),
          "Weekly Rate",
        ),

      minimumStay:
        parseStay(
          formData.get(
            "weeklyMinimumStay",
          ),
          "Weekly Rate · minimo notti",
        ),

      maximumStay:
        parseMaximumStay(
          formData.get(
            "weeklyMaximumStay",
          ),
          "Weekly Rate · massimo notti",
        ),
      minimumGuests:
        parseGuestCount(
          formData.get(
            "weeklyMinimumGuests",
          ),
          "Weekly Rate · minimo ospiti",
        ),

      occupancyIncluded:
        parseGuestCount(
          formData.get(
            "weeklyOccupancyIncluded",
          ),
          "Weekly Rate · ospiti inclusi",
        ),

      extraGuestPrice:
        parseGuestExtra(
          formData.get(
            "weeklyExtraGuestPrice",
          ),
          "Weekly Rate · extra ospite",
        ),
    },

    MONTHLY: {
      active:
        formData.get(
          "monthlyActive",
        ) === "on",

      discount:
        parseDiscount(
          formData.get(
            "monthlyDiscount",
          ),
          "Monthly Rate",
        ),

      minimumStay:
        parseStay(
          formData.get(
            "monthlyMinimumStay",
          ),
          "Monthly Rate · minimo notti",
        ),

      maximumStay:
        parseMaximumStay(
          formData.get(
            "monthlyMaximumStay",
          ),
          "Monthly Rate · massimo notti",
        ),
      minimumGuests:
        parseGuestCount(
          formData.get(
            "monthlyMinimumGuests",
          ),
          "Monthly Rate · minimo ospiti",
        ),

      occupancyIncluded:
        parseGuestCount(
          formData.get(
            "monthlyOccupancyIncluded",
          ),
          "Monthly Rate · ospiti inclusi",
        ),

      extraGuestPrice:
        parseGuestExtra(
          formData.get(
            "monthlyExtraGuestPrice",
          ),
          "Monthly Rate · extra ospite",
        ),
    },
  };

  for (
    const value
    of Object.values(
      configuration,
    )
  ) {
    assertStayRange(
      value.minimumStay,
      value.maximumStay,
    );

    assertOccupancyRange(
      value.minimumGuests,
      value.occupancyIncluded,
      maxGuests,
      "Tariffa",
    );

    assertOccupancyRange(
      value.minimumGuests,
      value.occupancyIncluded,
      maxGuests,
      "Tariffa",
    );
  }
await prisma.$transaction(
    async (
      transaction,
    ) => {
      for (
        const rateType
        of CORE_RATE_TYPES
      ) {
        const current =
          configuration[
            rateType.code
          ];

        const ratePlan =
          await transaction.propertyRatePlan.upsert({
            where: {
              propertyId_code: {
                propertyId,
                code:
                  rateType.code,
              },
            },

            update: {
              name:
                rateType.name,

              active:
                current.active,

              isDefault:
                rateType.isDefault,

              currency:
                "EUR",

              minimumStay:
                current.minimumStay,

              maximumStay:
                current.maximumStay,

              minimumGuests:
                current.minimumGuests,

              occupancyIncluded:
                current.occupancyIncluded,
            },

            create: {
              propertyId,

              name:
                rateType.name,

              code:
                rateType.code,

              active:
                current.active,

              isDefault:
                rateType.isDefault,

              /*
               * Campo tecnico Prisma.
               * Il prezzo operativo viene gestito
               * esclusivamente da Calendario / Revenue AI.
               */
              basePrice:
                0,

              currency:
                "EUR",

              minimumStay:
                current.minimumStay,

              maximumStay:
                current.maximumStay,

              minimumGuests:
                current.minimumGuests,

              occupancyIncluded:
                current.occupancyIncluded,
            },
          });

        await replaceOccupancyPrices(
          transaction,
          ratePlan.id,
          current.occupancyIncluded,
          maxGuests,
          current.extraGuestPrice,
        );
        await transaction.propertyRateRule.deleteMany({
          where: {
            ratePlanId:
              ratePlan.id,

            name: {
              startsWith:
                "HORIZON_RATE_DISCOUNT_",
            },
          },
        });

        if (
          rateType.code !==
          "STANDARD"
        ) {
          await transaction.propertyRateRule.create({
            data: {
              propertyId,

              ratePlanId:
                ratePlan.id,

              name:
                `HORIZON_RATE_DISCOUNT_${rateType.code}`,

              active:
                true,

              priority:
                100,

              daysOfWeek:
                [],

              adjustmentType:
                "PERCENTAGE",

              adjustmentValue:
                -current.discount,

              minimumStay:
                current.minimumStay,

              maximumStay:
                current.maximumStay,
            },
          });
        }
      }


    },
  );

  finish(
    propertyId,
  );
}

export async function createCustomRateAction(
  formData: FormData,
) {

  const propertyId =
    readRequiredText(
      formData,
      "propertyId",
      "Struttura",
    );
  await requirePropertyAccess(propertyId);

  const name =
    readRequiredText(
      formData,
      "customName",
      "Nome tariffa",
    );

  const adjustmentMode =
    parseAdjustmentMode(
      formData.get(
        "customAdjustmentMode",
      ),
    );

  const adjustmentValue =
    parseDiscount(
      formData.get(
        "customAdjustmentValue",
      ),
      name,
    );

  const signedAdjustment =
    adjustmentMode === "MARKUP"
      ? adjustmentValue
      : -adjustmentValue;

  const minimumStay =
    parseStay(
      formData.get(
        "customMinimumStay",
      ),
      `${name} · minimo notti`,
    );

  const maximumStay =
    parseMaximumStay(
      formData.get(
        "customMaximumStay",
      ),
      `${name} · massimo notti`,
    );

  assertStayRange(
    minimumStay,
    maximumStay,
  );
  const property =
    await assertProperty(
      propertyId,
    );

  const maxGuests =
    property.maxGuests;
  const minimumGuests =
    parseGuestCount(
      formData.get(
        "customMinimumGuests",
      ),
      `${name} · minimo ospiti`,
    );

  const occupancyIncluded =
    parseGuestCount(
      formData.get(
        "customOccupancyIncluded",
      ),
      `${name} · ospiti inclusi`,
    );

  const extraGuestPrice =
    parseGuestExtra(
      formData.get(
        "customExtraGuestPrice",
      ),
      `${name} · extra ospite`,
    );

  assertOccupancyRange(
    minimumGuests,
    occupancyIncluded,
    maxGuests,
    name,
  );


  const code =
    await buildUniqueCustomCode(
      propertyId,
      name,
    );

  await prisma.$transaction(
    async (
      transaction,
    ) => {
      const ratePlan =
        await transaction.propertyRatePlan.create({
          data: {
            propertyId,
            name,
            code,

            active:
              formData.get(
                "customActive",
              ) === "on",

            isDefault:
              false,

            /*
             * Campo tecnico Prisma.
             * Il prezzo operativo viene risolto
             * dal Calendario / Revenue AI.
             */
            basePrice:
              0,

            currency:
              "EUR",

            minimumStay,
            maximumStay,

            minimumGuests,
            occupancyIncluded,
          },
        });

      await replaceOccupancyPrices(
        transaction,
        ratePlan.id,
        occupancyIncluded,
        maxGuests,
        extraGuestPrice,
      );
      await transaction.propertyRateRule.create({
        data: {
          propertyId,

          ratePlanId:
            ratePlan.id,

          name:
            `HORIZON_RATE_DISCOUNT_${code}`,

          active:
            true,

          priority:
            100,

          daysOfWeek:
            [],

          adjustmentType:
            "PERCENTAGE",

          adjustmentValue:
            signedAdjustment,

          minimumStay,
          maximumStay,
        },
      });
    },
  );

  finish(
    propertyId,
  );
}

export async function updateCustomRateAction(
  formData: FormData,
) {

  const propertyId =
    readRequiredText(
      formData,
      "propertyId",
      "Struttura",
    );
  await requirePropertyAccess(propertyId);

  const ratePlanId =
    readRequiredText(
      formData,
      "ratePlanId",
      "Tariffa",
    );

  const name =
    readRequiredText(
      formData,
      "name",
      "Nome tariffa",
    );

  const adjustmentMode =
    parseAdjustmentMode(
      formData.get(
        "adjustmentMode",
      ),
    );

  const adjustmentValue =
    parseDiscount(
      formData.get(
        "adjustmentValue",
      ),
      name,
    );

  const signedAdjustment =
    adjustmentMode === "MARKUP"
      ? adjustmentValue
      : -adjustmentValue;

  const minimumStay =
    parseStay(
      formData.get(
        "minimumStay",
      ),
      `${name} · minimo notti`,
    );

  const maximumStay =
    parseMaximumStay(
      formData.get(
        "maximumStay",
      ),
      `${name} · massimo notti`,
    );

  assertStayRange(
    minimumStay,
    maximumStay,
  );
  const property =
    await assertProperty(
      propertyId,
    );

  const maxGuests =
    property.maxGuests;
  const minimumGuests =
    parseGuestCount(
      formData.get(
        "minimumGuests",
      ),
      `${name} · minimo ospiti`,
    );

  const occupancyIncluded =
    parseGuestCount(
      formData.get(
        "occupancyIncluded",
      ),
      `${name} · ospiti inclusi`,
    );

  const extraGuestPrice =
    parseGuestExtra(
      formData.get(
        "extraGuestPrice",
      ),
      `${name} · extra ospite`,
    );

  assertOccupancyRange(
    minimumGuests,
    occupancyIncluded,
    maxGuests,
    name,
  );

const ratePlan =
    await prisma.propertyRatePlan.findFirst({
      where: {
        id:
          ratePlanId,

        propertyId,

        code: {
          startsWith:
            "CUSTOM_",
        },
      },
    });

  if (!ratePlan) {
    throw new Error(
      "Tariffa personalizzata non trovata.",
    );
  }

  await prisma.$transaction(
    async (
      transaction,
    ) => {
      await transaction.propertyRatePlan.update({
        where: {
          id:
            ratePlanId,
        },

        data: {
          name,

          active:
            formData.get(
              "active",
            ) === "on",

          minimumStay,
          maximumStay,

          minimumGuests,
          occupancyIncluded,
        },
      });

      await replaceOccupancyPrices(
        transaction,
        ratePlanId,
        occupancyIncluded,
        maxGuests,
        extraGuestPrice,
      );
      await transaction.propertyRateRule.deleteMany({
        where: {
          ratePlanId,

          name: {
            startsWith:
              "HORIZON_RATE_DISCOUNT_",
          },
        },
      });

      await transaction.propertyRateRule.create({
        data: {
          propertyId,

          ratePlanId,

          name:
            `HORIZON_RATE_DISCOUNT_${ratePlan.code}`,

          active:
            true,

          priority:
            100,

          daysOfWeek:
            [],

          adjustmentType:
            "PERCENTAGE",

          adjustmentValue:
            signedAdjustment,

          minimumStay,
          maximumStay,
        },
      });
    },
  );

  finish(
    propertyId,
  );
}

export async function deleteCustomRateAction(
  formData: FormData,
) {

  const propertyId =
    readRequiredText(
      formData,
      "propertyId",
      "Struttura",
    );
  await requirePropertyAccess(propertyId);

  const ratePlanId =
    readRequiredText(
      formData,
      "ratePlanId",
      "Tariffa",
    );

  const ratePlan =
    await prisma.propertyRatePlan.findFirst({
      where: {
        id:
          ratePlanId,

        propertyId,

        code: {
          startsWith:
            "CUSTOM_",
        },
      },

      select: {
        id: true,
      },
    });

  if (!ratePlan) {
    throw new Error(
      "Tariffa personalizzata non trovata.",
    );
  }

  await prisma.propertyRatePlan.delete({
    where: {
      id:
        ratePlan.id,
    },
  });

  finish(
    propertyId,
  );
}

function parseGuestCount(
  value: FormDataEntryValue | null,
  label: string,
): number {
  const parsed = Number(
    String(value ?? "").trim(),
  );

  if (
    !Number.isInteger(parsed) ||
    parsed < 1
  ) {
    throw new Error(
      `${label}: inserisci un numero di ospiti valido.`,
    );
  }

  return parsed;
}

function parseGuestExtra(
  value: FormDataEntryValue | null,
  label: string,
): number {
  const raw = String(
    value ?? "",
  )
    .trim()
    .replace(",", ".");

  const parsed =
    raw === ""
      ? 0
      : Number(raw);

  if (
    !Number.isFinite(parsed) ||
    parsed < 0
  ) {
    throw new Error(
      `${label}: il supplemento ospite deve essere maggiore o uguale a zero.`,
    );
  }

  return parsed;
}

function assertOccupancyRange(
  minimumGuests: number,
  occupancyIncluded: number,
  maxGuests: number,
  label: string,
): void {
  if (minimumGuests > maxGuests) {
    throw new Error(
      `${label}: il minimo ospiti non può superare la capienza di ${maxGuests} ospiti.`,
    );
  }

  if (
    occupancyIncluded <
    minimumGuests
  ) {
    throw new Error(
      `${label}: gli ospiti inclusi non possono essere inferiori al minimo ospiti.`,
    );
  }

  if (
    occupancyIncluded >
    maxGuests
  ) {
    throw new Error(
      `${label}: gli ospiti inclusi non possono superare la capienza di ${maxGuests} ospiti.`,
    );
  }
}

async function replaceOccupancyPrices(
  transaction: Parameters<
    Parameters<
      typeof prisma.$transaction
    >[0]
  >[0],
  ratePlanId: string,
  occupancyIncluded: number,
  maxGuests: number,
  extraGuestPrice: number,
): Promise<void> {
  await transaction.propertyOccupancyPrice.deleteMany({
    where: {
      ratePlanId,
    },
  });

  if (
    extraGuestPrice <= 0 ||
    occupancyIncluded >= maxGuests
  ) {
    return;
  }

  await transaction.propertyOccupancyPrice.createMany({
    data: Array.from(
      {
        length:
          maxGuests -
          occupancyIncluded,
      },
      (_, index) => {
        const guests =
          occupancyIncluded +
          index +
          1;

        return {
          ratePlanId,
          guests,
          adjustmentType:
            "FIXED" as const,
          adjustmentValue:
            extraGuestPrice *
            (guests -
              occupancyIncluded),
        };
      },
    ),
  });
}
async function assertProperty(
  propertyId: string,
) {
  const property =
    await prisma.property.findUnique({
      where: {
        id: propertyId,
      },

      select: {
        id: true,
        maxGuests: true,
      },
    });

  if (!property) {
    throw new Error(
      "Struttura non trovata.",
    );
  }

  return property;
}
async function buildUniqueCustomCode(
  propertyId: string,
  name: string,
) {
  const slug =
    name
      .normalize(
        "NFD",
      )
      .replace(
        /[\u0300-\u036f]/g,
        "",
      )
      .toUpperCase()
      .replace(
        /[^A-Z0-9]+/g,
        "_",
      )
      .replace(
        /^_+|_+$/g,
        "",
      )
      .slice(
        0,
        36,
      ) || "RATE";

  let candidate =
    `CUSTOM_${slug}`;

  let counter =
    2;

  while (
    await prisma.propertyRatePlan.findUnique({
      where: {
        propertyId_code: {
          propertyId,
          code:
            candidate,
        },
      },

      select: {
        id: true,
      },
    })
  ) {
    candidate =
      `CUSTOM_${slug}_${counter}`;

    counter += 1;
  }

  return candidate;
}

function readRequiredText(
  formData: FormData,
  key: string,
  label: string,
) {
  const value =
    String(
      formData.get(
        key,
      ) ?? "",
    ).trim();

  if (!value) {
    throw new Error(
      `${label}: valore obbligatorio.`,
    );
  }

  return value;
}

function parseAdjustmentMode(
  value:
    | FormDataEntryValue
    | null,
) {
  const mode =
    String(
      value ?? "",
    )
      .trim()
      .toUpperCase();

  if (
    mode !== "DISCOUNT" &&
    mode !== "MARKUP"
  ) {
    throw new Error(
      "Tipo variazione tariffa non valido.",
    );
  }

  return mode as
    | "DISCOUNT"
    | "MARKUP";
}

function parseDiscount(
  value:
    | FormDataEntryValue
    | null,
  label: string,
) {
  const parsed =
    Number(
      String(
        value ?? "0",
      )
        .trim()
        .replace(
          ",",
          ".",
        ),
    );

  if (
    !Number.isFinite(
      parsed,
    ) ||
    parsed < 0 ||
    parsed > 90
  ) {
    throw new Error(
      `${label}: lo sconto deve essere compreso tra 0% e 90%.`,
    );
  }

  return parsed;
}

function parseStay(
  value:
    | FormDataEntryValue
    | null,
  label: string,
) {
  const parsed =
    Number(
      value,
    );

  if (
    !Number.isInteger(
      parsed,
    ) ||
    parsed < 1
  ) {
    throw new Error(
      `${label}: inserisci almeno 1 notte.`,
    );
  }

  return parsed;
}

function parseMaximumStay(
  value:
    | FormDataEntryValue
    | null,
  label: string,
) {
  const raw =
    String(
      value ?? "",
    ).trim();

  if (!raw) {
    return null;
  }

  const parsed =
    Number(
      raw,
    );

  if (
    !Number.isInteger(
      parsed,
    ) ||
    parsed < 1
  ) {
    throw new Error(
      `${label}: inserisci un numero intero positivo.`,
    );
  }

  return parsed;
}

function assertStayRange(
  minimumStay: number,
  maximumStay: number | null,
) {
  if (
    maximumStay !== null &&
    maximumStay <
      minimumStay
  ) {
    throw new Error(
      "Il massimo notti non può essere inferiore al minimo notti.",
    );
  }
}

function finish(
  propertyId: string,
): never {
  revalidatePath(
    "/rate-types",
  );

  revalidatePath(
    "/calendar",
  );

  redirect(
    `/rate-types?propertyId=${encodeURIComponent(
      propertyId,
    )}`,
  );
}