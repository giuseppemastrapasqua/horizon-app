import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getAccessiblePropertyIds } from "@/lib/auth/guards";
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
    const accessiblePropertyIds =
      await getAccessiblePropertyIds();

    const properties =
      await prisma.property.findMany({
        where:
          accessiblePropertyIds === null
            ? undefined
            : {
                id: {
                  in: accessiblePropertyIds,
                },
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