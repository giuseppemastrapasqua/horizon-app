import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { assertIsolatedDatabase } from "./seed";
import { prisma } from "@/lib/prisma";
import { initialConfig } from "@/lib/activation/config";

const identity = vi.hoisted(() => ({ id: "v1-activation-admin", role: "SUPER_ADMIN" }));
vi.mock("@/lib/auth/guards", () => ({ requireRoles: vi.fn(async () => identity), requirePropertyRole: vi.fn(async () => identity) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import { saveActivation } from "@/app/activation/actions";

const id = "v1-activation-property";
let isolated = false;
describe.skipIf(process.env.HORIZON_V1_ISOLATED_TEST !== "true")("activation persistence on isolated PostgreSQL", () => {
  beforeAll(async () => {
    assertIsolatedDatabase();
    const [db] = await prisma.$queryRaw<Array<{ name: string }>>`SELECT current_database() AS name`;
    expect(db.name).toBe("horizon_v1_test");
    isolated = true;
    await prisma.user.create({ data: { id: identity.id, fullName: "Activation fixture", email: "activation-fixture@example.com", role: "SUPER_ADMIN" } });
    await prisma.property.create({ data: { id, name: "Activation fixture", address: "Synthetic address", maxGuests: 4, ownerId: identity.id } });
  });
  afterAll(async () => {
    if (!isolated) return;
    await prisma.auditLog.deleteMany({ where: { propertyId: id } });
    await prisma.property.deleteMany({ where: { id } });
    await prisma.user.deleteMany({ where: { id: identity.id } });
    await prisma.$disconnect();
  });
  it("round-trips the launch config, rejects stale writes and keeps audit snapshots", async () => {
    const config = initialConfig({ base: 120, baseGuests: 2, extraGuestFee: 20, cleaning: 50, management: 20, vat: 22, vatMode: "INCLUDED", minimumStay: 2, commissions: [] });
    expect((await saveActivation(id, 0, config)).ok).toBe(true);
    expect((await prisma.propertyActivation.findUniqueOrThrow({ where: { propertyId: id } })).config).toEqual(config);
    config.launchStart = "2026-10-23"; config.launchEnd = "2026-11-21"; config.launchDiscount = 10; config.exitCriteria = "Rivedere il netto al giorno 7";
    expect((await saveActivation(id, 1, config)).version).toBe(2);
    expect((await saveActivation(id, 1, { ...config, base: 999 })).ok).toBe(false);
    expect((await prisma.propertyActivation.findUniqueOrThrow({ where: { propertyId: id } })).version).toBe(2);
    expect(await prisma.auditLog.count({ where: { propertyId: id } })).toBe(2);
  });
});
