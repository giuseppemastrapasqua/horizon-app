"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { enqueueBackgroundJob } from "@/lib/job/enqueue-background-job";
import { requirePropertyAccess } from "@/lib/auth/guards";
import { getPropertyRevenueAnalysis } from "@/lib/revenue/get-property-revenue-analysis";

export async function saveCalendarPeriodAction(formData: FormData) {
  const propertyId = requiredText(formData, "propertyId");
  await requirePropertyAccess(propertyId);

  const month = requiredText(formData, "month");
  const from = parseDate(requiredText(formData, "from"));
  const to = parseDate(requiredText(formData, "to"));

  if (to < from) {
    throw new Error("La data A non può precedere la data Da.");
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

  if (
    availability !== "OPEN" &&
    availability !== "CLOSED"
  ) {
    throw new Error("Disponibilità non valida.");
  }

  await prisma.$transaction(async (transaction) => {
    await removePricingOverridesInsideRange({
      propertyId,
      from,
      to,
      source: "AI",
      db: transaction,
    });

    await removePricingOverridesInsideRange({
      propertyId,
      from,
      to,
      source: "MANUAL",
      db: transaction,
    });

    await transaction.propertyPriceOverride.create({
      data: {
        propertyId,
        startDate: from,
        endDate: to,
        nightlyPrice: standardRate,
        source: "MANUAL",
        note: "Standard Rate impostata dal calendario Horizon",
      },
    });

    await removeAvailabilityBlocksInsideRange({
      propertyId,
      from,
      to,
      db: transaction,
    });

    if (availability === "CLOSED") {
      await transaction.propertyAvailabilityBlock.create({
        data: {
          propertyId,
          startDate: from,
          endDate: to,
          source: "MANUAL",
          note: "Periodo chiuso dal calendario Horizon",
        },
      });
    }
  });

  finish(propertyId, month, from, to);
}

export async function applyRevenueAiAction(
  formData: FormData,
) {
  const propertyId =
    requiredText(formData, "propertyId");

  await requirePropertyAccess(propertyId);

  const month =
    requiredText(formData, "month");

  const from =
    parseDate(requiredText(formData, "from"));

  const to =
    parseDate(requiredText(formData, "to"));

  if (to < from) {
    throw new Error(
      "La data A non può precedere la data Da.",
    );
  }

  const strategy =
    "BALANCED" as const;

  let currentDate =
    new Date(from);

  let queuedJobs = 0;

  while (currentDate <= to) {
    const date =
      dateKey(currentDate);

    await enqueueBackgroundJob({
      type: "REVENUE_AI_ANALYSIS",

      payload: {
        propertyId,
        date,
        strategy,
      },

      deduplicationKey:
        `revenue-ai-analysis:${propertyId}:${date}:${strategy}`,
    });

    queuedJobs += 1;

    currentDate =
      shiftCalendarDate(
        currentDate,
        1,
      );
  }

  if (queuedJobs === 0) {
    return;
  }

  revalidatePath("/calendar");
  revalidatePath("/calendar/revenue-ai");

  finish(
    propertyId,
    month,
    from,
    to,
  );
}

export async function applyRevenueRecommendationAction(
  formData: FormData,
) {
  const propertyId =
    requiredText(formData, "propertyId");

  await requirePropertyAccess(propertyId);

  const month =
    requiredText(formData, "month");

  const from =
    parseDate(requiredText(formData, "from"));

  const to =
    parseDate(requiredText(formData, "to"));

  if (to < from) {
    throw new Error(
      "La data A non può precedere la data Da.",
    );
  }

  const analysis =
    await getPropertyRevenueAnalysis({
      propertyId,
      startDate: toUtcCalendarDate(from),
      endDate: toUtcCalendarDate(to),
    });

  const recommendation =
    analysis?.recommendation;

  const dailyPrices =
    recommendation?.dailyPrices;

  if (!recommendation || !dailyPrices?.length) {
    throw new Error(
      "Nessuna raccomandazione Revenue AI disponibile.",
    );
  }

  await prisma.$transaction(async (transaction) => {
    await removePricingOverridesInsideRange({
      propertyId,
      from,
      to,
      source: "AI",
      db: transaction,
    });

    await removePricingOverridesInsideRange({
      propertyId,
      from,
      to,
      source: "MANUAL",
      db: transaction,
    });

    for (const day of dailyPrices) {
      const date =
        parseDate(day.date);

      await transaction.propertyPriceOverride.create({
        data: {
          propertyId,
          startDate: date,
          endDate: date,
          nightlyPrice:
            day.recommendedPrice,
          minimumStay:
            recommendation.minimumStay,
          source: "AI",
          note: "Revenue AI Horizon",
        },
      });
    }
  });

  revalidatePath("/calendar");
  revalidatePath("/calendar/revenue-ai");

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
  db = prisma,
}: {
  propertyId: string;
  from: Date;
  to: Date;
  source: "AI" | "MANUAL";
  db?: Pick<typeof prisma, "propertyPriceOverride">;
}) {
  const overlapping =
    await db.propertyPriceOverride.findMany({
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
    await db.propertyPriceOverride.delete({
      where: {
        id: override.id,
      },
    });

    if (override.startDate < from) {
      await db.propertyPriceOverride.create({
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

    if (override.endDate > to) {
      await db.propertyPriceOverride.create({
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

async function removeAvailabilityBlocksInsideRange({
  propertyId,
  from,
  to,
  db = prisma,
}: {
  propertyId: string;
  from: Date;
  to: Date;
  db?: Pick<typeof prisma, "propertyAvailabilityBlock">;
}) {
  const overlapping =
    await db.propertyAvailabilityBlock.findMany({
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

      select: {
        id: true,
        startDate: true,
        endDate: true,
        source: true,
        createdById: true,
        note: true,
      },
    });

  for (const block of overlapping) {
    await db.propertyAvailabilityBlock.delete({
      where: {
        id: block.id,
      },
    });

    if (block.startDate < from) {
      await db.propertyAvailabilityBlock.create({
        data: {
          propertyId,
          startDate:
            block.startDate,
          endDate:
            shiftCalendarDate(
              from,
              -1,
            ),
          source:
            block.source,
          createdById:
            block.createdById,
          note:
            block.note,
        },
      });
    }

    if (block.endDate > to) {
      await db.propertyAvailabilityBlock.create({
        data: {
          propertyId,
          startDate:
            shiftCalendarDate(
              to,
              1,
            ),
          endDate:
            block.endDate,
          source:
            block.source,
          createdById:
            block.createdById,
          note:
            block.note,
        },
      });
    }
  }
}

function toUtcCalendarDate(
  date: Date,
): Date {
  return new Date(
    Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    ),
  );
}

function shiftCalendarDate(
  date: Date,
  days: number,
): Date {
  const result =
    new Date(date);

  result.setDate(
    result.getDate() + days,
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
    throw new Error(
      `${key}: valore obbligatorio.`,
    );
  }

  return value;
}

function parseDate(value: string) {
  const date =
    new Date(`${value.slice(0, 10)}T00:00:00`);

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
