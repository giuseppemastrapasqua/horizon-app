import type {
  BackgroundJob,
  BackgroundJobType,
  Prisma,
} from "@prisma/client";
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const processBookingSyncJobMock = vi.hoisted(() =>
  vi.fn(),
);

const processPropertyCodeVerificationJobMock =
  vi.hoisted(() => vi.fn());

const processPropertyDocumentOcrJobMock =
  vi.hoisted(() => vi.fn());

const processStorageObjectDeleteJobMock =
  vi.hoisted(() => vi.fn());

vi.mock(
  "@/lib/job/handlers/process-booking-sync-job",
  () => ({
    processBookingSyncJob:
      processBookingSyncJobMock,
  }),
);

vi.mock(
  "@/lib/job/handlers/process-property-code-verification-job",
  () => ({
    processPropertyCodeVerificationJob:
      processPropertyCodeVerificationJobMock,
  }),
);

vi.mock(
  "@/lib/job/handlers/process-property-document-ocr-job",
  () => ({
    processPropertyDocumentOcrJob:
      processPropertyDocumentOcrJobMock,
  }),
);

vi.mock(
  "@/lib/job/handlers/process-storage-object-delete-job",
  () => ({
    processStorageObjectDeleteJob:
      processStorageObjectDeleteJobMock,
  }),
);

import { dispatchBackgroundJob } from "./dispatch-background-job";

describe("dispatchBackgroundJob", () => {
  beforeEach(() => {
    processBookingSyncJobMock.mockReset();
    processPropertyCodeVerificationJobMock.mockReset();
    processPropertyDocumentOcrJobMock.mockReset();
    processStorageObjectDeleteJobMock.mockReset();

    processBookingSyncJobMock.mockResolvedValue(undefined);
    processPropertyCodeVerificationJobMock.mockResolvedValue(undefined);
    processPropertyDocumentOcrJobMock.mockResolvedValue(undefined);
    processStorageObjectDeleteJobMock.mockResolvedValue(undefined);
  });

  it("inoltra BOOKING_SYNC al relativo handler", async () => {
    const job = createBackgroundJob({
      type: "BOOKING_SYNC",
      payload: {
        provider: "BOOKING_COM",
      },
    });

    await dispatchBackgroundJob(job);

    expect(
      processBookingSyncJobMock,
    ).toHaveBeenCalledOnce();

    expect(
      processBookingSyncJobMock,
    ).toHaveBeenCalledWith(job);

    expect(
      processPropertyCodeVerificationJobMock,
    ).not.toHaveBeenCalled();

    expect(
      processPropertyDocumentOcrJobMock,
    ).not.toHaveBeenCalled();

    expect(
      processStorageObjectDeleteJobMock,
    ).not.toHaveBeenCalled();
  });

  it("inoltra PROPERTY_CODE_VERIFICATION al relativo handler", async () => {
    const job = createBackgroundJob({
      type: "PROPERTY_CODE_VERIFICATION",
      payload: {
        propertyId: "property-1",
      },
    });

    await dispatchBackgroundJob(job);

    expect(
      processPropertyCodeVerificationJobMock,
    ).toHaveBeenCalledWith(job);
  });

  it("inoltra PROPERTY_DOCUMENT_OCR al relativo handler", async () => {
    const job = createBackgroundJob({
      type: "PROPERTY_DOCUMENT_OCR",
      payload: {
        documentId: "document-1",
      },
    });

    await dispatchBackgroundJob(job);

    expect(
      processPropertyDocumentOcrJobMock,
    ).toHaveBeenCalledWith(job);
  });

  it("inoltra STORAGE_OBJECT_DELETE al relativo handler", async () => {
    const job = createBackgroundJob({
      type: "STORAGE_OBJECT_DELETE",
      payload: {
        key: "properties/property-1/image.webp",
      },
    });

    await dispatchBackgroundJob(job);

    expect(
      processStorageObjectDeleteJobMock,
    ).toHaveBeenCalledOnce();

    expect(
      processStorageObjectDeleteJobMock,
    ).toHaveBeenCalledWith(job);
  });

  it.each([
    "PROPERTY_DOCUMENT_ANALYSIS",
    "PROPERTY_DOCUMENT_AI_REVIEW",
    "PROPERTY_SYNC",
    "FINANCE_REPORT_GENERATION",
    "REVENUE_AI_ANALYSIS",
  ] satisfies BackgroundJobType[])(
    "rifiuta il job %s perché l'handler non è implementato",
    async (type) => {
      const job = createBackgroundJob({
        type,
        payload: {},
      });

      await expect(
        dispatchBackgroundJob(job),
      ).rejects.toThrow(
        `Handler non ancora implementato per il job ${type}.`,
      );
    },
  );

  it("propaga gli errori dell'handler", async () => {
    const handlerError = new Error(
      "Sincronizzazione fallita.",
    );

    processBookingSyncJobMock.mockRejectedValueOnce(
      handlerError,
    );

    const job = createBackgroundJob({
      type: "BOOKING_SYNC",
      payload: {},
    });

    await expect(
      dispatchBackgroundJob(job),
    ).rejects.toBe(handlerError);
  });
});

type CreateBackgroundJobInput = {
  type: BackgroundJobType;
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