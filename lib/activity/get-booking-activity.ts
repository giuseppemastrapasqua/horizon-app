import type { ActivityItem } from "./types";

type BookingActivityInput = {
  id: string;
  guestName: string;
  bookingStatus: string;
  operationalStatus: string;
  checkIn: string;
  checkOut: string;
  createdAt: string;
  updatedAt: string;
};

export function getBookingActivity(
  booking: BookingActivityInput
): ActivityItem[] {
  const activities: ActivityItem[] = [
    {
      id: `booking-created-${booking.id}`,
      type: "BOOKING_CREATED",
      source: "BOOKING",
      title: "Prenotazione creata",
      description: `Prenotazione registrata per ${booking.guestName}.`,
      occurredAt: new Date(booking.createdAt),
      tone: "success",
      href: `/bookings/${booking.id}`,
    },
    {
      id: `booking-updated-${booking.id}`,
      type: "BOOKING_UPDATED",
      source: "BOOKING",
      title: "Prenotazione aggiornata",
      description: `Stato operativo: ${booking.operationalStatus}.`,
      occurredAt: new Date(booking.updatedAt),
      tone:
        booking.operationalStatus === "OK"
          ? "success"
          : "warning",
      href: `/bookings/${booking.id}`,
    },
    {
      id: `booking-checkin-${booking.id}`,
      type: "BOOKING_STATUS_CHANGED",
      source: "BOOKING",
      title: "Check-in programmato",
      description: formatDate(new Date(booking.checkIn)),
      occurredAt: new Date(booking.checkIn),
      tone: "info",
      href: `/bookings/${booking.id}`,
    },
    {
      id: `booking-checkout-${booking.id}`,
      type: "BOOKING_STATUS_CHANGED",
      source: "BOOKING",
      title: "Check-out programmato",
      description: formatDate(new Date(booking.checkOut)),
      occurredAt: new Date(booking.checkOut),
      tone: "info",
      href: `/bookings/${booking.id}`,
    },
  ];

  return activities.sort(
    (first, second) =>
      second.occurredAt.getTime() -
      first.occurredAt.getTime()
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("it-IT", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}