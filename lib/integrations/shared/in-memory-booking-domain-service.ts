import type { BookingUpsertInput } from "./booking-upsert-input";
import type { BookingDomainService } from "./domain-booking-service";
import type { DomainSyncResult } from "./domain-sync-result";

export class InMemoryBookingDomainService
  implements BookingDomainService
{
  private readonly bookings = new Map<
    string,
    BookingUpsertInput
  >();

  async upsertBooking(
    booking: BookingUpsertInput,
  ): Promise<DomainSyncResult> {
    const alreadyExists = this.bookings.has(
      booking.externalBookingId,
    );

    this.bookings.set(
      booking.externalBookingId,
      booking,
    );

    return {
      inserted: alreadyExists ? 0 : 1,
      updated: alreadyExists ? 1 : 0,
      skipped: 0,
    };
  }

  getAll(): readonly BookingUpsertInput[] {
    return [...this.bookings.values()];
  }

  clear(): void {
    this.bookings.clear();
  }
}

export const inMemoryBookingDomainService =
  new InMemoryBookingDomainService();