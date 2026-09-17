"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { ActionButton } from "@/components/ui/ActionButton";
import { uiTokens } from "@/components/ui/tokens";
import { copyToClipboard } from "@/lib/browser/copy-to-clipboard";

import {
  createTouristTaxCheckoutAction,
  getTouristTaxPaymentStatusAction,
} from "../tourist-tax-payment-actions";

type PaymentState =
  | "LOADING"
  | "NOT_CREATED"
  | "PENDING"
  | "PAID"
  | "FAILED";

export function BookingTouristTaxPaymentControl({
  enabled,
}: {
  enabled: boolean;
}) {
  const params = useParams<{ id: string }>();
  const bookingId = params.id;

  const [state, setState] = useState<PaymentState>("LOADING");
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void getTouristTaxPaymentStatusAction(bookingId)
      .then((result) => {
        if (!active) return;

        setState(
          result.status === "PAID"
            ? "PAID"
            : result.status === "PENDING"
              ? "PENDING"
              : "NOT_CREATED",
        );

        setPaymentUrl(
          result.status === "PENDING"
            ? result.paymentUrl
            : null,
        );
      })
      .catch(() => {
        if (active) {
          setState("FAILED");
        }
      });

    return () => {
      active = false;
    };
  }, [bookingId]);

  async function handleGeneratePaymentLink() {
    setWorking(true);
    setMessage(null);

    try {
      const result =
        await createTouristTaxCheckoutAction(bookingId);

      if (result.status === "PAID") {
        setState("PAID");
        setPaymentUrl(null);
        setMessage("Imposta già pagata.");
        return;
      }

      setState("PENDING");
      setPaymentUrl(result.paymentUrl);
      setMessage(
        "Link di pagamento pronto per essere condiviso.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Impossibile generare il link di pagamento.",
      );
    } finally {
      setWorking(false);
    }
  }

  async function handleCopyPaymentLink() {
    if (!paymentUrl) return;

    const copied = await copyToClipboard(paymentUrl);

    setMessage(
      copied
        ? "Link copiato. Puoi inviarlo all'ospite via WhatsApp, SMS o email."
        : "Impossibile copiare automaticamente il link.",
    );
  }

  function handleOpenPayment() {
    if (!paymentUrl) return;

    window.open(
      paymentUrl,
      "_blank",
      "noopener,noreferrer",
    );
  }

  if (!enabled) {
    return null;
  }

  if (state === "LOADING") {
    return (
      <div style={containerStyle}>
        <div style={statusStyle}>
          <span style={labelStyle}>Pagamento</span>
          <strong style={pendingStyle}>Verifica stato...</strong>
        </div>
      </div>
    );
  }

  if (state === "PAID") {
    return (
      <div style={containerStyle}>
        <div style={statusStyle}>
          <span style={labelStyle}>Pagamento</span>
          <strong style={paidStyle}>PAGATA</strong>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={statusStyle}>
        <span style={labelStyle}>Pagamento</span>
        <strong style={pendingStyle}>
          {state === "PENDING" ? "DA PAGARE" : "NON CREATO"}
        </strong>
      </div>

      <div style={actionsStyle}>
        {paymentUrl ? (
          <>
            <ActionButton
              label="Copia link"
              variant="secondary"
              compact
              disabled={working}
              onClick={() => void handleCopyPaymentLink()}
            />

            <ActionButton
              label="Apri pagamento"
              compact
              disabled={working}
              onClick={handleOpenPayment}
            />
          </>
        ) : (
          <ActionButton
            label={
              working
                ? "Generazione..."
                : "Genera link pagamento"
            }
            compact
            disabled={working}
            onClick={() =>
              void handleGeneratePaymentLink()
            }
          />
        )}
      </div>

      {message ? (
        <span style={messageStyle}>{message}</span>
      ) : null}
    </div>
  );
}

const containerStyle = {
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap" as const,
  gap: uiTokens.spacing.sm,
  padding: uiTokens.spacing.sm,
  borderRadius: uiTokens.radius.lg,
  background: uiTokens.colors.primary,
};

const statusStyle = {
  minWidth: "100px",
  marginRight: "auto",
};

const actionsStyle = {
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap" as const,
  gap: uiTokens.spacing.xs,
};

const labelStyle = {
  display: "block",
  color: "#64748b",
  fontSize: uiTokens.fontSize.xs,
};

const pendingStyle = {
  display: "block",
  marginTop: "2px",
  color: uiTokens.colors.primaryText,
  fontSize: uiTokens.fontSize.sm,
};

const paidStyle = {
  display: "block",
  marginTop: "2px",
  color: uiTokens.colors.primaryText,
  fontSize: uiTokens.fontSize.sm,
};

const messageStyle = {
  flexBasis: "100%",
  color: "#94a3b8",
  fontSize: uiTokens.fontSize.xs,
};
