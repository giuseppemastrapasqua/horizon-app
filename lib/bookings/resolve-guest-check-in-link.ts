import { hashGuestCheckInToken, isGuestCheckInLinkUsable } from "@/lib/bookings/guest-check-in-token";
import { prisma } from "@/lib/prisma";

export async function resolveGuestCheckInLink(token: string) {
  const normalizedToken = token.trim();

  if (!normalizedToken) {
    return null;
  }

  const link = await prisma.guestCheckInLink.findUnique({
    where: {
      tokenHash: hashGuestCheckInToken(normalizedToken),
    },
    select: {
      expiresAt: true,
      revokedAt: true,
      booking: {
        select: {
          id: true,
          guestName: true,
          checkIn: true,
          checkOut: true,
          guests: true,
          bookingGuests: {
            orderBy: {
              createdAt: "asc",
            },
            select: {
              id: true,
              role: true,
              firstName: true,
              lastName: true,
              gender: true,
              birthDate: true,
              birthCity: true,
              birthProvince: true,
              birthCountry: true,
              citizenship: true,
              residenceCountry: true,
              residenceCity: true,
              residenceProvince: true,
              documentType: true,
              documentNumber: true,
              documentIssueCountry: true,
              documentIssueCity: true,
            },
          },
          property: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  if (!link) {
    return null;
  }

  if (
    !isGuestCheckInLinkUsable({
      expiresAt: link.expiresAt,
      revokedAt: link.revokedAt,
    })
  ) {
    return null;
  }

  return {
    expiresAt: link.expiresAt,
    booking: link.booking,
  };
}
