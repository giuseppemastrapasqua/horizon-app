import type { Prisma } from "@prisma/client";

import type {
  FiscalClassificationRepository,
  FiscalClassificationUpsertData,
} from "./fiscal-classification-service";

type SoggiorniamoFiscalClassificationClient = Pick<
  Prisma.TransactionClient,
  "soggiorniamoFiscalClassification"
>;

export class PrismaSoggiorniamoFiscalClassificationRepository
  implements FiscalClassificationRepository
{
  constructor(
    private readonly client: SoggiorniamoFiscalClassificationClient,
  ) {}

  async findByBookingGuestId(bookingGuestId: string) {
    return this.client.soggiorniamoFiscalClassification.findUnique({
      where: {
        bookingGuestId,
      },
      select: {
        bookingGuestId: true,
        source: true,
      },
    });
  }

  async upsert(input: {
    where: {
      bookingGuestId: string;
    };
    create: FiscalClassificationUpsertData;
    update: Omit<FiscalClassificationUpsertData, "bookingGuestId">;
  }) {
    return this.client.soggiorniamoFiscalClassification.upsert({
      where: input.where,
      create: input.create,
      update: input.update,
    });
  }
}
