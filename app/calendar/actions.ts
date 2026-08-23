"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/guards";

import {
  getPropertyRevenueData,
} from "@/lib/revenue/get-property-revenue-data";

import {
  buildPeriodRevenueRecommendation,
} from "@/app/properties/[id]/components/property-calendar/revenue/build-period-recommendation";


export async function saveCalendarPeriodAction(formData: FormData) {
  await requireUser();
  const propertyId = requiredText(formData, "propertyId");
  const month = requiredText(formData, "month");
  const from = parseDate(requiredText(formData, "from"));
  const to = parseDate(requiredText(formData, "to"));

  if (to < from) {
    throw new Error("La data A non puÃ² precedere la data Da.");
  }

  const standardRate = Number(
    String(formData.get("standardRate") ?? "")
      .replace(",", ".")
      .trim(),
  );

  if (!Number.isFinite(standardRate) || standardRate <= 0) {
    throw new Error("Standard Rate non valida.");
  }

  const availability =
    requiredText(formData, "availability");


  await removePricingOverridesInsideRange({
    propertyId,
    from,
    to,
    source: "AI",
  });

  await prisma.propertyPriceOverride.create({
    data: {
      propertyId,
      startDate: from,
      endDate: to,
      nightlyPrice: standardRate,
      source: "MANUAL",
      note: "Standard Rate impostata dal calendario Horizon",
    },
  });

  if (availability === "CLOSED") {
    await prisma.propertyAvailabilityBlock.create({
      data: {
        propertyId,
        startDate: from,
        endDate: to,
        source: "MANUAL",
        note: "Periodo chiuso dal calendario Horizon",
      },
    });
  }

  if (availability === "OPEN") {
    await prisma.propertyAvailabilityBlock.deleteMany({
      where: {
        propertyId,
        source: "MANUAL",
        startDate: {
          lte: to,
        },
        endDate: {
          gte: from,
        },
      },
    });
  }

  finish(propertyId, month, from, to);
}

export async function applyRevenueAiAction(
  formData: FormData,
) {
  const propertyId =
    requiredText(
      formData,
      "propertyId",
    );

  const month =
    requiredText(
      formData,
      "month",
    );

  const from =
    parseDate(
      requiredText(
        formData,
        "from",
      ),
    );

  const to =
    parseDate(
      requiredText(
        formData,
        "to",
      ),
    );

  if (to < from) {
    throw new Error(
      "La data A non può precedere la data Da.",
    );
  }

  /*
   * La Standard Rate NON viene usata
   * come baseline del Revenue AI.
   *
   * Ci serve soltanto il minimum stay
   * configurato dalla struttura.
   */
  const standard =
    await prisma.propertyRatePlan.findUnique({
      where: {
        propertyId_code: {
          propertyId,
          code: "STANDARD",
        },
      },

      select: {
        minimumStay: true,
      },
    });

  if (!standard) {
    return;
  }

  /*
   * Dati Revenue reali:
   *
   * - RevenueDailySignal
   * - ultimo snapshot mercato
   * - comparables
   */
  const revenueData =
    await getPropertyRevenueData({
      propertyId,
      startDate: from,
      endDate: to,
    });

  /*
   * Il prezzo viene costruito dal
   * Revenue Engine market-based.
   *
   * Non riceve alcun basePrice manuale.
   */
  const result =
    buildPeriodRevenueRecommendation({
      propertyId,

      rangeStart:
        dateKey(from),

      rangeEnd:
        dateKey(to),

      minimumStay:
        String(
          standard.minimumStay,
        ),

      revenueData,
    });

  const recommendation =
    result.recommendation;

  if (!recommendation) {
    return;
  }

  /*
   * Revenue AI diventa la sorgente prezzo
   * del solo periodo selezionato.
   *
   * Preserviamo automaticamente le parti
   * degli override esterne al range.
   */
  await removePricingOverridesInsideRange({
    propertyId,
    from,
    to,
    source: "AI",
  });

  await removePricingOverridesInsideRange({
    propertyId,
    from,
    to,
    source: "MANUAL",
  });

  /*
   * Salviamo la raccomandazione del
   * periodo come override AI.
   *
   * Il prezzo deriva dal mercato,
   * non dalla Standard Rate manuale.
   */
  const dailyPrices =
    recommendation.dailyPrices ??
    [];

  if (
    dailyPrices.length === 0
  ) {
    return;
  }

  for (
    const dailyPrice of
      dailyPrices
  ) {
    const day =
      parseDate(
        dailyPrice.date,
      );

    await prisma.propertyPriceOverride.create({
      data: {
        propertyId,

        startDate:
          day,

        endDate:
          day,

        nightlyPrice:
          dailyPrice.recommendedPrice,

        minimumStay:
          recommendation.minimumStay,

        source:
          "AI",

        note:
          [
            "Revenue AI Market Based",
            `Data ${dailyPrice.date}`,
            "Prezzo giornaliero da segnali di mercato",
            result.message,
            `Copertura ${recommendation.coveragePercent}%`,
          ]
            .filter(Boolean)
            .join(" · "),
      },
    });
  }
  finish(
    propertyId,
    month,
    from,
    to,
  );
}

