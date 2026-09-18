import {
  BookingStatus,
  type Prisma,
} from "@prisma/client";

import { enqueueBackgroundJob } from "@/lib/job/enqueue-background-job";
import { prisma } from "@/lib/prisma";

const T48_MILLISECONDS = 48 * 60 * 60 * 1000;

export async function scheduleBookingT48OperatorAlert(
  bookingId: string,
): Promise<void> {
  const booking = await prisma.booking.findUnique({
    where: {
      id: bookingId,
    },
    select: {
      id: true,
      checkIn: true,
      bookingStatus: true,
    },
  });

  if (!booking) {
    return;
  }

  if (
    booking.bookingStatus === BookingStatus.CANCELLED ||
    booking.bookingStatus === BookingStatus.CHECKED_OUT
  ) {
    return;
  }

  const now = new Date();

  if (booking.checkIn.getTime() <= now.getTime()) {
    return;
  }

  const targetTime = new Date(
    booking.checkIn.getTime() - T48_MILLISECONDS,
  );

  const availableAt =
    targetTime.getTime() <= now.getTime()
      ? now
      : targetTime;

  const scheduledCheckIn =
    booking.checkIn.toISOString();

  await enqueueBackgroundJob({
    type: "BOOKING_T48_OPERATOR_ALERT",
    payload: {
      bookingId: booking.id,
      scheduledCheckIn,
    } satisfies Prisma.InputJsonObject,
    availableAt,
    deduplicationKey:
      `BOOKING_T48_OPERATOR_ALERT:${booking.id}:${scheduledCheckIn}`,
  });
}
