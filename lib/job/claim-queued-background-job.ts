import type { BackgroundJob } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function claimNextBackgroundJob(): Promise<
  BackgroundJob | null
> {
  return prisma.$transaction(async (transaction) => {
    const jobs = await transaction.$queryRaw<
      BackgroundJob[]
    >`
      WITH "nextJob" AS (
        SELECT "id"
        FROM "BackgroundJob"
        WHERE "status" = 'QUEUED'
          AND "availableAt" <= NOW()
        ORDER BY
          "availableAt" ASC,
          "createdAt" ASC
        FOR UPDATE SKIP LOCKED
        LIMIT 1
      )
      UPDATE "BackgroundJob" AS job
      SET
        "status" = 'RUNNING',
        "attempts" = job."attempts" + 1,
        "startedAt" = NOW(),
        "finishedAt" = NULL,
        "updatedAt" = NOW()
      FROM "nextJob"
      WHERE job."id" = "nextJob"."id"
      RETURNING job.*;
    `;

    return jobs[0] ?? null;
  });
}