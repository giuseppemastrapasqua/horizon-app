import type { BackgroundJob } from "@prisma/client";
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const claimNextBackgroundJobMock = vi.hoisted(() =>
  vi.fn(),
);

const dispatchBackgroundJobMock = vi.hoisted(() =>
  vi.fn(),
);

const completeBackgroundJobMock = vi.hoisted(() =>
  vi.fn(),
);

const failBackgroundJobMock = vi.hoisted(() =>
  vi.fn(),
);

const handleFailedBackgroundJobMock = vi.hoisted(() =>
  vi.fn(),
);

vi.mock(
  "@/lib/job/claim-queued-background-job",
  () => ({
    claimNextBackgroundJob:
      claimNextBackgroundJobMock,
  }),
);

vi.mock(
  "@/lib/job/dispatch-background-job",
  () => ({
    dispatchBackgroundJob:
      dispatchBackgroundJobMock,
  }),
);

vi.mock(
  "@/lib/job/complete-background-job",
  () => ({
    completeBackgroundJob:
      completeBackgroundJobMock,
  }),
);

vi.mock(
  "@/lib/job/fail-background-job",
  () => ({
    failBackgroundJob:
      failBackgroundJobMock,
  }),
);

vi.mock(
  "@/lib/job/handle-failed-background-job",
  () => ({
    handleFailedBackgroundJob:
      handleFailedBackgroundJobMock,
  }),
);

import { processNextBackgroundJob } from "./process-next-background-job";

