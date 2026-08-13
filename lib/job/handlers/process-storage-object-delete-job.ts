import type {
  BackgroundJob,
  Prisma,
} from "@prisma/client";

import { defaultStorageProvider } from "@/lib/storage/default-storage-provider";

type StorageObjectDeleteJobPayload = {
  key: string;
};

function getPayload(
  job: BackgroundJob,
): StorageObjectDeleteJobPayload {
  if (job.type !== "STORAGE_OBJECT_DELETE") {
    throw new Error(
      `Tipo di job non supportato dall'handler storage: ${job.type}.`,
    );
  }

  const payload =
    (job.payload as Prisma.JsonObject | null) ?? {};

  const key =
    typeof payload.key === "string"
      ? payload.key.trim()
      : "";

  if (!key) {
    throw new Error(
      "Il payload del job STORAGE_OBJECT_DELETE deve contenere una key valida.",
    );
  }

  return {
    key,
  };
}

export async function processStorageObjectDeleteJob(
  job: BackgroundJob,
): Promise<void> {
  const payload = getPayload(job);

  await defaultStorageProvider.delete(payload.key);
}