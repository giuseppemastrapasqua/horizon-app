import type { BackgroundJob } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  send: vi.fn(),
  booking: vi.fn(),
  connection: vi.fn(),
  resolver: vi.fn(),
  prepare: vi.fn(),
  credentials: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    booking: { findUnique: mocks.booking },
    ross1000Property: { findUnique: mocks.connection },
  },
}));
vi.mock("@/lib/integrations/ross1000/prisma-transmission-store", () => ({
  prismaRoss1000TransmissionStore: { getById: mocks.get },
}));
vi.mock("@/lib/integrations/ross1000/transmission-send-orchestrator", () => ({
  sendRoss1000Transmission: mocks.send,
}));
vi.mock("@/lib/integrations/ross1000/runtime-credential-provider", () => ({
  createRuntimeRoss1000CredentialProvider: mocks.credentials,
}));
vi.mock("@/lib/integrations/ross1000/prepare-transmission", () => ({
  prepareRoss1000Transmission: mocks.prepare,
}));
vi.mock("@/lib/integrations/ross1000/soap-transport", () => ({
  Ross1000SoapTransport: class {},
}));
vi.mock("@/lib/integrations/alloggiati-web/public-reference-provider", () => ({
  PublicAlloggiatiReferenceProvider: class {
    getResolver = mocks.resolver;
  },
}));
import { processRoss1000SubmissionJob } from "./process-ross1000-submission-job";
function job(payload: BackgroundJob["payload"]) {
  return {
    type: "ROSS1000_SUBMISSION",
    payload,
    createdAt: new Date("2026-10-11T12:00:00Z"),
  } as BackgroundJob;
}

describe("ROSS1000 background job", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });
  it("blocks sends when the runtime gate is closed", async () => {
    vi.stubEnv("HORIZON_ROSS1000_SEND_ENABLED", "false");
    await expect(
      processRoss1000SubmissionJob(
        job({ transmissionId: "tx-1", propertyId: "own" }),
      ),
    ).rejects.toThrow("non abilitato");
    expect(mocks.get).not.toHaveBeenCalled();
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it("does not resend a confirmed duplicate", async () => {
    vi.stubEnv("HORIZON_ROSS1000_SEND_ENABLED", "true");
    mocks.get.mockResolvedValue({
      id: "tx-1",
      propertyId: "own",
      status: "CONFIRMED",
    });
    await processRoss1000SubmissionJob(
      job({ transmissionId: "tx-1", propertyId: "own" }),
    );
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it("rejects a transmission associated with another property", async () => {
    vi.stubEnv("HORIZON_ROSS1000_SEND_ENABLED", "true");
    mocks.get.mockResolvedValue({
      id: "tx-1",
      propertyId: "foreign",
      status: "PREPARED",
    });
    await expect(
      processRoss1000SubmissionJob(
        job({ transmissionId: "tx-1", propertyId: "own" }),
      ),
    ).rejects.toThrow("non associata");
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it.each(["SENDING", "OUTCOME_UNKNOWN", "REJECTED"])(
    "never retries a %s transmission as a new send",
    async (status) => {
      vi.stubEnv("HORIZON_ROSS1000_SEND_ENABLED", "true");
      mocks.get.mockResolvedValue({ id: "tx-1", propertyId: "own", status });
      await expect(
        processRoss1000SubmissionJob(
          job({ transmissionId: "tx-1", propertyId: "own" }),
        ),
      ).rejects.toThrow("esito da verificare");
      expect(mocks.send).not.toHaveBeenCalled();
      expect(mocks.credentials).not.toHaveBeenCalled();
    },
  );
  it("routes an authorized prepared send through the guarded orchestrator", async () => {
    vi.stubEnv("HORIZON_ROSS1000_SEND_ENABLED", "true");
    mocks.get.mockResolvedValue({
      id: "tx-1",
      propertyId: "own",
      status: "PREPARED",
    });
    await processRoss1000SubmissionJob(
      job({ transmissionId: "tx-1", propertyId: "own" }),
    );
    expect(mocks.send).toHaveBeenCalledOnce();
    expect(mocks.send.mock.calls[0][0]).toBe("tx-1");
  });
  it("skips legacy event jobs for properties without ROSS1000", async () => {
    mocks.booking.mockResolvedValue({
      propertyId: "own",
      checkIn: new Date("2026-10-10"),
      checkOut: new Date("2026-10-12"),
    });
    mocks.connection.mockResolvedValue(null);
    await processRoss1000SubmissionJob(
      job({ bookingId: "booking-1", propertyId: "own" }),
    );
    expect(mocks.resolver).not.toHaveBeenCalled();
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it("prepares current movements from an event without sending them", async () => {
    mocks.booking.mockResolvedValue({
      propertyId: "own",
      checkIn: new Date("2026-10-10"),
      checkOut: new Date("2026-10-12"),
    });
    mocks.connection.mockResolvedValue({ id: "connection" });
    mocks.resolver.mockResolvedValue({});
    await processRoss1000SubmissionJob(
      job({ bookingId: "booking-1", propertyId: "own" }),
    );
    expect(mocks.prepare).toHaveBeenCalledWith(
      "own",
      new Date("2026-10-11T00:00:00Z"),
      {},
    );
    expect(mocks.send).not.toHaveBeenCalled();
  });
});
