import { PrismaClient, type UserRole } from "@prisma/client";
import { hash } from "bcryptjs";

export const password = "Horizon-Isolated-Test-Only-2026!";
export const propertyA = "v1-property-alpha";
export const propertyB = "v1-property-beta";
export const users: Record<string, UserRole> = {
  ownerA: "OWNER",
  ownerB: "OWNER",
  manager: "MANAGER",
  finance: "FINANCE_ADMIN",
  operator: "OPERATOR",
  admin: "SUPER_ADMIN",
};

export function assertIsolatedDatabase() {
  const url = new URL(process.env.DATABASE_URL ?? "");
  if (
    process.env.HORIZON_V1_ISOLATED_TEST !== "true" ||
    !["127.0.0.1", "localhost"].includes(url.hostname) ||
    url.pathname !== "/horizon_v1_test" ||
    url.username !== "horizon_test"
  ) {
    throw new Error(
      "Smoke tests require the dedicated local horizon_v1_test database.",
    );
  }
  if (
    [
      process.env.HORIZON_ROSS1000_SEND_ENABLED,
      process.env.HORIZON_ROSS1000_EVENT_PREPARATION_ENABLED,
    ].includes("true")
  ) {
    throw new Error(
      "External ROSS1000 operations must be disabled in isolated tests.",
    );
  }
}

export async function seedIsolatedData(prisma: PrismaClient) {
  assertIsolatedDatabase();
  const rows = await prisma.$queryRaw<
    Array<{ name: string }>
  >`SELECT current_database() AS name`;
  if (rows[0]?.name !== "horizon_v1_test")
    throw new Error("Unexpected database.");
  const passwordHash = await hash(password, 10);
  for (const [name, role] of Object.entries(users)) {
    await prisma.user.create({
      data: {
        id: `v1-user-${name}`,
        fullName: `V1 ${name}`,
        email: `${name.toLowerCase()}@example.com`,
        passwordHash,
        role,
      },
    });
  }
  for (const [id, owner, label] of [
    [propertyA, "ownerA", "ALPHA"],
    [propertyB, "ownerB", "BETA"],
  ]) {
    await prisma.property.create({
      data: {
        id,
        ownerId: `v1-user-${owner}`,
        name: `V1_PROPERTY_${label}_CANARY`,
        address: "Isolated fixture address",
        maxGuests: 4,
        status: "ACTIVE",
      },
    });
    await prisma.booking.create({
      data: {
        id: `v1-booking-${label.toLowerCase()}`,
        propertyId: id,
        ownerId: `v1-user-${owner}`,
        channel: "DIRECT",
        guestName: `PRIVATE_GUEST_${label}`,
        guestEmail: `private.${label.toLowerCase()}@example.com`,
        internalNotes: `PRIVATE_BOOKING_NOTE_${label}`,
        checkIn: new Date("2026-10-05T00:00:00Z"),
        checkOut: new Date("2026-10-09T00:00:00Z"),
        nights: 4,
        guests: 2,
        grossAmount: 1000,
      },
    });
    for (const type of ["MAINTENANCE", "CLEANING"] as const) {
      await prisma.task.create({
        data: {
          id: `v1-task-${label.toLowerCase()}-${type.toLowerCase()}`,
          propertyId: id,
          type,
          title: `V1_${type}_${label}`,
          description: `PRIVATE_TASK_DESCRIPTION_${label}`,
        },
      });
    }
    await prisma.financeReport.create({
      data: {
        id: `v1-report-${label.toLowerCase()}`,
        propertyId: id,
        ownerId: `v1-user-${owner}`,
        referenceMonth: new Date("2026-10-01T00:00:00Z"),
        title: `V1_REPORT_${label}`,
        grossRevenue: 1000,
        finalAmount: 700,
        formulaName: "V1 legacy fixture",
        formulaSnapshot: {},
      },
    });
    await prisma.financeFormula.create({
      data: {
        id: `v1-formula-${label.toLowerCase()}`,
        propertyId: id,
        name: `V1_FORMULA_${label}`,
      },
    });
    await prisma.document.create({
      data: {
        id: `v1-draft-${label.toLowerCase()}`,
        propertyId: id,
        ownerId: `v1-user-${owner}`,
        documentKey: `v1-draft-${label}`,
        title: `V1_DRAFT_${label}`,
        type: "COMMISSION_INVOICE",
        content: {},
      },
    });
  }
  await prisma.propertyAccess.createMany({
    data: [
      { propertyId: propertyA, userId: "v1-user-manager", role: "MANAGER" },
      { propertyId: propertyA, userId: "v1-user-finance", role: "FINANCE" },
      { propertyId: propertyA, userId: "v1-user-operator", role: "OPERATOR" },
    ],
  });
}
