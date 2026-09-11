"use client";

import { useState } from "react";

import { ActionButton } from "@/components/ui/ActionButton";
import { Panel } from "@/components/ui/Panel";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { uiTokens } from "@/components/ui/tokens";

import {
  generateGuestCheckInLinkAction,
  revokeGuestCheckInLinkAction,
  sendGuestCheckInEmailAction,
} from "../guest-check-in-actions";

type GuestCheckInLinkStatus = "ACTIVE" | "REVOKED" | "EXPIRED";

type BookingGuestCheckInPanelProps = {
  bookingId: string;
  guestEmail: string | null;
  guestRegistration: {
    status: "TO_COMPLETE" | "READY" | "SENDING" | "SENT" | "PARTIAL" | "OUTCOME_UNKNOWN" | "REJECTED";
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
  const [status, setStatus] = useState<GuestCheckInLinkStatus | "NONE">(
    initialLink?.status ?? "NONE",
  );
  const [expiresAt, setExpiresAt] = useState<string | null>(
    initialLink?.expiresAt.toISOString() ?? null,
  );
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleGenerate() {
    setWorking(true);
    setMessage(null);

    try {
      const result = await generateGuestCheckInLinkAction(bookingId);
      setGeneratedUrl(result.url);
      setExpiresAt(result.expiresAt);
      setStatus("ACTIVE");
      setMessage("Link schedina generato. Ora puoi copiarlo e condividerlo.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Impossibile generare il link schedina.");
    } finally {
      setWorking(false);
    }
  }

  async function handleSendEmail() {
    setWorking(true);
    setMessage(null);

    try {
      const result = await sendGuestCheckInEmailAction(bookingId);
      setGeneratedUrl(null);
      setExpiresAt(result.expiresAt);
      setStatus("ACTIVE");
      setMessage(`Email schedina inviata a ${guestEmail}. Il precedente link, se presente, è stato invalidato.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Impossibile inviare l email schedina.");
    } finally {
      setWorking(false);
    }
  }

  async function handleCopy() {
    if (!generatedUrl) return;

    try {
      await navigator.clipboard.writeText(generatedUrl);
      setMessage("Link copiato negli appunti.");
    } catch {
      setMessage("Copia automatica non riuscita. Seleziona il link manualmente.");
    }
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
      setMessage(error instanceof Error ? error.message : "Impossibile revocare il link schedina.");
    } finally {
      setWorking(false);
    }
  }

  const registrationLabel =
    guestRegistration.status === "SENT" ? "Inviata"
      : guestRegistration.status === "READY" ? "Pronta invio"
        : guestRegistration.status === "SENDING" ? "Invio in corso"
          : guestRegistration.status === "PARTIAL" ? "Invio parziale"
            : guestRegistration.status === "OUTCOME_UNKNOWN" ? "Esito da verificare"
              : guestRegistration.status === "REJECTED" ? "Errore invio"
                : "Da compilare";

  const registrationDescription =
    guestRegistration.status === "SENT" ? "I dati ospiti risultano confermati da Alloggiati Web."
      : guestRegistration.status === "READY" ? "I dati ospiti sono completi e pronti per l invio ad Alloggiati Web."
        : guestRegistration.status === "SENDING" ? "La trasmissione ad Alloggiati Web è in preparazione o in corso."
          : guestRegistration.status === "PARTIAL" ? "Alloggiati Web ha confermato solo una parte dei dati trasmessi."
            : guestRegistration.status === "OUTCOME_UNKNOWN" ? "L esito della trasmissione non è certo e richiede verifica."
              : guestRegistration.status === "REJECTED" ? "La trasmissione è stata rifiutata e richiede un nuovo controllo."
                : "I dati ospiti devono ancora essere compilati completamente.";
  const statusLabel =
    status === "ACTIVE"
      ? "Link attivo"
      : status === "REVOKED"
        ? "Link revocato"
        : status === "EXPIRED"
          ? "Link scaduto"
          : "Link non generato";

  return (
    <Panel tone={status === "ACTIVE" ? "success" : "default"}>
      <SectionTitle
        title="Schedina ospiti"
        subtitle="Invia il modulo via email oppure genera il link sicuro da condividere manualmente."
      />

      <div style={{ display: "grid", gap: uiTokens.spacing.md }}>
        <div style={{ padding: uiTokens.spacing.md, border: `1px solid ${uiTokens.colors.border}`, borderRadius: uiTokens.radius.lg, background: uiTokens.colors.surfaceSoft }}>
          <p style={{ margin: 0, color: uiTokens.colors.textMuted, fontSize: uiTokens.fontSize.sm }}>Stato schedina</p>
          <strong style={{ display: "block", marginTop: uiTokens.spacing.xs, color: uiTokens.colors.textPrimary }}>{registrationLabel}</strong>
          <p style={{ margin: `${uiTokens.spacing.xs} 0 0`, color: uiTokens.colors.textMuted, fontSize: uiTokens.fontSize.sm }}>{registrationDescription}</p>
          <p style={{ margin: `${uiTokens.spacing.xs} 0 0`, color: uiTokens.colors.textMuted, fontSize: uiTokens.fontSize.sm }}>
            Ospiti compilati: {guestRegistration.completedGuests} / {guestRegistration.expectedGuests}
          </p>
          {guestRegistration.lastError && (guestRegistration.status === "REJECTED" || guestRegistration.status === "OUTCOME_UNKNOWN" || guestRegistration.status === "PARTIAL") ? (
            <p style={{ margin: `${uiTokens.spacing.xs} 0 0`, color: uiTokens.colors.textMuted, fontSize: uiTokens.fontSize.sm }}>
              Dettaglio: {guestRegistration.lastError}
            </p>
          ) : null}
        </div>

        <div>
          <p style={{ margin: 0, color: uiTokens.colors.textMuted, fontSize: uiTokens.fontSize.sm }}>Stato link</p>
          <strong style={{ display: "block", marginTop: uiTokens.spacing.xs, color: uiTokens.colors.textPrimary }}>{statusLabel}</strong>
          {expiresAt ? (
            <p style={{ margin: `${uiTokens.spacing.xs} 0 0`, color: uiTokens.colors.textMuted, fontSize: uiTokens.fontSize.sm }}>
              Scadenza: {new Date(expiresAt).toLocaleString("it-IT")}
            </p>
          ) : null}
        </div>

        <p style={{ margin: 0, color: uiTokens.colors.textMuted, fontSize: uiTokens.fontSize.sm }}>
          {guestEmail
            ? `Email ospite: ${guestEmail}`
            : "Email ospite non disponibile. Genera il link e condividilo manualmente via WhatsApp, SMS o altro canale."}
        </p>

        {generatedUrl ? (
          <div style={{ display: "grid", gap: uiTokens.spacing.sm, padding: uiTokens.spacing.md, border: `1px solid ${uiTokens.colors.border}`, borderRadius: uiTokens.radius.lg, background: uiTokens.colors.surfaceSoft }}>
            <span style={{ overflowWrap: "anywhere", color: uiTokens.colors.textMuted, fontSize: uiTokens.fontSize.sm }}>
              {generatedUrl}
            </span>
            <div>
              <ActionButton label="Copia link" variant="secondary" compact onClick={() => void handleCopy()} />
            </div>
          </div>
        ) : null}

        <div style={{ display: "flex", flexWrap: "wrap", gap: uiTokens.spacing.sm }}>
          {guestEmail ? (
            <ActionButton
              label="Invia email"
              disabled={working}
              onClick={() => void handleSendEmail()}
            />
          ) : null}

          <ActionButton
            label={status === "ACTIVE" ? "Rigenera link" : "Genera link"}
            variant={guestEmail ? "secondary" : "primary"}
            disabled={working}
            onClick={() => void handleGenerate()}
          />

          {status === "ACTIVE" ? (
            <ActionButton
              label="Revoca link"
              variant="danger"
              disabled={working}
              onClick={() => void handleRevoke()}
            />
          ) : null}
        </div>

        {status === "ACTIVE" && !generatedUrl ? (
          <p style={{ margin: 0, color: uiTokens.colors.textMuted, fontSize: uiTokens.fontSize.sm }}>
            Per sicurezza Horizon non conserva il token in chiaro. Per condividere manualmente il link, rigeneralo: il precedente verrà invalidato.
          </p>
        ) : null}

        {message ? (
          <p style={{ margin: 0, color: uiTokens.colors.textMuted, fontSize: uiTokens.fontSize.sm }}>
            {message}
          </p>
        ) : null}
      </div>
    </Panel>
  );
}
