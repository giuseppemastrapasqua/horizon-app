import { getAccessiblePropertyIds, requireRoles } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export async function getAuthorizedDocument(id: string) {
  await requireRoles(["SUPER_ADMIN", "MANAGER", "FINANCE_ADMIN"]);
  const ids = await getAccessiblePropertyIds();
  return prisma.document.findFirst({
    where: { id, ...(ids !== null ? { propertyId: { in: ids } } : {}) },
    select: {
      id: true,
      title: true,
      subtitle: true,
      type: true,
      status: true,
      documentNumber: true,
      referenceMonth: true,
      currentVersion: true,
      createdAt: true,
      updatedAt: true,
      propertyId: true,
      property: { select: { name: true } },
      versions: {
        orderBy: { version: "desc" },
        select: { id: true, version: true, note: true, createdAt: true },
      },
    },
  });
}
