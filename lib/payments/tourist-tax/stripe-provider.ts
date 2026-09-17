import Stripe from "stripe";

import type {
  CreateTouristTaxPaymentRequest,
  CreatedTouristTaxPayment,
  TouristTaxPaymentProviderAdapter,
} from "./types";

type StripeCheckoutClient = Pick<
  Stripe,
  "checkout"
>;

function toMinorUnits(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error(
      "Stripe payment amount must be greater than zero.",
    );
  }

  return Math.round(
    (amount + Number.EPSILON) * 100,
  );
}

export class StripeTouristTaxPaymentProvider
  implements TouristTaxPaymentProviderAdapter
{
  readonly provider = "STRIPE" as const;

  constructor(
    private readonly stripe: StripeCheckoutClient,
  ) {}

  async createPayment(
    input: CreateTouristTaxPaymentRequest,
  ): Promise<CreatedTouristTaxPayment> {
    const currency =
      input.currency.toLowerCase();

    if (currency !== "eur") {
      throw new Error(
        "Stripe tourist-tax payments currently support EUR only.",
      );
    }

    const session =
      await this.stripe.checkout.sessions.create(
        {
          mode: "payment",

          line_items: [
            {
              quantity: 1,
              price_data: {
                currency,
                unit_amount:
                  toMinorUnits(input.amount),
                product_data: {
                  name: "Imposta di soggiorno",
                  description:
                    `Prenotazione ${input.reference}`,
                },
              },
            },
          ],

          client_reference_id:
            input.bookingId,

          metadata: {
            horizonPaymentType:
              "TOURIST_TAX",
            paymentId: input.paymentId,
            bookingId: input.bookingId,
            reference: input.reference,
          },

          payment_intent_data: {
            metadata: {
              horizonPaymentType:
                "TOURIST_TAX",
              paymentId: input.paymentId,
              bookingId: input.bookingId,
              reference: input.reference,
            },
          },

          expires_at:
            Math.floor(Date.now() / 1000) +
            60 * 60 * 23,

          success_url:
            `${process.env.APP_URL ?? "http://localhost:3000"}` +
            `/payments/tourist-tax/success?session_id={CHECKOUT_SESSION_ID}`,

          cancel_url:
            `${process.env.APP_URL ?? "http://localhost:3000"}` +
            `/payments/tourist-tax/cancelled`,
        },
        {
          /*
           * The Horizon payment record is created before Stripe.
           * Concurrent requests recovering the same PENDING record
           * therefore use the same Stripe idempotency key.
           */
          idempotencyKey:
            `tourist-tax:${input.paymentId}:v2`,
        },
      );

    if (!session.url) {
      throw new Error(
        "Stripe Checkout Session did not return a payment URL.",
      );
    }

    return {
      provider: "STRIPE",
      providerPaymentId: session.id,
      paymentUrl: session.url,
      expiresAt: session.expires_at
        ? new Date(
            session.expires_at * 1000,
          )
        : undefined,
    };
  }
}

export function createStripeTouristTaxPaymentProvider(): StripeTouristTaxPaymentProvider {
  const secretKey =
    process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error(
      "STRIPE_SECRET_KEY is not configured.",
    );
  }

  return new StripeTouristTaxPaymentProvider(
    new Stripe(secretKey),
  );
}
