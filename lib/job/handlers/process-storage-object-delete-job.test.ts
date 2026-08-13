import type {
  BackgroundJob,
  Prisma,
} from "@prisma/client";
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const storageDeleteMock = vi.hoisted(() =>
  vi.fn<(key: string) => Promise<void>>(),
);

vi.mock(
  "@/lib/storage/default-storage-provider",
  () => ({
    defaultStorageProvider: {
      upload: vi.fn(),
      delete: storageDeleteMock,
    },
  }),
);

import { processStorageObjectDeleteJob } from "./process-storage-object-delete-job";

describe("processStorageObjectDeleteJob", () => {
  beforeEach(() => {
    storageDeleteMock.mockReset();
    storageDeleteMock.mockResolvedValue(undefined);
  });

  it("elimina l'oggetto storage indicato nel payload", async () => {
    const job = createBackgroundJob({
      type: "STORAGE_OBJECT_DELETE",
      payload: {
        key: "properties/property-1/image.webp",
      },
    });

    await processStorageObjectDeleteJob(job);

    expect(storageDeleteMock).toHaveBeenCalledOnce();
    expect(storageDeleteMock).toHaveBeenCalledWith(
      "properties/property-1/image.webp",
    );
  });

  it("normalizza gli spazi nella key", async () => {
    const job = createBackgroundJob({
      type: "STORAGE_OBJECT_DELETE",
      payload: {
        key: "  properties/property-1/image.webp  ",
      },
    });

    await processStorageObjectDeleteJob(job);

    expect(storageDeleteMock).toHaveBeenCalledWith(
      "properties/property-1/image.webp",
    );
  });

  it("rifiuta un payload senza key", async () => {
    const job = createBackgroundJob({
      type: "STORAGE_OBJECT_DELETE",
      payload: {},
    });

    await expect(
      processStorageObjectDeleteJob(job),
    ).rejects.toThrow(
      "Il payload del job STORAGE_OBJECT_DELETE deve contenere una key valida.",
    );

    expect(storageDeleteMock).not.toHaveBeenCalled();
  });

  it("rifiuta una key vuota", async () => {
    const job = createBackgroundJob({
      type: "STORAGE_OBJECT_DELETE",
      payload: {
        key: "   ",
      },
    });

    await expect(
      processStorageObjectDeleteJob(job),
    ).rejects.toThrow(
      "Il payload del job STORAGE_OBJECT_DELETE deve contenere una key valida.",
    );

    expect(storageDeleteMock).not.toHaveBeenCalled();
  });

  it("rifiuta un tipo di job non supportato", async () => {
    const job = createBackgroundJob({
      type: "BOOKING_SYNC",
      payload: {
        key: "properties/property-1/image.webp",
      },
    });

    await expect(
      processStorageObjectDeleteJob(job),
    ).rejects.toThrow(
      "Tipo di job non supportato dall'handler storage: BOOKING_SYNC.",
    );

    expect(storageDeleteMock).not.toHaveBeenCalled();
  });

  it("propaga gli errori dello storage per consentire il retry", async () => {
    const storageError = new Error(
      "Storage temporaneamente non disponibile.",
    );

    storageDeleteMock.mockRejectedValueOnce(
      storageError,
    );

    const job = createBackgroundJob({
      type: "STORAGE_OBJECT_DELETE",
      payload: {
        key: "properties/property-1/image.webp",
      },
    });

    await expect(
      processStorageObjectDeleteJob(job),
    ).rejects.toBe(storageError);

    expect(storageDeleteMock).toHaveBeenCalledOnce();
  });
});

type CreateBackgroundJobInput = {
  type: BackgroundJob["type"];
  payload: Prisma.JsonValue;
};

function createBackgroundJob({
  type,
  payload,
}: CreateBackgroundJobInput): BackgroundJob {
  return {
    id: "background-job-1",
    type,
    status: "QUEUED",
    payload,
    deduplicationKey: null,
    attempts: 0,
    maxAttempts: 3,
    availableAt: new Date(
      "2026-08-02T12:00:00.000Z",
    ),
    startedAt: null,
    heartbeatAt: null,
    finishedAt: null,
    lastError: null,
    createdAt: new Date(
      "2026-08-02T12:00:00.000Z",
    ),
    updatedAt: new Date(
      "2026-08-02T12:00:00.000Z",
    ),
  };
}