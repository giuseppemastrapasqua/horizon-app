import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MIN_QUERY_LENGTH = 2;
const MAX_RESULTS_PER_DOMAIN = 5;

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();

  if (!query || query.length < MIN_QUERY_LENGTH) {
    return NextResponse.json({
      results: [],
    });
  }

  try {
    const [
      bookings,
      guests,
      properties,
      owners,
      documents,
      tasks,
    ] = await Promise.all([
      prisma.booking.findMany({
        where: {
          OR: [
            {
              guestName: {
                contains: query,
                mode: "insensitive",
              },
            },
            {
              guestEmail: {
                contains: query,
                mode: "insensitive",
              },
            },
            {
              externalBookingId: {
                contains: query,
                mode: "insensitive",
              },
            },
            {
              property: {
                name: {
                  contains: query,
                  mode: "insensitive",
                },
              },
            },
          ],
        },
        select: {
          id: true,
          guestName: true,
          checkIn: true,
          checkOut: true,
          property: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
        take: MAX_RESULTS_PER_DOMAIN,
      }),

      prisma.guest.findMany({
        where: {
          OR: [
            {
              fullName: {
                contains: query,
                mode: "insensitive",
              },
            },
            {
              email: {
                contains: query,
                mode: "insensitive",
              },
            },
            {
              phone: {
                contains: query,
                mode: "insensitive",
              },
            },
          ],
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          _count: {
            select: {
              bookings: true,
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
        take: MAX_RESULTS_PER_DOMAIN,
      }),

      prisma.property.findMany({
        where: {
          OR: [
            {
              name: {
                contains: query,
                mode: "insensitive",
              },
            },
            {
              address: {
                contains: query,
                mode: "insensitive",
              },
            },
            {
              city: {
                contains: query,
                mode: "insensitive",
              },
            },
            {
              zone: {
                contains: query,
                mode: "insensitive",
              },
            },
          ],
        },
        select: {
          id: true,
          name: true,
          address: true,
          city: true,
        },
        orderBy: {
          updatedAt: "desc",
        },
        take: MAX_RESULTS_PER_DOMAIN,
      }),

      prisma.user.findMany({
        where: {
          OR: [
            {
              fullName: {
                contains: query,
                mode: "insensitive",
              },
            },
            {
              email: {
                contains: query,
                mode: "insensitive",
              },
            },
            {
              phone: {
                contains: query,
                mode: "insensitive",
              },
            },
          ],
        },
        select: {
          id: true,
          fullName: true,
          email: true,
        },
        orderBy: {
          updatedAt: "desc",
        },
        take: MAX_RESULTS_PER_DOMAIN,
      }),

      prisma.document.findMany({
        where: {
          OR: [
            {
              title: {
                contains: query,
                mode: "insensitive",
              },
            },
            {
              subtitle: {
                contains: query,
                mode: "insensitive",
              },
            },
            {
              documentNumber: {
                contains: query,
                mode: "insensitive",
              },
            },
          ],
        },
        select: {
          id: true,
          title: true,
          subtitle: true,
          type: true,
        },
        orderBy: {
          updatedAt: "desc",
        },
        take: MAX_RESULTS_PER_DOMAIN,
      }),

      prisma.task.findMany({
        where: {
          OR: [
            {
              title: {
                contains: query,
                mode: "insensitive",
              },
            },
            {
              description: {
                contains: query,
                mode: "insensitive",
              },
            },
          ],
        },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
        },
        orderBy: {
          updatedAt: "desc",
        },
        take: MAX_RESULTS_PER_DOMAIN,
      }),
    ]);

    const results = [
      ...bookings.map((booking) => ({
        id: booking.id,
        type: "BOOKING" as const,
        title: booking.guestName,
        subtitle: `${booking.property.name} · ${formatDate(
          booking.checkIn
        )} → ${formatDate(booking.checkOut)}`,
        href: `/bookings/${booking.id}`,
      })),

      ...guests.map((guest) => ({
        id: guest.id,
        type: "GUEST" as const,
        title: guest.fullName,
        subtitle: buildGuestSubtitle({
          email: guest.email,
          bookingsCount: guest._count.bookings,
        }),
        href: `/guests/${guest.id}`,
      })),

      ...properties.map((property) => ({
        id: property.id,
        type: "PROPERTY" as const,
        title: property.name,
        subtitle:
          [property.address, property.city]
            .filter(Boolean)
            .join(" · ") || "Immobile",
        href: `/properties/${property.id}`,
      })),

      ...owners.map((owner) => ({
        id: owner.id,
        type: "OWNER" as const,
        title: owner.fullName,
        subtitle: owner.email ?? "Proprietario",
        href: `/owners/${owner.id}`,
      })),

      ...documents.map((document) => ({
        id: document.id,
        type: "DOCUMENT" as const,
        title: document.title,
        subtitle:
          document.subtitle ??
          `Documento · ${document.type}`,
        href: `/documents/${document.id}`,
      })),

      ...tasks.map((task) => ({
        id: task.id,
        type: "TASK" as const,
        title: task.title,
        subtitle:
          task.description ??
          `Task · ${task.status}`,
        href: `/tasks/${task.id}`,
      })),
    ];

    return NextResponse.json({
      results,
    });
  } catch (error) {
    console.error("Global search failed:", error);

    return NextResponse.json(
      {
        results: [],
        error: "Ricerca non disponibile.",
      },
      {
        status: 500,
      }
    );
  }
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function buildGuestSubtitle({
  email,
  bookingsCount,
}: {
  email: string | null;
  bookingsCount: number;
}) {
  const bookingsLabel =
    bookingsCount === 1
      ? "1 soggiorno"
      : `${bookingsCount} soggiorni`;

  return email
    ? `${email} · ${bookingsLabel}`
    : bookingsLabel;
}