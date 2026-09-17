import Stripe from "stripe";

import { prisma } from "@/lib/prisma";
import { PrismaTouristTaxPaymentRepository } from "@/lib/payments/tourist-tax/prisma-tourist-tax-payment-repository";
import {
  constructStripeWebhookEvent,
  handleStripeTouristTaxWebhook,
} from "@/lib/payments/tourist-tax/stripe-webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secretKey || !webhookSecret) {
    console.error(
      "Stripe webhook configuration is missing.",
    );

    return Response.json(
      {
        error: "Webhook configuration missing.",
      },
      {
        status: 500,
      },
    );
  }

  const signature = request.headers.get(
    "stripe-signature",
  );

  if (!signature) {
    return Response.json(
      {
        error: "Stripe-Signature header missing.",
      },
      {
        status: 400,
      },
    );
  }

  /*
   * Stripe signature verification requires the untouched raw body.
   * Do not call request.json() before constructEvent().
   */
  const rawBody = await request.text();

  const stripe = new Stripe(secretKey);

  let event: Stripe.Event;

  try {
    event = constructStripeWebhookEvent({
      stripe,
      rawBody,
      signature,
      webhookSecret,
    });
  } catch (error) {
    console.error(
      "Stripe webhook signature verification failed.",
      error instanceof Error
        ? error.message
        : "Unknown error",
    );

    return Response.json(
      {
        error: "Invalid Stripe webhook signature.",
      },
      {
        status: 400,
      },
    );
  }

  const repository =
    new PrismaTouristTaxPaymentRepository(prisma);

  try {
    const result =
      await handleStripeTouristTaxWebhook({
        event,
        repository,
      });

    if (result.outcome === "PAYMENT_NOT_FOUND") {
      /*
       * Return non-2xx so Stripe retries. This protects the rare
       * race where the Checkout Session exists but Horizon has not
       * finished attaching its providerPaymentId yet.
       */
      console.error(
        "Stripe tourist-tax payment not found in Horizon.",
        {
          eventId: result.eventId,
          providerPaymentId:
            result.providerPaymentId,
        },
      );

      return Response.json(
        {
          received: false,
          outcome: result.outcome,
        },
        {
          status: 503,
        },
      );
    }

    return Response.json({
      received: true,
      outcome: result.outcome,
    });
  } catch (error) {
    console.error(
      "Stripe tourist-tax webhook processing failed.",
      error instanceof Error
        ? error.message
        : "Unknown error",
    );

    return Response.json(
      {
        error: "Webhook processing failed.",
      },
      {
        status: 500,
      },
    );
  }
}
