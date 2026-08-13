import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { runBackgroundJobWorker } from "./run-background-job-worker";

describe("runBackgroundJobWorker", () => {
  it("termina subito quando lo shutdown è già richiesto", async () => {
    const processNextJob = vi.fn();
    const wait = vi.fn();

    await runBackgroundJobWorker({
      isShutdownRequested: () => true,
      processNextJob,
      wait,
    });

    expect(processNextJob).not.toHaveBeenCalled();
    expect(wait).not.toHaveBeenCalled();
  });

  it("processa continuamente finché non viene richiesto lo shutdown", async () => {
    let iterations = 0;

    const processNextJob = vi.fn(async () => {
      iterations += 1;
      return true;
    });

    await runBackgroundJobWorker({
      isShutdownRequested: () => iterations >= 3,
      processNextJob,
      wait: vi.fn(),
    });

    expect(processNextJob).toHaveBeenCalledTimes(3);
  });

  it("attende il delay idle quando non ci sono job", async () => {
    let shutdownRequested = false;

    const processNextJob = vi
      .fn()
      .mockResolvedValue(false);

    const wait = vi.fn(async () => {
      shutdownRequested = true;
    });

    await runBackgroundJobWorker({
      isShutdownRequested: () => shutdownRequested,
      idleDelayMs: 1_500,
      processNextJob,
      wait,
    });

    expect(processNextJob).toHaveBeenCalledOnce();
    expect(wait).toHaveBeenCalledWith(1_500);
  });

  it("non attende quando un job viene processato", async () => {
    let shutdownRequested = false;

    const processNextJob = vi.fn(async () => {
      shutdownRequested = true;
      return true;
    });

    const wait = vi.fn();

    await runBackgroundJobWorker({
      isShutdownRequested: () => shutdownRequested,
      processNextJob,
      wait,
    });

    expect(processNextJob).toHaveBeenCalledOnce();
    expect(wait).not.toHaveBeenCalled();
  });

  it("gestisce gli errori e attende il delay configurato", async () => {
    let shutdownRequested = false;

    const workerError = new Error(
      "Errore inatteso nel worker.",
    );

    const processNextJob = vi
      .fn()
      .mockRejectedValue(workerError);

    const onError = vi.fn();

    const wait = vi.fn(async () => {
      shutdownRequested = true;
    });

    await runBackgroundJobWorker({
      isShutdownRequested: () => shutdownRequested,
      errorDelayMs: 7_500,
      processNextJob,
      wait,
      onError,
    });

    expect(onError).toHaveBeenCalledWith(workerError);
    expect(wait).toHaveBeenCalledWith(7_500);
  });

  it("continua dopo un errore se lo shutdown non è richiesto", async () => {
    let attempts = 0;
    let shutdownRequested = false;

    const processNextJob = vi.fn(async () => {
      attempts += 1;

      if (attempts === 1) {
        throw new Error(
          "Primo tentativo fallito.",
        );
      }

      shutdownRequested = true;
      return true;
    });

    const wait = vi
      .fn()
      .mockResolvedValue(undefined);

    await runBackgroundJobWorker({
      isShutdownRequested: () => shutdownRequested,
      processNextJob,
      wait,
      onError: vi.fn(),
    });

    expect(processNextJob).toHaveBeenCalledTimes(2);
    expect(wait).toHaveBeenCalledOnce();
  });

  it("rifiuta un idleDelayMs negativo", async () => {
    await expect(
      runBackgroundJobWorker({
        isShutdownRequested: () => true,
        idleDelayMs: -1,
      }),
    ).rejects.toThrow(
      "idleDelayMs deve essere un numero maggiore o uguale a zero.",
    );
  });

  it("rifiuta un errorDelayMs non finito", async () => {
    await expect(
      runBackgroundJobWorker({
        isShutdownRequested: () => true,
        errorDelayMs:
          Number.POSITIVE_INFINITY,
      }),
    ).rejects.toThrow(
      "errorDelayMs deve essere un numero maggiore o uguale a zero.",
    );
  });
});