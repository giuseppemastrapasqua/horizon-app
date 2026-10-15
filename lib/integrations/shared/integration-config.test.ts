import { afterEach, expect, it, vi } from "vitest";

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });

it("never enables simulated Booking reservations in production, even when explicitly requested", async () => {
  vi.resetModules();
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("BOOKING_COM_USE_MOCK", "true");
  const { integrationConfig } = await import("./integration-config");
  expect(integrationConfig.bookingCom.useMock).toBe(false);
});

it("keeps development fixtures available outside production", async () => {
  vi.resetModules();
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("BOOKING_COM_USE_MOCK", "true");
  const { integrationConfig } = await import("./integration-config");
  expect(integrationConfig.bookingCom.useMock).toBe(true);
});

it("allows development to exercise the real-client failure path", async () => {
  vi.resetModules();
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("BOOKING_COM_USE_MOCK", "false");
  const { integrationConfig } = await import("./integration-config");
  expect(integrationConfig.bookingCom.useMock).toBe(false);
});
