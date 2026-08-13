import type { BackgroundJob } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function completeBackgroundJob(
  jobId: string,
): Promise<BackgroundJob> {
  const result = await prisma.backgroundJob.updateMany({
    where: {
      id: jobId,
      status: "RUNNING",
    },
    data: {
      status: "COMPLETED",
      finishedAt: new Date(),
      lastError: null,
    },
  });

  if (result.count === 0) {
    throw new Error(
      "Il job non esiste oppure non è attualmente in esecuzione.",
    );
  }

  const job = await prisma.backgroundJob.findUnique({
    where: {
      id: jobId,
    },
  });

  if (!job) {
    throw new Error(
      "Il job completato non è stato trovato.",
    );
  }

  return job;
}