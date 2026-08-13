import type { BackgroundJob } from "@prisma/client";

import { prisma } from "@/lib/prisma";

type FailBackgroundJobInput = {
  jobId: string;
  error: unknown;
  retryDelayMs?: number;
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return "Errore sconosciuto durante l'elaborazione del job.";
  }
}

export async function failBackgroundJob({
  jobId,
  error,
  retryDelayMs = 30_000,
}: FailBackgroundJobInput): Promise<BackgroundJob> {
  if (
    !Number.isFinite(retryDelayMs) ||
    retryDelayMs < 0
  ) {
    throw new Error(
      "Il ritardo del retry deve essere un numero maggiore o uguale a zero.",
    );
  }

  const currentJob =
    await prisma.backgroundJob.findUnique({
      where: {
        id: jobId,
      },
    });

  if (!currentJob) {
    throw new Error("Il job non esiste.");
  }

  if (currentJob.status !== "RUNNING") {
    throw new Error(
      "Il job non è attualmente in esecuzione.",
    );
  }

  const shouldRetry =
    currentJob.attempts < currentJob.maxAttempts;

  const updatedJob =
    await prisma.backgroundJob.updateMany({
      where: {
        id: jobId,
        status: "RUNNING",
      },
      data: shouldRetry
        ? {
            status: "QUEUED",
            availableAt: new Date(
              Date.now() + retryDelayMs,
            ),
            startedAt: null,
            finishedAt: null,
            lastError: getErrorMessage(error),
          }
        : {
            status: "FAILED",
            finishedAt: new Date(),
            lastError: getErrorMessage(error),
          },
    });

  if (updatedJob.count === 0) {
    throw new Error(
      "Il job è stato modificato da un altro processo.",
    );
  }

  const job = await prisma.backgroundJob.findUnique({
    where: {
      id: jobId,
    },
  });

  if (!job) {
    throw new Error(
      "Il job aggiornato non è stato trovato.",
    );
  }

  return job;
}