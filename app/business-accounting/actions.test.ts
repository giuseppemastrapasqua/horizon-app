import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ requireRoles: vi.fn(), transaction: vi.fn(), create: vi.fn(), updateMany: vi.fn(), findUniqueOrThrow: vi.fn(), audit: vi.fn(), revalidate: vi.fn() }));
vi.mock("@/lib/auth/guards", () => ({ requireRoles: mocks.requireRoles }));
vi.mock("@/lib/prisma", () => ({ prisma: { $transaction: mocks.transaction } }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
import { saveAccounting } from "./actions";
import { initialAccounting } from "@/lib/business-accounting/config";
import { navigationForRole } from "@/lib/auth/navigation-policy";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.requireRoles.mockResolvedValue({ id: "admin" });
  mocks.create.mockResolvedValue({ id: "ledger" });
  mocks.findUniqueOrThrow.mockResolvedValue({ id: "ledger" });
  mocks.updateMany.mockResolvedValue({ count: 1 });
  mocks.transaction.mockImplementation((fn) => fn({ businessAccounting: { create: mocks.create, updateMany: mocks.updateMany, findUniqueOrThrow: mocks.findUniqueOrThrow }, auditLog: { create: mocks.audit } }));
});
it("requires admin before accessing private data", async () => {
  mocks.requireRoles.mockRejectedValue(new Error("Forbidden"));
  await expect(saveAccounting(2026, 0, initialAccounting)).rejects.toThrow("Forbidden");
  expect(mocks.requireRoles).toHaveBeenCalledWith(["SUPER_ADMIN"]);
  expect(mocks.transaction).not.toHaveBeenCalled();
});
it("creates the ledger for the authenticated user and records the audit atomically", async () => {
  expect((await saveAccounting(2026, 0, initialAccounting)).ok).toBe(true);
  expect(mocks.create).toHaveBeenCalledWith({ data: { userId: "admin", year: 2026, config: initialAccounting } });
  expect(mocks.audit).toHaveBeenCalledTimes(1);
});
it("uses user, year and expected version in all updates", async () => {
  const saved = await saveAccounting(2026, 2, initialAccounting);
  expect(saved.version).toBe(3);
  expect(mocks.updateMany.mock.calls[0][0].where).toEqual({ userId: "admin", year: 2026, version: 2 });
});
it("rejects a version conflict without writing an audit", async () => {
  mocks.updateMany.mockResolvedValue({ count: 0 });
  expect((await saveAccounting(2026, 2, initialAccounting)).ok).toBe(false);
  expect(mocks.audit).not.toHaveBeenCalled();
});
it("rejects malformed input before any transaction", async () => {
  expect((await saveAccounting(2026, 0, { ...initialAccounting, taxRate: 0 })).ok).toBe(false);
  expect((await saveAccounting(2010, 0, initialAccounting)).ok).toBe(false);
  expect(mocks.transaction).not.toHaveBeenCalled();
});
it("keeps private accounting out of every other role menu", () => {
  const items = [{ href: "/business-accounting", operatorVisible: true }];
  for (const role of ["MANAGER", "OWNER", "OPERATOR", "FINANCE_ADMIN", "SYSTEM_AI"]) expect(navigationForRole(items, role)).toEqual([]);
  expect(navigationForRole(items, "SUPER_ADMIN")).toEqual(items);
});
