import {
  Prisma,
  TouristTaxPaymentProvider,
  TouristTaxPaymentStatus,
} from "@prisma/client";

import type {
  AttachProviderPaymentInput,
  CreatePendingTouristTaxPaymentInput,
  TouristTaxPaymentRepository,
} from "./repository";

import type {
  TouristTaxPaymentProviderName,
  TouristTaxPaymentRecord,
} from "./types";

type TouristTaxPaymentClient = Pick<
  Prisma.TransactionClient,
  "touristTaxPayment"
>;

type TouristTaxPaymentRow = Awaited<
  ReturnType<TouristTaxPaymentClient["touristTaxPayment"]["findFirst"]>
>;

function mapPayment(
  row: TouristTaxPaymentRow,
): TouristTaxPaymentRecord | null {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    bookingId: row.bookingId,
    amount: Number(row.amount.toFixed(2)),
    currency: row.currency,
    status: row.status,
    provider: row.provider,
    providerPaymentId: row.providerPaymentId,
    paymentUrl: row.paymentUrl,
    expiresAt: row.expiresAt,
    paidAt: row.paidAt,
  };
}

function mapProvider(
  provider: TouristTaxPaymentProviderName,
): TouristTaxPaymentProvider {
  switch (provider) {
    case "STRIPE":
      return TouristTaxPaymentProvider.STRIPE;
  }
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

export class PrismaTouristTaxPaymentRepository
  implements TouristTaxPaymentRepository
{
  constructor(
    private readonly client: TouristTaxPaymentClient,
  ) {}

  async findPendingByBookingId(
    bookingId: string,
  ): Promise<TouristTaxPaymentRecord | null> {
    const row = await this.client.touristTaxPayment.findFirst({
      where: {
        bookingId,
        status: TouristTaxPaymentStatus.PENDING,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return mapPayment(row);
  }

  async findPaidByBookingId(
    bookingId: string,
  ): Promise<TouristTaxPaymentRecord | null> {
    const row = await this.client.touristTaxPayment.findFirst({
      where: {
        bookingId,
        status: TouristTaxPaymentStatus.PAID,
      },
      orderBy: {
        paidAt: "desc",
      },
    });

    return mapPayment(row);
  }

  async createPending(
    input: CreatePendingTouristTaxPaymentInput,
  ): Promise<TouristTaxPaymentRecord> {
    /*
     * Fast idempotency path for sequential duplicate requests.
     */
    const existing = await this.findPendingByBookingId(input.bookingId);

    if (existing) {
      return existing;
    }

    try {
      const row = await this.client.touristTaxPayment.create({
        data: {
          bookingId: input.bookingId,
          amount: new Prisma.Decimal(input.amount.toFixed(2)),
          currency: input.currency,
          provider: mapProvider(input.provider),
          status: TouristTaxPaymentStatus.PENDING,
        },
      });

      const mapped = mapPayment(row);

      if (!mapped) {
        throw new Error("Unable to map created tourist tax payment.");
      }

      return mapped;
    } catch (error) {
      /*
       * PostgreSQL partial unique index is the final concurrency guard.
       * A concurrent request may have inserted PENDING after our read.
       */
      if (isUniqueConstraintError(error)) {
        const concurrent = await this.findPendingByBookingId(
          input.bookingId,
        );

        if (concurrent) {
          return concurrent;
        }
      }

      throw error;
    }
  }

  async attachProviderPayment(
    input: AttachProviderPaymentInput,
  ): Promise<TouristTaxPaymentRecord> {
    const row = await this.client.touristTaxPayment.update({
      where: {
        id: input.id,
      },
      data: {
        providerPaymentId: input.providerPaymentId,
        paymentUrl: input.paymentUrl,
        expiresAt: input.expiresAt ?? null,
      },
    });

    const mapped = mapPayment(row);

    if (!mapped) {
      throw new Error("Unable to map tourist tax payment.");
    }

    return mapped;
  }

  async markPaidByProviderPaymentId(
    provider: TouristTaxPaymentProviderName,
    providerPaymentId: string,
    paidAt: Date,
  ): Promise<TouristTaxPaymentRecord | null> {
    const existing =
      await this.client.touristTaxPayment.findFirst({
        where: {
          provider: mapProvider(provider),
          providerPaymentId,
        },
      });

    if (!existing) {
      return null;
    }

    /*
     * Duplicate webhook/provider notification:
     * already PAID means no second mutation.
     */
    if (existing.status === TouristTaxPaymentStatus.PAID) {
      return mapPayment(existing);
    }

    const row = await this.client.touristTaxPayment.update({
      where: {
        id: existing.id,
      },
      data: {
        status: TouristTaxPaymentStatus.PAID,
        paidAt,
        failedAt: null,
        cancelledAt: null,
      },
    });

    return mapPayment(row);
  }
}

