import { describe, expect, it, vi } from "vitest";
vi.mock("./enqueue-booking-ical-sync-jobs", () => ({ enqueueBookingIcalSyncJobs: vi.fn() }));
import { createPeriodicIcalScheduler } from "./create-periodic-ical-scheduler";

describe("periodic iCal scheduler", () => {
  it("accoda subito e poi ogni quindici minuti", async () => {
    let clock = 0;
    const enqueue = vi.fn().mockResolvedValue(12);
    const poll = createPeriodicIcalScheduler({ enqueue, now: () => clock });
    await poll();
    clock = 899_999;
    await poll();
    expect(enqueue).toHaveBeenCalledTimes(1);
    clock = 900_000;
    await poll();
    expect(enqueue).toHaveBeenCalledTimes(2);
  });
  it("non accoda due volte durante un accodamento in corso", async () => {
    let finish!: (count: number) => void;
    const enqueue = vi.fn(() => new Promise<number>(resolve => { finish = resolve; }));
    const poll = createPeriodicIcalScheduler({ enqueue, now: () => 0 });
    const first = poll();
    await poll();
    expect(enqueue).toHaveBeenCalledOnce();
    finish(2);
    await first;
  });
  it("non blocca la coda dopo un errore e riprova dopo il ritardo", async () => {
    let clock = 0;
    const error = new Error("database unavailable");
    const enqueue = vi.fn().mockRejectedValueOnce(error).mockResolvedValue(2);
    const onError = vi.fn();
    const poll = createPeriodicIcalScheduler({ enqueue, now: () => clock, onError });
    await expect(poll()).resolves.toBeUndefined();
    expect(onError).toHaveBeenCalledWith(error);
    clock = 4_999;
    await poll();
    expect(enqueue).toHaveBeenCalledOnce();
    clock = 5_000;
    await poll();
    expect(enqueue).toHaveBeenCalledTimes(2);
  });
  it.each([0, -1, Infinity, NaN])("rifiuta intervalli non validi: %s", intervalMs => {
    expect(() => createPeriodicIcalScheduler({ intervalMs })).toThrow();
    expect(() => createPeriodicIcalScheduler({ retryDelayMs: intervalMs })).toThrow();
  });
});
