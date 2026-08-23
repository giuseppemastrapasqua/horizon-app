import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function requireUser() {
  const session = await auth();

  if (!session?.user?.id) redirect("/login");

  return session.user;
}

export async function requirePropertyAccess(propertyId: string) {
  const user = await requireUser();

  if (["SUPER_ADMIN", "MANAGER", "FINANCE_ADMIN"].includes(user.role)) {
    return user;
  }

  const property = await prisma.property.findFirst({
    where: {
      id: propertyId,
      OR: [
        { ownerId: user.id },
        {
          taskAssignments: {
            some: {
              userId: user.id,
              active: true,
            },
          },
        },
      ],
    },
    select: { id: true },
  });

  if (!property) throw new Error("Accesso alla struttura non autorizzato.");

  return user;
}

export async function getAccessiblePropertyIds() {
  const user = await requireUser();

  if (["SUPER_ADMIN", "MANAGER", "FINANCE_ADMIN"].includes(user.role)) {
    return null;
  }

  const properties = await prisma.property.findMany({
    where: {
      OR: [
        { ownerId: user.id },
        {
          taskAssignments: {
            some: {
              userId: user.id,
              active: true,
            },
          },
        },
      ],
    },
    select: { id: true },
  });

  return properties.map((property) => property.id);
}
export async function requireRoles(roles: string[]) {
  const user = await requireUser();

  if (!roles.includes(user.role)) {
    throw new Error("Operazione non autorizzata.");
  }

  return user;
}