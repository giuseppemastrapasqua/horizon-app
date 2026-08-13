import { describe, expect, it } from "vitest";

import {
  bookingComMockClient,
} from "./booking-com-mock-client";

describe("BookingComMockClient", () => {
  it("recupera una prenotazione tramite ID esterno", async () => {
    const booking =
      await bookingComMockClient.fetchBooking(
        "booking-com-reservation-1001",
      );

    expect(booking).not.toBeNull();
    expect(booking?.externalBookingId).toBe(
      "booking-com-reservation-1001",
    );
    expect(booking?.externalPropertyId).toBe(
      "booking-com-property-101",
    );
    expect(booking?.guest.fullName).toBe(
      "Mario Rossi",
    );
  });

  it("restituisce null per una prenotazione inesistente", async () => {
    const booking =
      await bookingComMockClient.fetchBooking(
        "booking-com-reservation-missing",
      );

    expect(booking).toBeNull();
  });

  it("filtra le prenotazioni per proprietà esterna", async () => {
    const page =
      await bookingComMockClient.fetchBookings({
        externalPropertyId:
          "booking-com-property-101",
      });

    expect(page.bookings).toHaveLength(2);

    expect(
      page.bookings.every(
        (booking) =>
          booking.externalPropertyId ===
          "booking-com-property-101",
      ),
    ).toBe(true);

    expect(page.hasMore).toBe(false);
    expect(page.nextCursor).toBeUndefined();
  });

  it("gestisce la paginazione tramite cursore", async () => {
    const firstPage =
      await bookingComMockClient.fetchBookings({
        limit: 1,
      });

    expect(firstPage.bookings).toHaveLength(1);
    expect(firstPage.hasMore).toBe(true);
    expect(firstPage.nextCursor).toBe("1");

    const secondPage =
      await bookingComMockClient.fetchBookings({
        limit: 1,
        cursor: firstPage.nextCursor,
      });

    expect(secondPage.bookings).toHaveLength(1);
    expect(
      secondPage.bookings[0]?.externalBookingId,
    ).not.toBe(
      firstPage.bookings[0]?.externalBookingId,
    );
  });

  it("restituisce copie isolate dei dati mock", async () => {
    const firstBooking =
      await bookingComMockClient.fetchBooking(
        "booking-com-reservation-1001",
      );

    const secondBooking =
      await bookingComMockClient.fetchBooking(
        "booking-com-reservation-1001",
      );

    expect(firstBooking).not.toBe(secondBooking);
    expect(firstBooking?.guest).not.toBe(
      secondBooking?.guest,
    );
    expect(firstBooking?.checkIn).not.toBe(
      secondBooking?.checkIn,
    );
  });

  it("rifiuta un cursore non valido", async () => {
    await expect(
      bookingComMockClient.fetchBookings({
        cursor: "invalid",
      }),
    ).rejects.toThrow(
      "Invalid Booking.com mock cursor",
    );
  });

  it("rifiuta un limite non valido", async () => {
    await expect(
      bookingComMockClient.fetchBookings({
        limit: 0,
      }),
    ).rejects.toThrow(
      "Booking.com mock page limit must be a positive integer.",
    );
  });
});