async function removePricingOverridesInsideRange({
  propertyId,
  from,
  to,
  source,
}: {
  propertyId: string;
  from: Date;
  to: Date;
  source: "AI" | "MANUAL";
}) {
  const overlapping =
    await prisma.propertyPriceOverride.findMany({
      where: {
        propertyId,
        source,

        startDate: {
          lte: to,
        },

        endDate: {
          gte: from,
        },
      },

      select: {
        id: true,
        startDate: true,
        endDate: true,
        nightlyPrice: true,
        minimumStay: true,
        maximumStay: true,
        occupancyIncluded: true,
        source: true,
        createdById: true,
        note: true,
      },
    });

  for (const override of overlapping) {
    await prisma.propertyPriceOverride.delete({
      where: {
        id: override.id,
      },
    });

    if (
      override.startDate < from
    ) {
      await prisma.propertyPriceOverride.create({
        data: {
          propertyId,

          startDate:
            override.startDate,

          endDate:
            shiftCalendarDate(
              from,
              -1,
            ),

          nightlyPrice:
            override.nightlyPrice,

          minimumStay:
            override.minimumStay,

          maximumStay:
            override.maximumStay,

          occupancyIncluded:
            override.occupancyIncluded,

          source:
            override.source,

          createdById:
            override.createdById,

          note:
            override.note,
        },
      });
    }

    if (
      override.endDate > to
    ) {
      await prisma.propertyPriceOverride.create({
        data: {
          propertyId,

          startDate:
            shiftCalendarDate(
              to,
              1,
            ),

          endDate:
            override.endDate,

          nightlyPrice:
            override.nightlyPrice,

          minimumStay:
            override.minimumStay,

          maximumStay:
            override.maximumStay,

          occupancyIncluded:
            override.occupancyIncluded,

          source:
            override.source,

          createdById:
            override.createdById,

          note:
            override.note,
        },
      });
    }
  }
}

function shiftCalendarDate(
  date: Date,
  days: number,
): Date {
  const result =
    new Date(date);

  result.setDate(
    result.getDate() +
      days,
  );

  return result;
}
function requiredText(
  formData: FormData,
  key: string,
) {
  const value =
    String(formData.get(key) ?? "").trim();

  if (!value) {
    throw new Error(`${key}: valore obbligatorio.`);
  }

  return value;
}

function parseDate(value: string) {
  const date =
    new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Data non valida.");
  }

  return date;
}



function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(
    date.getMonth() + 1,
  ).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

function finish(
  propertyId: string,
  month: string,
  from: Date,
  to: Date,
): never {
  revalidatePath("/calendar");

  const params =
    new URLSearchParams({
      propertyId,
      month,
      from: dateKey(from),
      to: dateKey(to),
    });

  redirect(
    `/calendar?${params.toString()}`,
  );
}