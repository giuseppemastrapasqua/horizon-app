"use server";

import {
  revalidatePath,
} from "next/cache";

import {
  BookingChannel,
} from "@prisma/client";

import {
  prisma,
} from "@/lib/prisma";

export async function updatePropertyChannelPricingAction(
  formData: FormData,
): Promise<void> {
  const propertyId =
    String(
      formData.get(
        "propertyId",
      ) ?? "",
    ).trim();

  const channelText =
    String(
      formData.get(
        "channel",
      ) ?? "",
    ).trim();

  const commissionText =
    String(
      formData.get(
        "commissionPercent",
      ) ?? "",
    ).trim();

  if (!propertyId) {
    throw new Error(
      "Identificativo immobile mancante.",
    );
  }

  if (
    channelText !== "BOOKING" &&
    channelText !== "AIRBNB" &&
    channelText !== "VRBO"
  ) {
    throw new Error(
      "Canale OTA non valido.",
    );
  }

  if (!commissionText) {
    throw new Error(
      "Inserisci la commissione OTA.",
    );
  }

  const commissionPercent =
    Number(
      commissionText.replace(
        ",",
        ".",
      ),
    );

  if (
    !Number.isFinite(
      commissionPercent,
    ) ||
    commissionPercent < 0 ||
    commissionPercent >= 100
  ) {
    throw new Error(
      "La commissione deve essere compresa tra 0 e 99,99.",
    );
  }

  const channel =
    channelText as BookingChannel;

  await prisma.propertyChannelCommission.upsert({
    where: {
      propertyId_channel: {
        propertyId,
        channel,
      },
    },

    update: {
      commissionPercent:
        Number(
          commissionPercent.toFixed(
            2,
          ),
        ),
    },

    create: {
      propertyId,
      channel,

      commissionPercent:
        Number(
          commissionPercent.toFixed(
            2,
          ),
        ),
    },
  });

  revalidatePath(
    `/properties/${propertyId}/edit`,
  );

  revalidatePath(
    "/calendar",
  );
}
