import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Accesso non autorizzato." },
      { status: 401 },
    );
  }

  try {
    const globalAccess = [
      "SUPER_ADMIN",
      "MANAGER",
      "FINANCE_ADMIN",
    ].includes(session.user.role);

    const properties =
      await prisma.property.findMany({
        where: globalAccess
          ? undefined
          : {
              OR: [
                {
                  ownerId:
                    session.user.id,
                },
                {
                  taskAssignments: {
                    some: {
                      userId:
                        session.user.id,
                      active: true,
                    },
                  },
                },
              ],
            },

        orderBy: {
          name: "asc",
        },

        select: {
          id: true,
          name: true,
        },
      });

    return NextResponse.json({
      properties,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "Non è stato possibile caricare gli immobili.",
      },
      {
        status: 500,
      },
    );
  }
}
