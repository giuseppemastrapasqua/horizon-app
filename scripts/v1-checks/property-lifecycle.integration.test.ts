import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { assertIsolatedDatabase } from "./seed";
import { prisma } from "@/lib/prisma";
const actorId = "v1-lifecycle-admin";
vi.mock("@/lib/auth/guards", () => ({ requireRoles: vi.fn(async () => ({ id: "v1-lifecycle-admin", role: "SUPER_ADMIN" })), requirePropertyRole: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn(() => { throw new Error("NEXT_REDIRECT"); }) }));
import { deletePropertyWithFeedbackAction } from "@/app/properties/[id]/edit/property-lifecycle-actions";
let isolated = false;
const ids = ["v1-lifecycle-protected", "v1-lifecycle-empty"];
describe.skipIf(process.env.HORIZON_V1_ISOLATED_TEST !== "true")("property deletion on isolated PostgreSQL", () => {
  beforeAll(async () => {
    assertIsolatedDatabase();
    const [db] = await prisma.$queryRaw<Array<{ name: string }>>`SELECT current_database() AS name`;
    expect(db.name).toBe("horizon_v1_test"); isolated = true;
    await prisma.user.create({ data: { id: actorId, fullName: "Synthetic lifecycle fixture", email: "lifecycle@example.com", role: "SUPER_ADMIN" } });
    await prisma.property.createMany({ data: ids.map((id) => ({ id, ownerId: actorId, name: id, address: "Synthetic address", maxGuests: 2, status: "ARCHIVED" as const })) });
    await prisma.financeReport.create({ data: { propertyId: ids[0], ownerId: actorId, title: "Synthetic protected report", referenceMonth: new Date("2026-10-01Z"), grossRevenue: 100, finalAmount: 70, formulaName: "Synthetic", formulaSnapshot: {} } });
    await prisma.document.create({ data: { propertyId: ids[0], ownerId: actorId, type: "MONTHLY_REPORT", title: "Synthetic protected document", documentKey: "v1-lifecycle-document", content: {} } });
  });
  afterAll(async () => {
    if (!isolated) return;
    await prisma.auditLog.deleteMany({ where: { actorId } });
    await prisma.document.deleteMany({ where: { propertyId: { in: ids } } });
    await prisma.financeReport.deleteMany({ where: { propertyId: { in: ids } } });
    await prisma.property.deleteMany({ where: { id: { in: ids } } });
    await prisma.user.deleteMany({ where: { id: actorId } });
    await prisma.$disconnect();
  });
  const form = (id: string) => { const value = new FormData(); value.set("propertyId", id); value.set("confirmation", id); return value; };
  it("preserves the property, report and document and returns a readable message", async () => {
    const result = await deletePropertyWithFeedbackAction({ message: "" }, form(ids[0]));
    expect(result.message).toContain("Rendiconti proprietari: 1");
    expect(result.message).toContain("Documenti: 1");
    expect(await prisma.property.count({ where: { id: ids[0] } })).toBe(1);
    expect(await prisma.financeReport.count({ where: { propertyId: ids[0] } })).toBe(1);
    expect(await prisma.document.count({ where: { propertyId: ids[0] } })).toBe(1);
  });
  it("deletes an empty archived property atomically and retains an audit entry", async () => {
    await expect(deletePropertyWithFeedbackAction({ message: "" }, form(ids[1]))).rejects.toThrow("NEXT_REDIRECT");
    expect(await prisma.property.count({ where: { id: ids[1] } })).toBe(0);
    expect(await prisma.auditLog.count({ where: { actorId, entityId: ids[1], action: "DELETE" } })).toBe(1);
  });
});
