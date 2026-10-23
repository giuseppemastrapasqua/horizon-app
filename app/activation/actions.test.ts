import { beforeEach, describe, expect, it, vi } from "vitest";
import { initialConfig } from "@/lib/activation/config";
const mocks = vi.hoisted(() => ({ roles: vi.fn(), propertyRole: vi.fn(), find: vi.fn(), create: vi.fn(), update: vi.fn(), audit: vi.fn(), transaction: vi.fn(), revalidate: vi.fn() }));
vi.mock("@/lib/auth/guards", () => ({ requireRoles: mocks.roles, requirePropertyRole: mocks.propertyRole }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("@/lib/prisma", () => ({ prisma: { property: { findUnique: mocks.find }, $transaction: mocks.transaction } }));
import { saveActivation } from "./actions";
const config = () => initialConfig({ base: 100, baseGuests: 2, extraGuestFee: 10, cleaning: 50, management: 20, vat: 22, vatMode: "INCLUDED", minimumStay: 2, commissions: [] });
beforeEach(() => {
  vi.resetAllMocks(); mocks.roles.mockResolvedValue({ id: "admin", role: "SUPER_ADMIN" }); mocks.propertyRole.mockResolvedValue({ id: "admin" }); mocks.find.mockResolvedValue({ maxGuests: 4 }); mocks.update.mockResolvedValue({ count: 1 });
  mocks.transaction.mockImplementation((fn) => fn({ propertyActivation: { create: mocks.create, updateMany: mocks.update }, auditLog: { create: mocks.audit } }));
});
describe("activation writes", () => {
  it("checks role and property scope before any mutation", async () => {
    mocks.roles.mockRejectedValue(new Error("Forbidden"));
    await expect(saveActivation("p1", 0, config())).rejects.toThrow("Forbidden"); expect(mocks.transaction).not.toHaveBeenCalled();
    mocks.roles.mockResolvedValue({ id: "manager" }); mocks.propertyRole.mockRejectedValue(new Error("Wrong property"));
    await expect(saveActivation("p2", 0, config())).rejects.toThrow("Wrong property"); expect(mocks.find).not.toHaveBeenCalled();
  });
  it("rejects invalid inputs and occupancy before opening a transaction", async () => {
    expect((await saveActivation("p1", 0, { ...config(), baseGuests: 5 })).ok).toBe(false);
    expect((await saveActivation("p1", -1, config())).ok).toBe(false); expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it("saves a new configuration and an audit snapshot in one transaction", async () => {
    const result = await saveActivation("p1", 0, config()); expect(result).toMatchObject({ ok: true, version: 1 });
    expect(mocks.create).toHaveBeenCalledWith({ data: { propertyId: "p1", config: config() } });
    expect(mocks.audit).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ actorId: "admin", propertyId: "p1", metadata: { version: 1, config: config() } }) }));
  });
  it("rejects stale edits instead of overwriting a concurrent change", async () => {
    mocks.update.mockResolvedValue({ count: 0 });
    expect((await saveActivation("p1", 3, config())).ok).toBe(false); expect(mocks.audit).not.toHaveBeenCalled();
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ where: { propertyId: "p1", version: 3 } }));
  });
});
