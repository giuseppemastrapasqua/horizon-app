import type { BackgroundJob } from "@prisma/client";
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  NonRetryableBackgroundJobError,
} from "@/lib/job/background-job-errors";

const {
  findUniqueMock,
  updateManyMock,
} = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
  updateManyMock: vi.fn(),
}));

vi.mock(
  "@/lib/prisma",
  () => ({
    prisma: {
      backgroundJob: {
        findUnique: findUniqueMock,
        updateMany: updateManyMock,
      },
    },
  }),
);

import {
  failBackgroundJob,
} from "./fail-background-job";

function createJob(
  input: Partial<BackgroundJob> = {},
): BackgroundJob {
  const now = new Date(
    "2026-09-02T12:00:00.000Z",
  );

  return {
    id: "job-1",
    type: "ALLOGGIATI_WEB_SUBMISSION",
    payload: {},
    status: "RUNNING",
    attempts: 1,
    maxAttempts: 3,
    availableAt: now,
    startedAt: now,
    heartbeatAt: null,
    finishedAt: null,
    lastError: null,
    deduplicationKey: null,
    createdAt: now,
    updatedAt: now,
    ...input,
  };
}

describe("failBackgroundJob", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it(
    "rimette in coda un errore retryable",
    async () => {
      const currentJob = createJob();

      const queuedJob = createJob({
        status: "QUEUED",
        startedAt: null,
        lastError: "Errore temporaneo.",
      });

      findUniqueMock
        .mockResolvedValueOnce(currentJob)
        .mockResolvedValueOnce(queuedJob);

      updateManyMock.mockResolvedValue({
        count: 1,
      });

      const result = await failBackgroundJob({
        jobId: currentJob.id,
        error: new Error(
          "Errore temporaneo.",
        ),
        retryDelayMs: 0,
      });

      expect(
        updateManyMock,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "QUEUED",
            lastError:
              "Errore temporaneo.",
          }),
        }),
      );

      expect(result).toBe(queuedJob);
    },
  );

  it(
    "termina un errore retryable all'ultimo tentativo",
    async () => {
      const currentJob = createJob({
        attempts: 3,
        maxAttempts: 3,
      });

      const failedJob = createJob({
        status: "FAILED",
        attempts: 3,
        maxAttempts: 3,
        finishedAt: new Date(
          "2026-09-02T12:01:00.000Z",
        ),
        lastError: "Errore temporaneo.",
      });

      findUniqueMock
        .mockResolvedValueOnce(currentJob)
        .mockResolvedValueOnce(failedJob);

      updateManyMock.mockResolvedValue({
        count: 1,
      });

      const result = await failBackgroundJob({
        jobId: currentJob.id,
        error: new Error(
          "Errore temporaneo.",
        ),
      });

      expect(
        updateManyMock,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "FAILED",
            lastError:
              "Errore temporaneo.",
          }),
        }),
      );

      expect(result).toBe(failedJob);
    },
  );
  it(
    "non ritenta un errore non retryable",
    async () => {
      const currentJob = createJob();

      const failedJob = createJob({
        status: "FAILED",
        finishedAt: new Date(
          "2026-09-02T12:01:00.000Z",
        ),
        lastError:
          "Esito trasmissione ambiguo.",
      });

      findUniqueMock
        .mockResolvedValueOnce(currentJob)
        .mockResolvedValueOnce(failedJob);

      updateManyMock.mockResolvedValue({
        count: 1,
      });

      const result = await failBackgroundJob({
        jobId: currentJob.id,
        error:
          new NonRetryableBackgroundJobError(
            "Esito trasmissione ambiguo.",
          ),
      });

      expect(
        updateManyMock,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "FAILED",
            lastError:
              "Esito trasmissione ambiguo.",
          }),
        }),
      );

      expect(result).toBe(failedJob);
    },
  );
});
