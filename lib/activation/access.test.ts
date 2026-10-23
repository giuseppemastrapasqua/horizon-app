import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ roles: vi.fn(), scope: vi.fn(), find: vi.fn() }));
vi.mock("@/lib/auth/guards", () => ({ requireRoles: mocks.roles, requirePropertyRole: mocks.scope }));
vi.mock("@/lib/prisma", () => ({ prisma: { property: { findUnique: mocks.find } } }));
import { loadActivationWorkspace } from "./load-workspace";
beforeEach(() => vi.resetAllMocks());
it("denies non-management reads before querying the property or its configuration", async () => {
  mocks.roles.mockRejectedValue(new Error("Forbidden"));
  await expect(loadActivationWorkspace("p1", "2026-10-23", "2026-12-23")).rejects.toThrow("Forbidden");
  expect(mocks.find).not.toHaveBeenCalled();
});
it("requires manager access to the selected property even for a global manager", async () => {
  mocks.roles.mockResolvedValue({ id: "manager", role: "MANAGER" });
  mocks.scope.mockRejectedValue(new Error("Wrong property"));
  await expect(loadActivationWorkspace("other-property", "2026-10-23", "2026-12-23")).rejects.toThrow("Wrong property");
  expect(mocks.scope).toHaveBeenCalledWith("other-property", ["MANAGER"]);
  expect(mocks.find).not.toHaveBeenCalled();
});
