"use client";

import { useState } from "react";

import { ActionButton } from "@/components/ui/ActionButton";
import { Panel } from "@/components/ui/Panel";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { uiTokens } from "@/components/ui/tokens";
import { copyToClipboard } from "@/lib/browser/copy-to-clipboard";

import {
  enqueueGuestCheckInAlloggiatiSubmissionAction,
  generateGuestCheckInLinkAction,
  revokeGuestCheckInLinkAction,
  sendGuestCheckInEmailAction,
  verifyGuestCheckInWithAlloggiatiAction,
} from "../guest-check-in-actions";

type GuestCheckInLinkStatus = "ACTIVE" | "REVOKED" | "EXPIRED";

type BookingGuestCheckInPanelProps = {
  bookingId: string;
  guestEmail: string | null;
  guestRegistration: {
    status:
      | "TO_COMPLETE"
      | "READY"
      | "SENDING"
      | "SENT"
      | "PARTIAL"
      | "OUTCOME_UNKNOWN"
      | "REJECTED";
    completedGuests: number;
    expectedGuests: number;
    latestTransmissionStatus: string | null;
    lastError: string | null;
  };
  initialLink: {
    status: GuestCheckInLinkStatus;
    expiresAt: Date;
    updatedAt: Date;
  } | null;
  canSubmitToAlloggiati?: boolean;
};

