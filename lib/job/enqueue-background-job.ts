import {
  BackgroundJobStatus,
  BackgroundJobType,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

type EnqueueBackgroundJobInput = {
  type: BackgroundJobType;
  payload: Prisma.InputJsonValue;
  maxAttempts?: number;
  availableAt?: Date;
  deduplicationKey?: string;
};

type NormalizedEnqueueBackgroundJobInput = {
  type: BackgroundJobType;
  payload: Prisma.InputJsonValue;
  maxAttempts: number;
  availableAt: Date;
  deduplicationKey?: string;
};

const ACTIVE_JOB_STATUSES: BackgroundJobStatus[] = [
  "QUEUED",
  "RUNNING",
];

export async function enqueueBackgroundJob(
  input: EnqueueBackgroundJobInput,
  transaction?: Prisma.TransactionClient,
) {
  const normalizedInput = normalizeInput(input);

  if (!normalizedInput.deduplicationKey) {
    const client = transaction ?? prisma;

    return client.backgroundJob.create({
      data: {
        type: normalizedInput.type,
        payload: normalizedInput.payload,
        maxAttempts: normalizedInput.maxAttempts,
        availableAt: normalizedInput.availableAt,
      },
    });
  }

  if (transaction) {
    return enqueueDeduplicatedBackgroundJob(
      transaction,
      normalizedInput,
    );
  }

  return prisma.$transaction((currentTransaction) =>
    enqueueDeduplicatedBackgroundJob(
      currentTransaction,
      normalizedInput,
    ),
  );
}

function normalizeInput({
  type,
  payload,
  maxAttempts = 3,
  availableAt = new Date(),
  deduplicationKey,
}: EnqueueBackgroundJobInput): NormalizedEnqueueBackgroundJobInput {
  if (
    !Number.isInteger(maxAttempts) ||
    maxAttempts < 1
  ) {
    throw new Error(
      "maxAttempts deve essere un numero intero maggiore di zero.",
    );
  }

  const normalizedDeduplicationKey =
    deduplicationKey?.trim();

  if (
    deduplicationKey !== undefined &&
    !normalizedDeduplicationKey
  ) {
    throw new Error(
      "deduplicationKey non può essere vuota.",
    );
  }

  return {
    type,
    payload,
    maxAttempts,
    availableAt,
    deduplicationKey:
      normalizedDeduplicationKey,
  };
}

async function enqueueDeduplicatedBackgroundJob(
  transaction: Prisma.TransactionClient,
  input: NormalizedEnqueueBackgroundJobInput,
) {
  const deduplicationKey = input.deduplicationKey;

  if (!deduplicationKey) {
    throw new Error(
      "La chiave di deduplicazione è obbligatoria.",
    );
  }

  await transaction.$queryRaw<
    Array<{
      acquired: boolean;
    }>
  >`
    SELECT
      pg_advisory_xact_lock(
        hashtextextended(
          ${deduplicationKey},
          0
        )
      ) IS NULL AS "acquired"
  `;

  const existingJob =
  await transaction.backgroundJob.findFirst({
    where: {
      type: input.type,
      status: {
        in: ACTIVE_JOB_STATUSES,
      },
      deduplicationKey,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (existingJob) {
    return existingJob;
  }

return transaction.backgroundJob.create({
  data: {
    type: input.type,
    payload: input.payload,
    deduplicationKey,
    maxAttempts: input.maxAttempts,
    availableAt: input.availableAt,
  },
});
}