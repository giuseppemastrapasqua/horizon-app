import type {
  BookingChannel,
} from "@prisma/client";

import {
  prisma,
} from "@/lib/prisma";

export async function getPropertyOtaCommissionByChannel(
  propertyId: string,
): Promise<Map<BookingChannel, number>> {
  const rows =
    await prisma.propertyChannelCommission.findMany({
      where: {
        propertyId,

        channel: {
          in: [
            "BOOKING",
            "AIRBNB",
            "VRBO",
          ],
        },
      },

      select: {
        channel: true,
        commissionPercent: true,
      },
    });

  const commissions =
    new Map<
      BookingChannel,
      number
    >();

  for (const row of rows) {
    const commissionPercent =
      Number(
        row.commissionPercent,
      );

    if (
      !Number.isFinite(
        commissionPercent,
      )
    ) {
      continue;
    }

    commissions.set(
      row.channel,
      Math.max(
        0,
        commissionPercent,
      ),
    );
  }

  return commissions;
}

export function resolveOtaCommissionPercent({
  channel,
  commissions,
}: {
  channel: BookingChannel;

  commissions:
    Map<
      BookingChannel,
      number
    >;
}): number {
  if (
    channel === "DIRECT" ||
    channel === "OTHER"
  ) {
    return 0;
  }

  return (
    commissions.get(
      channel,
    ) ?? 0
  );
}
