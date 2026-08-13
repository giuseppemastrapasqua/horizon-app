import type { BookingUpsertInput } from "./booking-upsert-input";
import type { DomainSyncResult } from "./domain-sync-result";

export interface BookingDomainService {
  upsertBooking(
    booking: BookingUpsertInput,
  ): Promise<DomainSyncResult>;
}