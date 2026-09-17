import type Stripe from "stripe";
import { describe, expect, it, vi } from "vitest";

import {
  constructStripeWebhookEvent,
  handleStripeTouristTaxWebhook,
} from "./stripe-webhook";

import type {
  StripeWebhookPaymentRepository,
} from "./stripe-webhook";

function payment() {
  return {
    id: "pay_1",
    bookingId: "booking_1",
    amount: 76,
    currency: "EUR",
    status: "PAID" as const,
    provider: "STRIPE" as const,
    providerPaymentId: "cs_test_1",
    paymentUrl: "https://checkout.stripe.test/1",
    expiresAt: null,
    paidAt: new Date("2026-09-16T12:00:00Z"),
  };
}

function repository(
  result: ReturnType<typeof payment> | null = payment(),
): StripeWebhookPaymentRepository {
  return {
    markPaidByProviderPaymentId:
      vi.fn().mockResolvedValue(result),
  };
}

function event(
  overrides: Partial<Stripe.Checkout.Session> = {},
): Stripe.Event {
  return {
    id: "evt_test_1",
    object: "event",
    api_version: "2025-08-27.basil",
    created: 1_789_560_000,
    livemode: false,
    pending_webhooks: 1,
    request: {
      id: null,
      idempotency_key: null,
    },
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs_test_1",
        object: "checkout.session",
        payment_status: "paid",
        metadata: {
          horizonPaymentType: "TOURIST_TAX",
          bookingId: "booking_1",
          reference: "IDS-booking_1",
        },
        ...overrides,
      } as Stripe.Checkout.Session,
    },
  } as Stripe.Event;
}

describe("Stripe tourist-tax webhook", () => {
  it("passes raw body, signature and secret to Stripe verification", () => {
    const verified = event();

    const stripe = {
      webhooks: {
        constructEvent: vi.fn().mockReturnValue(verified),
      },
    };

    const result = constructStripeWebhookEvent({
      stripe: stripe as never,
      rawBody: '{"id":"evt_test_1"}',
      signature: "t=123,v1=signature",
      webhookSecret: "whsec_test",
    });

    expect(
      stripe.webhooks.constructEvent,
    ).toHaveBeenCalledWith(
      '{"id":"evt_test_1"}',
      "t=123,v1=signature",
      "whsec_test",
    );

    expect(result).toBe(verified);
  });

  it("marks a paid tourist-tax Checkout Session as PAID", async () => {
    const repo = repository();

    const result =
      await handleStripeTouristTaxWebhook({
        event: event(),
        repository: repo,
      });

    expect(
      repo.markPaidByProviderPaymentId,
    ).toHaveBeenCalledWith(
      "STRIPE",
      "cs_test_1",
      new Date(1_789_560_000 * 1000),
    );

    expect(result.outcome).toBe("PAID");
  });

  it("does not reconcile an unpaid completed Checkout Session", async () => {
    const repo = repository();

    const result =
      await handleStripeTouristTaxWebhook({
        event: event({
          payment_status: "unpaid",
        }),
        repository: repo,
      });

    expect(result.outcome).toBe("NOT_PAID");

    expect(
      repo.markPaidByProviderPaymentId,
    ).not.toHaveBeenCalled();
  });

  it("ignores Checkout Sessions not belonging to tourist tax", async () => {
    const repo = repository();

    const result =
      await handleStripeTouristTaxWebhook({
        event: event({
          metadata: {
            horizonPaymentType: "OTHER",
          },
        }),
        repository: repo,
      });

    expect(result.outcome).toBe("IGNORED");

    expect(
      repo.markPaidByProviderPaymentId,
    ).not.toHaveBeenCalled();
  });

  it("ignores unrelated Stripe events", async () => {
    const repo = repository();

    const unrelated = {
      ...event(),
      type: "payment_intent.created",
    } as Stripe.Event;

    const result =
      await handleStripeTouristTaxWebhook({
        event: unrelated,
        repository: repo,
      });

    expect(result.outcome).toBe("IGNORED");

    expect(
      repo.markPaidByProviderPaymentId,
    ).not.toHaveBeenCalled();
  });

  it("reports when the Stripe Session is unknown to Horizon", async () => {
    const repo = repository(null);

    const result =
      await handleStripeTouristTaxWebhook({
        event: event(),
        repository: repo,
      });

    expect(result).toEqual({
      outcome: "PAYMENT_NOT_FOUND",
      eventId: "evt_test_1",
      providerPaymentId: "cs_test_1",
    });
  });
});
