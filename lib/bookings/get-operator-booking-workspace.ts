import { TaskStatus } from "@prisma/client";

import { requirePropertyAccess } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { validateBookingGuestsForAlloggiati } from "@/lib/integrations/alloggiati-web/validate-booking-guests";

export async function getOperatorBookingWorkspace(bookingId: string) {
  const reference = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      propertyId: true,
    },
  });

  if (!reference) {
    return null;
  }

  const user = await requirePropertyAccess(reference.propertyId);

  if (user.role !== "OPERATOR") {
    throw new Error("Workspace collaboratore non autorizzato.");
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      guestName: true,
      guestEmail: true,
      guestPhone: true,
      channel: true,
      externalBookingId: true,
      checkIn: true,
      checkOut: true,
      nights: true,
      guests: true,
      bookingStatus: true,
      operationalStatus: true,
      property: {
        select: {
          id: true,
          name: true,
          address: true,
          city: true,
          zone: true,
        },
      },
      tasks: {
        orderBy: {
          dueDate: "asc",
        },
        select: {
          id: true,
          title: true,
          description: true,
          type: true,
          status: true,
          dueDate: true,
          updatedAt: true,
        },
      },
      guestCheckInLink: {
        select: {
          expiresAt: true,
          revokedAt: true,
          updatedAt: true,
        },
      },
      bookingGuests: {
        select: {
          role: true,
          firstName: true,
          lastName: true,
          gender: true,
          birthDate: true,
          birthCity: true,
          birthProvince: true,
          birthCountry: true,
          citizenship: true,
          documentType: true,
          documentNumber: true,
          documentIssueCountry: true,
          documentIssueCity: true,
        },
      },
      alloggiatiWebTransmissions: {
        orderBy: {
          updatedAt: "desc",
        },
        select: {
          status: true,
          lastError: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!booking) {
    return null;
  }

  const now = new Date();

  const openTasks = booking.tasks.filter(
    (task) =>
      task.status !== TaskStatus.DONE &&
      task.status !== TaskStatus.CANCELLED,
  );

  const overdueTasks = openTasks.filter(
    (task) => task.dueDate && task.dueDate < now,
  );

  const guestCompliance = validateBookingGuestsForAlloggiati(
    booking.guests,
    booking.bookingGuests,
  );

  const latestTransmission =
    booking.alloggiatiWebTransmissions[0] ?? null;

  const hasConfirmedTransmission =
    booking.alloggiatiWebTransmissions.some(
      (transmission) => transmission.status === "CONFIRMED",
    );

  const guestRegistrationStatus = hasConfirmedTransmission
    ? ("SENT" as const)
    : latestTransmission?.status === "PARTIALLY_CONFIRMED"
      ? ("PARTIAL" as const)
      : latestTransmission?.status === "OUTCOME_UNKNOWN"
        ? ("OUTCOME_UNKNOWN" as const)
        : latestTransmission?.status === "REJECTED"
          ? ("REJECTED" as const)
          : latestTransmission?.status === "PREPARED" ||
              latestTransmission?.status === "SENDING"
            ? ("SENDING" as const)
            : guestCompliance.ready
              ? ("READY" as const)
              : ("TO_COMPLETE" as const);

  return {
    booking: {
      id: booking.id,
      guestName: booking.guestName,
      guestEmail: booking.guestEmail,
      guestPhone: booking.guestPhone,
      channel: booking.channel,
      externalBookingId: booking.externalBookingId,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      nights: booking.nights,
      guests: booking.guests,
      bookingStatus: booking.bookingStatus,
      operationalStatus: booking.operationalStatus,
      property: booking.property,
      guestRegistration: {
        status: guestRegistrationStatus,
        completedGuests: booking.bookingGuests.length,
        expectedGuests: booking.guests,
        latestTransmissionStatus: latestTransmission?.status ?? null,
        lastError: latestTransmission?.lastError ?? null,
      },
      guestCheckInLink: booking.guestCheckInLink
        ? {
            status:
              booking.guestCheckInLink.revokedAt !== null
                ? ("REVOKED" as const)
                : booking.guestCheckInLink.expiresAt <= now
                  ? ("EXPIRED" as const)
                  : ("ACTIVE" as const),
            expiresAt: booking.guestCheckInLink.expiresAt,
            updatedAt: booking.guestCheckInLink.updatedAt,
          }
        : null,
    },
    tasks: booking.tasks,
    metrics: {
      openTasksCount: openTasks.length,
      overdueTasksCount: overdueTasks.length,
      daysUntilCheckIn: calculateDaysUntil(now, booking.checkIn),
      daysUntilCheckOut: calculateDaysUntil(now, booking.checkOut),
    },
  };
}

function calculateDaysUntil(from: Date, to: Date) {
  const millisecondsPerDay = 1000 * 60 * 60 * 24;

  return Math.ceil(
    (to.getTime() - from.getTime()) / millisecondsPerDay,
  );
}