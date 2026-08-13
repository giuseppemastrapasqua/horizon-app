import type { Prisma } from "@prisma/client";
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const backgroundJobCreateMock = vi.hoisted(() =>
  vi.fn(),
);

const prismaTransactionMock = vi.hoisted(() =>
  vi.fn(),
);

vi.mock("@/lib/prisma", () => ({
  prisma: {
    backgroundJob: {
      create: backgroundJobCreateMock,
    },
    $transaction: prismaTransactionMock,
  },
}));

import { enqueueBackgroundJob } from "./enqueue-background-job";

describe("enqueueBackgroundJob", () => {
  beforeEach(() => {
    backgroundJobCreateMock.mockReset();
    prismaTransactionMock.mockReset();
  });

  it("crea direttamente un job senza deduplicazione", async () => {
    const createdJob = {
      id: "job-1",
    };

    backgroundJobCreateMock.mockResolvedValueOnce(
      createdJob,
    );

    const result = await enqueueBackgroundJob({
      type: "STORAGE_OBJECT_DELETE",
      payload: {
        key: "properties/property-1/image.webp",
      },
      maxAttempts: 5,
      availableAt: new Date(
        "2026-08-02T12:00:00.000Z",
      ),
    });

    expect(result).toBe(createdJob);

    expect(
      backgroundJobCreateMock,
    ).toHaveBeenCalledWith({
      data: {
        type: "STORAGE_OBJECT_DELETE",
        payload: {
          key: "properties/property-1/image.webp",
        },
        maxAttempts: 5,
        availableAt: new Date(
          "2026-08-02T12:00:00.000Z",
        ),
      },
    });

    expect(
      prismaTransactionMock,
    ).not.toHaveBeenCalled();
  });

  it("rifiuta maxAttempts non valido", async () => {
    await expect(
      enqueueBackgroundJob({
        type: "STORAGE_OBJECT_DELETE",
        payload: {
          key: "properties/property-1/image.webp",
        },
        maxAttempts: 0,
      }),
    ).rejects.toThrow(
      "maxAttempts deve essere un numero intero maggiore di zero.",
    );

    expect(
      backgroundJobCreateMock,
    ).not.toHaveBeenCalled();

    expect(
      prismaTransactionMock,
    ).not.toHaveBeenCalled();
  });

  it("rifiuta una deduplicationKey vuota", async () => {
    await expect(
      enqueueBackgroundJob({
        type: "STORAGE_OBJECT_DELETE",
        payload: {
          key: "properties/property-1/image.webp",
        },
        deduplicationKey: "   ",
      }),
    ).rejects.toThrow(
      "deduplicationKey non può essere vuota.",
    );

    expect(
      backgroundJobCreateMock,
    ).not.toHaveBeenCalled();

    expect(
      prismaTransactionMock,
    ).not.toHaveBeenCalled();
  });

  it("usa la transazione fornita senza aprirne una nuova", async () => {
    const transaction = createTransactionMock();

    transaction.backgroundJob.create.mockResolvedValueOnce({
      id: "job-transaction-1",
    });

    const result = await enqueueBackgroundJob(
      {
        type: "STORAGE_OBJECT_DELETE",
        payload: {
          key: "properties/property-1/image.webp",
        },
      },
      transaction.client,
    );

    expect(result).toEqual({
      id: "job-transaction-1",
    });

    expect(
      transaction.backgroundJob.create,
    ).toHaveBeenCalledWith({
      data: {
        type: "STORAGE_OBJECT_DELETE",
        payload: {
          key: "properties/property-1/image.webp",
        },
        maxAttempts: 3,
        availableAt: expect.any(Date),
      },
    });

    expect(
      prismaTransactionMock,
    ).not.toHaveBeenCalled();
  });

  it("restituisce il job attivo già esistente durante la deduplicazione", async () => {
    const transaction = createTransactionMock();

    const existingJob = {
      id: "existing-job-1",
    };

    transaction.backgroundJob.findFirst.mockResolvedValueOnce(
      existingJob,
    );

    const result = await enqueueBackgroundJob(
      {
        type: "STORAGE_OBJECT_DELETE",
        payload: {
          key: "properties/property-1/image.webp",
        },
        deduplicationKey:
          "storage-object-delete:properties/property-1/image.webp",
      },
      transaction.client,
    );

    expect(result).toBe(existingJob);

    expect(
      transaction.$queryRaw,
    ).toHaveBeenCalledOnce();

    expect(
      transaction.backgroundJob.findFirst,
    ).toHaveBeenCalledWith({
      where: {
        type: "STORAGE_OBJECT_DELETE",
        status: {
          in: ["QUEUED", "RUNNING"],
        },
        deduplicationKey:
          "storage-object-delete:properties/property-1/image.webp",
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    expect(
      transaction.backgroundJob.create,
    ).not.toHaveBeenCalled();

    expect(
      prismaTransactionMock,
    ).not.toHaveBeenCalled();
  });

  it("crea il job deduplicato quando non esistono job attivi", async () => {
    const transaction = createTransactionMock();

    transaction.backgroundJob.findFirst.mockResolvedValueOnce(
      null,
    );

    transaction.backgroundJob.create.mockResolvedValueOnce({
      id: "new-job-1",
    });

    const result = await enqueueBackgroundJob(
      {
        type: "STORAGE_OBJECT_DELETE",
        payload: {
          key: "properties/property-1/image.webp",
        },
        maxAttempts: 5,
        deduplicationKey:
          "storage-object-delete:properties/property-1/image.webp",
      },
      transaction.client,
    );

    expect(result).toEqual({
      id: "new-job-1",
    });

    expect(
      transaction.$queryRaw,
    ).toHaveBeenCalledOnce();

    expect(
      transaction.backgroundJob.create,
    ).toHaveBeenCalledWith({
      data: {
        type: "STORAGE_OBJECT_DELETE",
        payload: {
          key: "properties/property-1/image.webp",
        },
        deduplicationKey:
          "storage-object-delete:properties/property-1/image.webp",
        maxAttempts: 5,
        availableAt: expect.any(Date),
      },
    });

    expect(
      prismaTransactionMock,
    ).not.toHaveBeenCalled();
  });
});

function createTransactionMock() {
  const backgroundJob = {
    create: vi.fn(),
    findFirst: vi.fn(),
  };

  const $queryRaw = vi.fn().mockResolvedValue([
    {
      acquired: true,
    },
  ]);

  const client = {
    backgroundJob,
    $queryRaw,
  } as unknown as Prisma.TransactionClient;

  return {
    client,
    backgroundJob,
    $queryRaw,
  };
}