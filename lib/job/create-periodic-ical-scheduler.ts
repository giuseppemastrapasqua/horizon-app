import { enqueueBookingIcalSyncJobs } from "./enqueue-booking-ical-sync-jobs";

export function createPeriodicIcalScheduler({
  intervalMs = 15 * 60_000,
  retryDelayMs = 5_000,
  enqueue = enqueueBookingIcalSyncJobs,
  now = Date.now,
  onError = () => undefined,
}: {
  intervalMs?: number;
  retryDelayMs?: number;
  enqueue?: () => Promise<number>;
  now?: () => number;
  onError?: (error: unknown) => void;
} = {}): () => Promise<void> {
  for (const [name, value] of Object.entries({ intervalMs, retryDelayMs })) {
    if (!Number.isFinite(value) || value <= 0) {
      throw new Error(`${name} deve essere positivo e finito.`);
    }
  }
  let nextRunAt = 0;
  let running = false;
  return async () => {
    if (running || now() < nextRunAt) return;
    running = true;
    try {
      await enqueue();
      nextRunAt = now() + intervalMs;
    } catch (error) {
      nextRunAt = now() + retryDelayMs;
      onError(error);
    } finally {
      running = false;
    }
  };
}
