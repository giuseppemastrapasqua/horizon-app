import { PropertyAccessRole, UserRole } from "@prisma/client";

import { AppShell } from "@/components/AppShell";
import { CollaboratorsManager } from "@/components/collaborators/CollaboratorsManager";
import { Navigation } from "@/components/Navigation";
import { requireRoles } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function CollaboratorsPage() {
  await requireRoles(["SUPER_ADMIN"]);

  const now = new Date();

  const [properties, collaborators, invites] = await Promise.all([
    prisma.property.findMany({
      select: {
        id: true,
        name: true,
        city: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
    prisma.user.findMany({
      where: {
        role: UserRole.OPERATOR,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        status: true,
        propertyAccesses: {
          where: {
            role: PropertyAccessRole.OPERATOR,
            active: true,
          },
          select: {
            id: true,
            propertyId: true,
            property: {
              select: {
                id: true,
                name: true,
                city: true,
              },
            },
          },
          orderBy: {
            property: {
              name: "asc",
            },
          },
        },
      },
      orderBy: {
        fullName: "asc",
      },
    }),
    prisma.propertyOperatorInvite.findMany({
      select: {
        id: true,
        propertyId: true,
        fullName: true,
        email: true,
        phone: true,
        expiresAt: true,
        acceptedAt: true,
        revokedAt: true,
        createdAt: true,
        property: {
          select: {
            id: true,
            name: true,
            city: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  const serializedCollaborators = collaborators.map(
    (collaborator) => ({
      ...collaborator,
      status: String(collaborator.status),
    }),
  );

  const serializedInvites = invites.map((invite) => ({
    ...invite,
    expiresAt: invite.expiresAt.toISOString(),
    acceptedAt: invite.acceptedAt?.toISOString() ?? null,
    revokedAt: invite.revokedAt?.toISOString() ?? null,
    createdAt: invite.createdAt.toISOString(),
    status: (
      invite.revokedAt
        ? "REVOKED"
        : invite.acceptedAt
          ? "ACCEPTED"
          : invite.expiresAt <= now
            ? "EXPIRED"
            : "PENDING"
    ) as "PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED",
  }));

  return (
    <>
      <Navigation />

      <AppShell
        title="Collaboratori"
        subtitle="Gestisci i collaboratori operativi e le strutture a cui possono accedere."
      >
        <CollaboratorsManager
          properties={properties}
          collaborators={serializedCollaborators}
          invites={serializedInvites}
        />
      </AppShell>
    </>
  );
}