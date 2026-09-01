import type { PropertyAccessRole } from "@prisma/client";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function requireUser() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return session.user;
}

export async function requirePropertyAccess(propertyId: string) {
  const user = await requireUser();

  if (user.role === "SUPER_ADMIN") {
    return user;
  }

  const property = await prisma.property.findFirst({
    where: {
      id: propertyId,
      OR: [
        { ownerId: user.id },
        {
          accesses: {
            some: {
              userId: user.id,
              active: true,
            },
          },
        },
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

  if (!property) {
    throw new Error("Accesso alla struttura non autorizzato.");
  }

  return user;
}

export async function requirePropertyRole(
  propertyId: string,
  roles: PropertyAccessRole[],
) {
  const user = await requireUser();

  if (user.role === "SUPER_ADMIN") {
    return user;
  }

  const property = await prisma.property.findFirst({
    where: {
      id: propertyId,
      OR: [
        { ownerId: user.id },
        {
          accesses: {
            some: {
              userId: user.id,
              active: true,
              role: {
                in: roles,
              },
            },
          },
        },
      ],
    },
    select: { id: true },
  });

  if (!property) {
    throw new Error(
      "Permessi insufficienti per modificare la struttura.",
    );
  }

  return user;
}

export async function getAccessiblePropertyIds() {
  const user = await requireUser();

  if (user.role === "SUPER_ADMIN") {
    return null;
  }

  const properties = await prisma.property.findMany({
    where: {
      OR: [
        { ownerId: user.id },
        {
          accesses: {
            some: {
              userId: user.id,
              active: true,
            },
          },
        },
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