describe("processNextBackgroundJob", () => {
  beforeEach(() => {
    claimNextBackgroundJobMock.mockReset();
    dispatchBackgroundJobMock.mockReset();
    completeBackgroundJobMock.mockReset();
    failBackgroundJobMock.mockReset();
    handleFailedBackgroundJobMock.mockReset();

    dispatchBackgroundJobMock.mockResolvedValue(undefined);
    completeBackgroundJobMock.mockResolvedValue(undefined);
    handleFailedBackgroundJobMock.mockResolvedValue(undefined);
  });

  it("restituisce false quando non ci sono job disponibili", async () => {
    claimNextBackgroundJobMock.mockResolvedValueOnce(
      null,
    );

    const processed =
      await processNextBackgroundJob();

    expect(processed).toBe(false);

    expect(
      dispatchBackgroundJobMock,
    ).not.toHaveBeenCalled();

    expect(
      completeBackgroundJobMock,
    ).not.toHaveBeenCalled();

    expect(
      failBackgroundJobMock,
    ).not.toHaveBeenCalled();

    expect(
      handleFailedBackgroundJobMock,
    ).not.toHaveBeenCalled();
  });

  it("processa e completa un job con successo", async () => {
    const job = createBackgroundJob();

    claimNextBackgroundJobMock.mockResolvedValueOnce(
      job,
    );

    const processed =
      await processNextBackgroundJob();

    expect(processed).toBe(true);

    expect(
      dispatchBackgroundJobMock,
    ).toHaveBeenCalledOnce();

    expect(
      dispatchBackgroundJobMock,
    ).toHaveBeenCalledWith(job);

    expect(
      completeBackgroundJobMock,
    ).toHaveBeenCalledOnce();

    expect(
      completeBackgroundJobMock,
    ).toHaveBeenCalledWith(job.id);

    expect(
      failBackgroundJobMock,
    ).not.toHaveBeenCalled();

    expect(
      handleFailedBackgroundJobMock,
    ).not.toHaveBeenCalled();
  });

  it("registra il fallimento quando l'handler genera un errore", async () => {
    const job = createBackgroundJob();

    const handlerError = new Error(
      "Handler fallito.",
    );

    const failedJob = {
      ...job,
      status: "FAILED" as const,
      attempts: 1,
      lastError: handlerError.message,
    };

    claimNextBackgroundJobMock.mockResolvedValueOnce(
      job,
    );

    dispatchBackgroundJobMock.mockRejectedValueOnce(
      handlerError,
    );

    failBackgroundJobMock.mockResolvedValueOnce(
      failedJob,
    );

    const processed =
      await processNextBackgroundJob();

    expect(processed).toBe(true);

    expect(
      failBackgroundJobMock,
    ).toHaveBeenCalledWith({
      jobId: job.id,
      error: handlerError,
    });

    expect(
      handleFailedBackgroundJobMock,
    ).toHaveBeenCalledWith(failedJob);

    expect(
      completeBackgroundJobMock,
    ).not.toHaveBeenCalled();
  });

  it("gestisce il fallimento durante il completamento del job", async () => {
    const job = createBackgroundJob();

    const completionError = new Error(
      "Completamento job fallito.",
    );

    const failedJob = {
      ...job,
      status: "FAILED" as const,
      attempts: 1,
      lastError: completionError.message,
    };

    claimNextBackgroundJobMock.mockResolvedValueOnce(
      job,
    );

    completeBackgroundJobMock.mockRejectedValueOnce(
      completionError,
    );

    failBackgroundJobMock.mockResolvedValueOnce(
      failedJob,
    );

    const processed =
      await processNextBackgroundJob();

    expect(processed).toBe(true);

    expect(
      dispatchBackgroundJobMock,
    ).toHaveBeenCalledWith(job);

    expect(
      failBackgroundJobMock,
    ).toHaveBeenCalledWith({
      jobId: job.id,
      error: completionError,
    });

    expect(
      handleFailedBackgroundJobMock,
    ).toHaveBeenCalledWith(failedJob);
  });

  it("non interrompe il ciclo se l'hook di fallimento definitivo genera un errore", async () => {
    const job = createBackgroundJob();

    const handlerError = new Error(
      "Handler fallito.",
    );

    const hookError = new Error(
      "Hook fallimento fallito.",
    );

    const failedJob = {
      ...job,
      status: "FAILED" as const,
      attempts: 3,
      lastError: handlerError.message,
    };

    claimNextBackgroundJobMock.mockResolvedValueOnce(
      job,
    );

    dispatchBackgroundJobMock.mockRejectedValueOnce(
      handlerError,
    );

    failBackgroundJobMock.mockResolvedValueOnce(
      failedJob,
    );

    handleFailedBackgroundJobMock.mockRejectedValueOnce(
      hookError,
    );

    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const processed =
      await processNextBackgroundJob();

    expect(processed).toBe(true);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      `Errore durante la gestione del fallimento definitivo del job ${failedJob.id}:`,
      hookError,
    );

    consoleErrorSpy.mockRestore();
  });

  it("propaga gli errori durante il claim del job", async () => {
    const claimError = new Error(
      "Claim job fallito.",
    );

    claimNextBackgroundJobMock.mockRejectedValueOnce(
      claimError,
    );

    await expect(
      processNextBackgroundJob(),
    ).rejects.toBe(claimError);

    expect(
      dispatchBackgroundJobMock,
    ).not.toHaveBeenCalled();

    expect(
      completeBackgroundJobMock,
    ).not.toHaveBeenCalled();

    expect(
      failBackgroundJobMock,
    ).not.toHaveBeenCalled();
  });

  it("propaga gli errori di failBackgroundJob", async () => {
    const job = createBackgroundJob();

    const handlerError = new Error(
      "Handler fallito.",
    );

    const failError = new Error(
      "Persistenza fallimento fallita.",
    );

    claimNextBackgroundJobMock.mockResolvedValueOnce(
      job,
    );

    dispatchBackgroundJobMock.mockRejectedValueOnce(
      handlerError,
    );

    failBackgroundJobMock.mockRejectedValueOnce(
      failError,
    );

    await expect(
      processNextBackgroundJob(),
    ).rejects.toBe(failError);

    expect(
      handleFailedBackgroundJobMock,
    ).not.toHaveBeenCalled();
  });
});

function createBackgroundJob(): BackgroundJob {
  return {
    id: "background-job-1",
    type: "STORAGE_OBJECT_DELETE",
    status: "RUNNING",
    payload: {
      key: "properties/property-1/image.webp",
    },
    deduplicationKey: null,
    attempts: 0,
    maxAttempts: 3,
    availableAt: new Date(
      "2026-08-02T12:00:00.000Z",
    ),
    startedAt: new Date(
      "2026-08-02T12:00:00.000Z",
    ),
    heartbeatAt: null,
    finishedAt: null,
    lastError: null,
    createdAt: new Date(
      "2026-08-02T11:00:00.000Z",
    ),
    updatedAt: new Date(
      "2026-08-02T12:00:00.000Z",
    ),
  };
}