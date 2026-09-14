"use server";

import {
  revalidatePath,
} from "next/cache";

import {
  redirect,
} from "next/navigation";

import {
  requirePropertyRole,
} from "@/lib/auth/guards";

import {
  enqueueBackgroundJob,
} from "@/lib/job/enqueue-background-job";

function requiredText(
  formData: FormData,
  key: string,
) {
  const value =
    formData.get(key);

  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    throw new Error(
      `Campo "${key}" obbligatorio.`,
    );
  }

  return value.trim();
}

function parseDateKey(
  value: string,
) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      value,
    )
  ) {
    throw new Error(
      `Data non valida: ${value}.`,
    );
  }

  const date =
    new Date(
      `${value}T00:00:00.000Z`,
    );

  if (
    Number.isNaN(
      date.getTime(),
    ) ||
    date
      .toISOString()
      .slice(0, 10) !==
      value
  ) {
    throw new Error(
      `Data non valida: ${value}.`,
    );
  }

  return date;
}

function dateKey(
  date: Date,
) {
  return date
    .toISOString()
    .slice(0, 10);
}

export async function runRevenueAiWorkspaceAnalysisAction(
  formData: FormData,
) {
  const propertyId =
    requiredText(
      formData,
      "propertyId",
    );

  await requirePropertyRole(
    propertyId,
    [
      "OWNER",
      "MANAGER",
    ],
  );

  const fromText =
    requiredText(
      formData,
      "from",
    );

  const toText =
    requiredText(
      formData,
      "to",
    );

  const from =
    parseDateKey(
      fromText,
    );

  const to =
    parseDateKey(
      toText,
    );

  if (
    to.getTime() <
    from.getTime()
  ) {
    throw new Error(
      "La data Al non può precedere la data Dal.",
    );
  }

  const strategy =
    "BALANCED" as const;

  let currentDate =
    new Date(from);

  while (
    currentDate.getTime() <=
    to.getTime()
  ) {
    const date =
      dateKey(
        currentDate,
      );

    await enqueueBackgroundJob({
      type:
        "REVENUE_AI_ANALYSIS",

      payload: {
        propertyId,
        date,
        strategy,
      },

      deduplicationKey:
        `revenue-ai-analysis:${propertyId}:${date}:${strategy}`,
    });

    currentDate =
      new Date(
        currentDate.getTime() +
          24 *
            60 *
            60 *
            1000,
      );
  }

  revalidatePath(
    "/revenue-ai",
  );

  revalidatePath(
    "/calendar/revenue-ai",
  );

  redirect(
    `/revenue-ai?propertyId=${encodeURIComponent(
      propertyId,
    )}&from=${fromText}&to=${toText}&queued=1`,
  );
}
