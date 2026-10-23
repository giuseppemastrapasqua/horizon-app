import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { assertIsolatedDatabase } from "./seed";
import { prisma } from "@/lib/prisma";
import { initialAccounting } from "@/lib/business-accounting/config";
const identity = vi.hoisted(() => ({ id: "v1-accounting-admin", role: "SUPER_ADMIN" }));
vi.mock("@/lib/auth/guards", () => ({ requireRoles: vi.fn(async () => identity) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import { saveAccounting } from "@/app/business-accounting/actions";

let isolated = false;
describe.skipIf(process.env.HORIZON_V1_ISOLATED_TEST !== "true")("private accounting on isolated PostgreSQL", () => {
  beforeAll(async () => {
    assertIsolatedDatabase();
    const [db] = await prisma.$queryRaw<Array<{ name: string }>>`SELECT current_database() AS name`;
    expect(db.name).toBe("horizon_v1_test"); isolated = true;
    await prisma.user.createMany({ data: ["v1-accounting-admin", "v1-accounting-other"].map((id) => ({ id, fullName: "Synthetic accounting fixture", email: `${id}@example.com`, role: "SUPER_ADMIN" as const })) });
  });
  afterAll(async () => {
    if (!isolated) return;
    await prisma.auditLog.deleteMany({ where: { actorId: { in: ["v1-accounting-admin", "v1-accounting-other"] } } });
    await prisma.user.deleteMany({ where: { id: { in: ["v1-accounting-admin", "v1-accounting-other"] } } });
    await prisma.$disconnect();
  });
  it("persists fiscal config, isolates users and years and prevents stale writes", async () => {
    const config = { ...initialAccounting, fiscalConfirmed: true, contributionEstimate: 200_00 };
    expect((await saveAccounting(2026, 0, config)).ok).toBe(true);
    const lookup = () => prisma.businessAccounting.findUniqueOrThrow({ where: { userId_year: { userId: "v1-accounting-admin", year: 2026 } } });
    expect((await lookup()).config).toEqual(config);
    expect((await saveAccounting(2026, 1, { ...config, contributionEstimate: 300_00 })).version).toBe(2);
    expect((await saveAccounting(2026, 1, config)).ok).toBe(false);
    expect((await lookup()).version).toBe(2);
    expect((await saveAccounting(2027, 0, initialAccounting)).ok).toBe(true);
    identity.id = "v1-accounting-other";
    expect((await saveAccounting(2026, 2, config)).ok).toBe(false);
    expect((await saveAccounting(2026, 0, initialAccounting)).ok).toBe(true);
    expect((await lookup()).version).toBe(2);
    expect(await prisma.auditLog.count({ where: { actorId: "v1-accounting-admin", entityType: "BusinessAccounting" } })).toBe(3);
  });
});
