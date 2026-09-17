import Stripe from "stripe";

import type {
  TouristTaxPaymentProviderName,
  TouristTaxPaymentRecord,
} from "./types";

export interface StripeWebhookPaymentRepository {
  markPaidByProviderPaymentId(
    provider: TouristTaxPaymentProviderName,
    providerPaymentId: string,
    paidAt: Date,
  ): Promise<TouristTaxPaymentRecord | null>;
}

export type StripeTouristTaxWebhookResult =
  | {
      outcome: "IGNORED";
      eventId: string;
    }
  | {
      outcome: "NOT_PAID";
      eventId: string;
    }
  | {
      outcome: "PAYMENT_NOT_FOUND";
      eventId: string;
      providerPaymentId: string;
    }
  | {
      outcome: "PAID";
      eventId: string;
      payment: TouristTaxPaymentRecord;
    };

export function constructStripeWebhookEvent(input: {
  stripe: Stripe;
  rawBody: string;
  signature: string;
  webhookSecret: string;
}): Stripe.Event {
  return input.stripe.webhooks.constructEvent(
    input.rawBody,
    input.signature,
    input.webhookSecret,
  );
}

export async function handleStripeTouristTaxWebhook(input: {
  event: Stripe.Event;
  repository: StripeWebhookPaymentRepository;
}): Promise<StripeTouristTaxWebhookResult> {
  const { event, repository } = input;

  if (event.type !== "checkout.session.completed") {
    return {
      outcome: "IGNORED",
      eventId: event.id,
    };
  }

  const session = event.data.object as Stripe.Checkout.Session;

  /*
   * Never mark a Horizon payment PAID merely because Checkout
   * completed. Stripe must explicitly report payment_status=paid.
   */
  if (session.payment_status !== "paid") {
    return {
      outcome: "NOT_PAID",
      eventId: event.id,
    };
  }

  /*
   * Only Horizon tourist-tax Checkout Sessions belong here.
   */
  if (
    session.metadata?.horizonPaymentType !== "TOURIST_TAX"
  ) {
    return {
      outcome: "IGNORED",
      eventId: event.id,
    };
  }

  if (!session.id) {
    throw new Error(
      "Stripe Checkout Session is missing its id.",
    );
  }

  const payment =
    await repository.markPaidByProviderPaymentId(
      "STRIPE",
      session.id,
      new Date(event.created * 1000),
    );

  if (!payment) {
    return {
      outcome: "PAYMENT_NOT_FOUND",
      eventId: event.id,
      providerPaymentId: session.id,
    };
  }

  return {
    outcome: "PAID",
    eventId: event.id,
    payment,
  };
}