export function BookingGuestCheckInPanel({
  bookingId,
  guestEmail,
  guestRegistration,
  initialLink,
  canSubmitToAlloggiati = true,
}: BookingGuestCheckInPanelProps) {
  const [status, setStatus] =
    useState<GuestCheckInLinkStatus | "NONE">(
      initialLink?.status ?? "NONE",
    );

  const [expiresAt, setExpiresAt] =
    useState<string | null>(
      initialLink?.expiresAt.toISOString() ?? null,
    );

  const [generatedUrl, setGeneratedUrl] =
    useState<string | null>(null);

  const [working, setWorking] = useState(false);
  const [message, setMessage] =
    useState<string | null>(null);

  async function handleGenerate() {
    setWorking(true);
    setMessage(null);

    try {
      const result =
        await generateGuestCheckInLinkAction(bookingId);

      setGeneratedUrl(result.url);
      setExpiresAt(result.expiresAt);
      setStatus("ACTIVE");

      setMessage(
        "Link schedina generato. Ora puoi copiarlo e condividerlo.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Impossibile generare il link schedina.",
      );
    } finally {
      setWorking(false);
    }
  }

  async function handleSendEmail() {
    setWorking(true);
    setMessage(null);

    try {
      const result =
        await sendGuestCheckInEmailAction(bookingId);

      setGeneratedUrl(null);
      setExpiresAt(result.expiresAt);
      setStatus("ACTIVE");

      setMessage(
        `Email schedina inviata a ${guestEmail}. Il precedente link, se presente, è stato invalidato.`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Impossibile inviare l'email schedina.",
      );
    } finally {
      setWorking(false);
    }
  }

  async function handleVerifyAlloggiati() {
    setWorking(true);
    setMessage(null);

    try {
      const result =
        await verifyGuestCheckInWithAlloggiatiAction(
          bookingId,
        );

      setMessage(
        `Verifica Alloggiati Web superata. Nessun dato è stato inviato. ${result.message}`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Verifica Alloggiati Web non riuscita.",
      );
    } finally {
      setWorking(false);
    }
  }

  async function handleSubmitAlloggiati() {
    const confirmed = window.confirm(
      "Stai per trasmettere realmente le schedine ad Alloggiati Web della Polizia di Stato. Confermi l'invio?",
    );

    if (!confirmed) return;

    setWorking(true);
    setMessage(null);

    try {
      await enqueueGuestCheckInAlloggiatiSubmissionAction(
        bookingId,
      );

      setMessage(
        "Invio Alloggiati Web accodato. Horizon eseguirà una nuova verifica prima della trasmissione.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Impossibile accodare l'invio Alloggiati Web.",
      );
    } finally {
      setWorking(false);
    }
  }

  async function handleCopy() {
    if (!generatedUrl) return;

    const copied = await copyToClipboard(generatedUrl);

    setMessage(
      copied
        ? "Link copiato negli appunti."
        : "Copia automatica non riuscita. Seleziona il link manualmente.",
    );
  }

  async function handleRevoke() {
    setWorking(true);
    setMessage(null);

    try {
      await revokeGuestCheckInLinkAction(bookingId);

      setGeneratedUrl(null);
      setStatus("REVOKED");
      setMessage("Link schedina revocato.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Impossibile revocare il link schedina.",
      );
    } finally {
      setWorking(false);
    }
  }

  const registrationLabel =
    guestRegistration.status === "SENT"
      ? "Inviata"
      : guestRegistration.status === "READY"
        ? "Pronta invio"
        : guestRegistration.status === "SENDING"
          ? "Invio in corso"
          : guestRegistration.status === "PARTIAL"
            ? "Invio parziale"
            : guestRegistration.status ===
                "OUTCOME_UNKNOWN"
              ? "Esito da verificare"
              : guestRegistration.status === "REJECTED"
                ? "Errore invio"
                : "Da compilare";

  const registrationDescription =
    guestRegistration.status === "SENT"
      ? "Dati ospiti confermati da Alloggiati Web."
      : guestRegistration.status === "READY"
        ? "Dati completi e pronti per Alloggiati Web."
        : guestRegistration.status === "SENDING"
          ? "Trasmissione ad Alloggiati Web in corso."
          : guestRegistration.status === "PARTIAL"
            ? "Alloggiati Web ha confermato solo parte dei dati."
            : guestRegistration.status ===
                "OUTCOME_UNKNOWN"
              ? "Esito della trasmissione da verificare."
              : guestRegistration.status === "REJECTED"
                ? "Trasmissione rifiutata da Alloggiati Web."
                : "In attesa della compilazione degli ospiti.";

  const statusLabel =
    status === "ACTIVE"
      ? "Attivo"
      : status === "REVOKED"
        ? "Revocato"
        : status === "EXPIRED"
          ? "Scaduto"
          : "Non generato";

  const isGuestRegistrationComplete =
    guestRegistration.status === "READY" &&
    guestRegistration.completedGuests ===
      guestRegistration.expectedGuests;

  return (
    <Panel
      dark
      padding="sm"
      tone={
        status === "ACTIVE" &&
        !isGuestRegistrationComplete
          ? "success"
          : "default"
      }
    >
      <SectionTitle
        compact
        title="Check-in & Alloggiati"
        subtitle={
          isGuestRegistrationComplete
            ? "Ospiti completati. La prenotazione è pronta per la gestione Alloggiati Web."
            : "Raccogli i dati ospiti e gestisci la trasmissione da un unico punto."
        }
      />

      <div style={contentStyle}>
        <div style={commandBarStyle}>
          <div style={metricsStyle}>
            <Metric
              label="Schedina"
              value={registrationLabel}
            />

            <Metric
              label="Ospiti"
              value={`${guestRegistration.completedGuests} / ${guestRegistration.expectedGuests}`}
            />

            <Metric
              label="Link"
              value={
                isGuestRegistrationComplete
                  ? "Chiuso"
                  : statusLabel
              }
            />
          </div>

          <div style={actionsStyle}>
            {canSubmitToAlloggiati &&
            guestRegistration.status === "READY" ? (
              <ActionButton
                label="Verifica"
                variant="secondary"
                compact
                disabled={working}
                onClick={() =>
                  void handleVerifyAlloggiati()
                }
              />
            ) : null}

            {canSubmitToAlloggiati &&
            guestRegistration.status === "READY" ? (
              <ActionButton
                label="Invia ad Alloggiati Web"
                compact
                disabled={working}
                onClick={() =>
                  void handleSubmitAlloggiati()
                }
              />
            ) : null}

            {!isGuestRegistrationComplete &&
            guestEmail ? (
              <ActionButton
                label="Invia email"
                variant="secondary"
                compact
                disabled={working}
                onClick={() =>
                  void handleSendEmail()
                }
              />
            ) : null}

            {!isGuestRegistrationComplete ? (
              <ActionButton
                label={
                  status === "ACTIVE"
                    ? "Rigenera link"
                    : "Genera link"
                }
                variant={
                  guestEmail ? "secondary" : "primary"
                }
                compact
                disabled={working}
                onClick={() => void handleGenerate()}
              />
            ) : null}

            {!isGuestRegistrationComplete &&
            status === "ACTIVE" ? (
              <ActionButton
                label="Revoca"
                variant="danger"
                compact
                disabled={working}
                onClick={() => void handleRevoke()}
              />
            ) : null}
          </div>
        </div>

        <div style={contextRowStyle}>
          <span>{registrationDescription}</span>

          {!isGuestRegistrationComplete &&
          expiresAt ? (
            <span>
              Link fino al{" "}
              {new Date(expiresAt).toLocaleString(
                "it-IT",
              )}
            </span>
          ) : null}

          {!isGuestRegistrationComplete &&
          guestEmail ? (
            <span>{guestEmail}</span>
          ) : null}
        </div>

        {!isGuestRegistrationComplete &&
        generatedUrl ? (
          <div style={linkRowStyle}>
            <span style={urlStyle}>
              {generatedUrl}
            </span>

            <ActionButton
              label="Copia link"
              variant="secondary"
              compact
              onClick={() => void handleCopy()}
            />
          </div>
        ) : null}

        {guestRegistration.lastError &&
        (guestRegistration.status === "REJECTED" ||
          guestRegistration.status ===
            "OUTCOME_UNKNOWN" ||
          guestRegistration.status === "PARTIAL") ? (
          <p style={warningStyle}>
            {guestRegistration.lastError}
          </p>
        ) : null}

        {!isGuestRegistrationComplete &&
        status === "ACTIVE" &&
        !generatedUrl ? (
          <p style={noteStyle}>
            Per sicurezza Horizon non conserva il token in
            chiaro. Per condividerlo manualmente,
            rigenera il link: il precedente verrà
            invalidato.
          </p>
        ) : null}

        {message ? (
          <p style={messageStyle}>{message}</p>
        ) : null}
      </div>
    </Panel>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={metricStyle}>
      <span style={metricLabelStyle}>{label}</span>
      <strong style={metricValueStyle}>
        {value}
      </strong>
    </div>
  );
}

