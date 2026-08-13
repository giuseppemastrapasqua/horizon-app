import { processNextBackgroundJob } from "@/lib/job/process-next-background-job";

const DEFAULT_IDLE_DELAY_MS = 1_000;
const DEFAULT_ERROR_DELAY_MS = 5_000;

type RunBackgroundJobWorkerInput = {
  isShutdownRequested: () => boolean;
  idleDelayMs?: number;
  errorDelayMs?: number;
  processNextJob?: () => Promise<boolean>;
  wait?: (milliseconds: number) => Promise<void>;
  onError?: (error: unknown) => void;
};

export async function runBackgroundJobWorker({
  isShutdownRequested,
  idleDelayMs = DEFAULT_IDLE_DELAY_MS,
  errorDelayMs = DEFAULT_ERROR_DELAY_MS,
  processNextJob = processNextBackgroundJob,
  wait = waitForDelay,
  onError = () => undefined,
}: RunBackgroundJobWorkerInput): Promise<void> {
  validateDelay(idleDelayMs, "idleDelayMs");
  validateDelay(errorDelayMs, "errorDelayMs");

  while (!isShutdownRequested()) {
    try {
      const processed = await processNextJob();

      if (!processed) {
        await wait(idleDelayMs);
      }
    } catch (error) {
      onError(error);
      await wait(errorDelayMs);
    }
  }
}

function waitForDelay(
  milliseconds: number,
): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function validateDelay(
  value: number,
  name: string,
): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(
      `${name} deve essere un numero maggiore o uguale a zero.`,
    );
  }
}