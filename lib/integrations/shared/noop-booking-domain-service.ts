import type { BookingUpsertInput } from "./booking-upsert-input";
import type { BookingDomainService } from "./domain-booking-service";
import type { DomainSyncResult } from "./domain-sync-result";

export class NoopBookingDomainService
  implements BookingDomainService
{
  async upsertBooking(
    _input: BookingUpsertInput,
  ): Promise<DomainSyncResult> {
    return {
      inserted: 0,
      updated: 0,
      skipped: 1,
    };
  }
}

export const noopBookingDomainService =
  new NoopBookingDomainService();