const contentStyle = {
  display: "grid",
  gap: uiTokens.spacing.xs,
};

const commandBarStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "wrap" as const,
  gap: uiTokens.spacing.sm,
  padding: "9px 11px",
  borderRadius: uiTokens.radius.md,
  background: uiTokens.colors.primary,
};

const metricsStyle = {
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap" as const,
  gap: "10px 34px",
  flex: "1 1 360px",
};

const metricStyle = {
  display: "grid",
  gap: "2px",
  minWidth: "100px",
};

const metricLabelStyle = {
  color: "#64748b",
  fontSize: uiTokens.fontSize.xs,
  lineHeight: 1.1,
};

const metricValueStyle = {
  color: uiTokens.colors.primaryText,
  fontSize: uiTokens.fontSize.sm,
  lineHeight: 1.2,
};

const actionsStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  flexWrap: "wrap" as const,
  gap: uiTokens.spacing.xs,
};

const contextRowStyle = {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: "4px 18px",
  color: "#94a3b8",
  fontSize: uiTokens.fontSize.xs,
  lineHeight: 1.35,
};

const linkRowStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: uiTokens.spacing.sm,
  padding: "7px 10px",
  borderRadius: uiTokens.radius.md,
  background: uiTokens.colors.primary,
};

const urlStyle = {
  minWidth: 0,
  overflowWrap: "anywhere" as const,
  color: "#94a3b8",
  fontSize: uiTokens.fontSize.xs,
};

const noteStyle = {
  margin: 0,
  color: "#64748b",
  fontSize: uiTokens.fontSize.xs,
  lineHeight: 1.35,
};

const warningStyle = {
  margin: 0,
  color: "#fca5a5",
  fontSize: uiTokens.fontSize.xs,
  lineHeight: 1.35,
};

const messageStyle = {
  margin: 0,
  color: "#94a3b8",
  fontSize: uiTokens.fontSize.xs,
  lineHeight: 1.35,
};
