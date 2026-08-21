import {
  prisma,
} from "@/lib/prisma";

export type PropertyChannelPricingSetting = {
  channel:
    | "BOOKING"
    | "AIRBNB"
    | "VRBO";

  commissionPercent:
    number | null;
};

export async function getPropertyChannelPricingSettings(
  propertyId: string,
): Promise<PropertyChannelPricingSetting[]> {
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

  const commissionByChannel =
    new Map(
      rows.map(
        (row) => [
          row.channel,
          Number(
            row.commissionPercent,
          ),
        ],
      ),
    );

  const channels =
    [
      "BOOKING",
      "AIRBNB",
      "VRBO",
    ] as const;

  return channels.map(
    (channel) => ({
      channel,
      commissionPercent:
        commissionByChannel.get(
          channel,
        ) ?? null,
    }),
  );
}
