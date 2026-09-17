import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  createStripeTouristTaxPaymentProvider,
  StripeTouristTaxPaymentProvider,
} from "./stripe-provider";

function stripeClient() {
  return {
    checkout: {
      sessions: {
        create: vi.fn(),
      },
    },
  };
}

describe(
  "StripeTouristTaxPaymentProvider",
  () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it(
      "creates one idempotent Stripe Checkout Session for the canonical IDS amount",
      async () => {
        const stripe = stripeClient();

        stripe.checkout.sessions.create
          .mockResolvedValue({
            id: "cs_test_horizon_1",
            url: "https://checkout.stripe.test/c/pay",
            expires_at: 1_800_000_000,
          });

        const provider =
          new StripeTouristTaxPaymentProvider(
            stripe as never,
          );

        const result =
          await provider.createPayment({
            paymentId: "pay_1",
            bookingId: "booking_1",
            amount: 76,
            currency: "EUR",
            reference: "IDS-booking_1",
          });

        expect(
          stripe.checkout.sessions.create,
        ).toHaveBeenCalledTimes(1);

        expect(
          stripe.checkout.sessions.create,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            mode: "payment",

            client_reference_id:
              "booking_1",

            line_items: [
              {
                quantity: 1,
                price_data: {
                  currency: "eur",
                  unit_amount: 7600,
                  product_data: {
                    name:
                      "Imposta di soggiorno",
                    description:
                      "Prenotazione IDS-booking_1",
                  },
                },
              },
            ],

            metadata: {
              horizonPaymentType:
                "TOURIST_TAX",
              paymentId: "pay_1",
              bookingId: "booking_1",
              reference:
                "IDS-booking_1",
            },

            payment_intent_data: {
              metadata: {
                horizonPaymentType:
                  "TOURIST_TAX",
                paymentId: "pay_1",
                bookingId:
                  "booking_1",
                reference:
                  "IDS-booking_1",
              },
            },
          }),
          {
            idempotencyKey:
              "tourist-tax:pay_1:v2",
          },
        );

        expect(result).toEqual({
          provider: "STRIPE",
          providerPaymentId:
            "cs_test_horizon_1",
          paymentUrl:
            "https://checkout.stripe.test/c/pay",
          expiresAt:
            new Date(
              1_800_000_000 * 1000,
            ),
        });
      },
    );

    it(
      "converts decimal EUR amounts to cents",
      async () => {
        const stripe = stripeClient();

        stripe.checkout.sessions.create
          .mockResolvedValue({
            id: "cs_test_horizon_2",
            url: "https://checkout.stripe.test/c/pay2",
            expires_at: null,
          });

        const provider =
          new StripeTouristTaxPaymentProvider(
            stripe as never,
          );

        await provider.createPayment({
          paymentId: "pay_2",
          bookingId: "booking_2",
          amount: 19.5,
          currency: "EUR",
          reference: "IDS-booking_2",
        });

        expect(
          stripe.checkout.sessions.create,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            line_items: [
              expect.objectContaining({
                price_data:
                  expect.objectContaining({
                    unit_amount: 1950,
                  }),
              }),
            ],
          }),
          {
            idempotencyKey:
              "tourist-tax:pay_2:v2",
          },
        );
      },
    );

    it(
      "rejects unsupported currencies",
      async () => {
        const provider =
          new StripeTouristTaxPaymentProvider(
            stripeClient() as never,
          );

        await expect(
          provider.createPayment({
            paymentId: "pay_1",
            bookingId: "booking_1",
            amount: 76,
            currency: "USD" as never,
            reference: "IDS-booking_1",
          }),
        ).rejects.toThrow(
          "currently support EUR only",
        );
      },
    );

    it(
      "rejects invalid amounts before calling Stripe",
      async () => {
        const stripe = stripeClient();

        const provider =
          new StripeTouristTaxPaymentProvider(
            stripe as never,
          );

        await expect(
          provider.createPayment({
            paymentId: "pay_1",
            bookingId: "booking_1",
            amount: 0,
            currency: "EUR",
            reference: "IDS-booking_1",
          }),
        ).rejects.toThrow(
          "amount must be greater than zero",
        );

        expect(
          stripe.checkout.sessions.create,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "fails if Stripe does not return a Checkout URL",
      async () => {
        const stripe = stripeClient();

        stripe.checkout.sessions.create
          .mockResolvedValue({
            id: "cs_test_missing_url",
            url: null,
            expires_at: 1_800_000_000,
          });

        const provider =
          new StripeTouristTaxPaymentProvider(
            stripe as never,
          );

        await expect(
          provider.createPayment({
            paymentId: "pay_1",
            bookingId: "booking_1",
            amount: 76,
            currency: "EUR",
            reference: "IDS-booking_1",
          }),
        ).rejects.toThrow(
          "did not return a payment URL",
        );
      },
    );

    it(
      "requires STRIPE_SECRET_KEY for the production factory",
      () => {
        const original =
          process.env.STRIPE_SECRET_KEY;

        delete process.env
          .STRIPE_SECRET_KEY;

        expect(() =>
          createStripeTouristTaxPaymentProvider(),
        ).toThrow(
          "STRIPE_SECRET_KEY is not configured",
        );

        if (original) {
          process.env.STRIPE_SECRET_KEY =
            original;
        }
      },
    );
  },
);
