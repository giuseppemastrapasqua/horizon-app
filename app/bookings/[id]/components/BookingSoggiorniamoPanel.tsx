"use client";

import { useState } from "react";

import { ActionButton } from "@/components/ui/ActionButton";
import { Panel } from "@/components/ui/Panel";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { uiTokens } from "@/components/ui/tokens";

import { applyManualSoggiorniamoFiscalDecisionAction } from "../soggiorniamo-actions";
import { BookingTouristTaxPaymentControl } from "./BookingTouristTaxPaymentControl";

type FiscalClassification = {
  guestTypeCode: number | null;
  tariff: number | null;
  taxAmount: number | null;
  intermediary: string | null;
  source: "AUTO" | "MANUAL";
  status: "CLASSIFIED" | "REVIEW_REQUIRED";
  reason: string;
} | null;

type SoggiorniamoGuest = {
  id: string;
  firstName: string;
  lastName: string;
  fiscalClassification: FiscalClassification;
};

type BookingSoggiorniamoPanelProps = {
  guests: SoggiorniamoGuest[];
};

type ManualGuestTypeCode = "1" | "9" | "14";

type ManualDraft = {
  guestTypeCode: ManualGuestTypeCode;
  intermediary: string;
  tariff: string;
  taxAmount: string;
};

function createDefaultDraft(): ManualDraft {
  return {
    guestTypeCode: "1",
    intermediary: "",
    tariff: "0",
    taxAmount: "0",
  };
}

function createDraftFromClassification(
  classification: FiscalClassification,
): ManualDraft {
  const supportedCode =
    classification?.guestTypeCode === 9 ||
    classification?.guestTypeCode === 14
      ? String(classification.guestTypeCode)
      : "1";

  return {
    guestTypeCode: supportedCode as ManualGuestTypeCode,
    intermediary: classification?.intermediary ?? "",
    tariff:
      classification?.tariff !== null &&
      classification?.tariff !== undefined
        ? String(classification.tariff)
        : "0",
    taxAmount:
      classification?.taxAmount !== null &&
      classification?.taxAmount !== undefined
        ? String(classification.taxAmount)
        : "0",
  };
}

function classificationLabel(
  classification: FiscalClassification,
) {
  if (
    !classification ||
    classification.status === "REVIEW_REQUIRED"
  ) {
    return "Da revisionare";
  }

  if (classification.source === "MANUAL") {
    return "Classificato manualmente";
  }

  return "Classificato automaticamente";
}

function guestTypeLabel(code: number | null) {
  if (code === 1) return "1 · Tariffa ordinaria";
  if (code === 2) return "2 · Minore di 18 anni";
  if (code === 9) {
    return "9 · Esenzione disabilità / accompagnatore";
  }
  if (code === 13) {
    return "13 · Residente nel Comune di Milano";
  }
  if (code === 14) {
    return "14 · Incassato da portale / intermediario";
  }

  return code === null ? "Non definita" : `Codice ${code}`;
}

function money(value: number | null) {
  if (value === null) return "—";

  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

export function BookingSoggiorniamoPanel({
  guests,
}: BookingSoggiorniamoPanelProps) {
  const [workingGuestId, setWorkingGuestId] =
    useState<string | null>(null);

  const [editingGuestId, setEditingGuestId] =
    useState<string | null>(null);

  const [message, setMessage] =
    useState<string | null>(null);

  const [drafts, setDrafts] =
    useState<Record<string, ManualDraft>>({});

  function getDraft(guestId: string) {
    return drafts[guestId] ?? createDefaultDraft();
  }

  function updateDraft(
    guestId: string,
    patch: Partial<ManualDraft>,
  ) {
    setDrafts((current) => ({
      ...current,
      [guestId]: {
        ...(current[guestId] ?? createDefaultDraft()),
        ...patch,
      },
    }));
  }

  function startEditing(
    guestId: string,
    classification: FiscalClassification,
  ) {
    setDrafts((current) => ({
      ...current,
      [guestId]: createDraftFromClassification(classification),
    }));

    setMessage(null);
    setEditingGuestId(guestId);
  }

  function cancelEditing() {
    setMessage(null);
    setEditingGuestId(null);
  }

  async function handleSave(guestId: string) {
    const draft = getDraft(guestId);
    const guestTypeCode = Number(draft.guestTypeCode);

    setWorkingGuestId(guestId);
    setMessage(null);

    try {
      const explicitValues =
        guestTypeCode === 1
          ? {}
          : {
              tariff: Number(draft.tariff),
              taxAmount: Number(draft.taxAmount),
            };

      await applyManualSoggiorniamoFiscalDecisionAction({
        bookingGuestId: guestId,
        guestTypeCode,
        intermediary:
          guestTypeCode === 14
            ? draft.intermediary
            : null,
        ...explicitValues,
      });

      setEditingGuestId(null);
      setMessage(
        "Classificazione fiscale Soggiorniamo salvata.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Impossibile salvare la classificazione Soggiorniamo.",
      );
    } finally {
      setWorkingGuestId(null);
    }
  }

  const classifiedCount = guests.filter(
    (guest) =>
      guest.fiscalClassification?.status === "CLASSIFIED",
  ).length;

  const reviewCount = guests.length - classifiedCount;

  const totalTax = guests.reduce((total, guest) => {
    const classification = guest.fiscalClassification;

    if (
      classification?.status !== "CLASSIFIED" ||
      classification.taxAmount === null
    ) {
      return total;
    }

    return total + classification.taxAmount;
  }, 0);

  return (
    <Panel
      dark
      padding="sm"
      tone={reviewCount === 0 ? "success" : "default"}
    >
      <SectionTitle
        compact
        title="Soggiorniamo"
        subtitle={
          guests.length === 0
            ? "Nessun ospite disponibile per la classificazione fiscale."
            : reviewCount === 0
              ? "Gestione imposta di soggiorno per tutti gli ospiti."
              : `${reviewCount} ${
                  reviewCount === 1
                    ? "ospite richiede"
                    : "ospiti richiedono"
                } una decisione fiscale.`
        }
      />

      <div style={contentStyle}>
        <div style={overviewStyle}>
          <div style={metricsStyle}>
            <div style={metricStyle}>
              <span style={metricLabelStyle}>
                Classificazione
              </span>

              <strong style={metricValueStyle}>
                {classifiedCount} / {guests.length} classificati
              </strong>
            </div>

            <div style={metricStyle}>
              <span style={metricLabelStyle}>
                Imposta totale
              </span>

              <strong style={taxValueStyle}>
                {reviewCount === 0
                  ? money(totalTax)
                  : "Da definire"}
              </strong>
            </div>
          </div>

          <div style={paymentStyle}>
            <BookingTouristTaxPaymentControl
              enabled={
                guests.length > 0 &&
                reviewCount === 0 &&
                totalTax > 0
              }
            />
          </div>
        </div>

        <div style={guestListStyle}>
          {guests.map((guest) => {
            const classification =
              guest.fiscalClassification;

            const requiresReview =
              !classification ||
              classification.status === "REVIEW_REQUIRED";

            const isEditing =
              editingGuestId === guest.id;

            const showEditor =
              requiresReview || isEditing;

            const draft = getDraft(guest.id);
            const code = Number(draft.guestTypeCode);

            return (
              <div
                key={guest.id}
                style={
                  showEditor
                    ? editorRowStyle
                    : guestRowStyle
                }
              >
                {!showEditor && classification ? (
                  <>
                    <div style={guestIdentityStyle}>
                      <strong style={guestNameStyle}>
                        {guest.firstName} {guest.lastName}
                      </strong>

                      <span style={secondaryTextStyle}>
                        {classificationLabel(classification)}
                      </span>
                    </div>

                    <div style={guestDetailStyle}>
                      <span style={detailLabelStyle}>
                        Categoria
                      </span>

                      <strong style={detailValueStyle}>
                        {guestTypeLabel(
                          classification.guestTypeCode,
                        )}
                      </strong>
                    </div>

                    <div style={guestDetailStyle}>
                      <span style={detailLabelStyle}>
                        Tariffa
                      </span>

                      <strong style={detailValueStyle}>
                        {money(classification.tariff)}
                      </strong>
                    </div>

                    <div style={guestDetailStyle}>
                      <span style={detailLabelStyle}>
                        Imposta
                      </span>

                      <strong style={detailValueStyle}>
                        {money(classification.taxAmount)}
                      </strong>
                    </div>

                    <div style={guestDetailStyle}>
                      <span style={detailLabelStyle}>
                        Fonte
                      </span>

                      <strong style={detailValueStyle}>
                        {classification.source === "MANUAL"
                          ? "MANUALE"
                          : "AUTOMATICA"}
                      </strong>
                    </div>

                    <div style={actionStyle}>
                      {classification.source === "MANUAL" ? (
                        <ActionButton
                          label="Modifica"
                          variant="secondary"
                          compact
                          disabled={workingGuestId !== null}
                          onClick={() =>
                            startEditing(
                              guest.id,
                              classification,
                            )
                          }
                        />
                      ) : null}
                    </div>
                  </>
                ) : (
                  <div style={editorStyle}>
                    <div>
                      <strong style={guestNameStyle}>
                        {guest.firstName} {guest.lastName}
                      </strong>

                      <span style={secondaryTextStyle}>
                        {classificationLabel(classification)}
                      </span>
                    </div>

                    <div style={editorFieldsStyle}>
                      <label style={fieldStyle}>
                        Categoria fiscale

                        <select
                          value={draft.guestTypeCode}
                          disabled={
                            workingGuestId === guest.id
                          }
                          onChange={(event) =>
                            updateDraft(guest.id, {
                              guestTypeCode:
                                event.target
                                  .value as ManualGuestTypeCode,
                            })
                          }
                          style={inputStyle}
                        >
                          <option value="1">
                            1 · Tariffa ordinaria
                          </option>

                          <option value="14">
                            14 · Incassato da portale / intermediario
                          </option>

                          <option value="9">
                            9 · Esenzione disabilità / accompagnatore
                          </option>
                        </select>
                      </label>

                      {code === 14 ? (
                        <label style={fieldStyle}>
                          Intermediario

                          <input
                            type="text"
                            value={draft.intermediary}
                            disabled={
                              workingGuestId === guest.id
                            }
                            onChange={(event) =>
                              updateDraft(guest.id, {
                                intermediary:
                                  event.target.value,
                              })
                            }
                            style={inputStyle}
                          />
                        </label>
                      ) : null}

                      {code !== 1 ? (
                        <>
                          <label style={fieldStyle}>
                            Tariffa €

                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={draft.tariff}
                              disabled={
                                workingGuestId === guest.id
                              }
                              onChange={(event) =>
                                updateDraft(guest.id, {
                                  tariff:
                                    event.target.value,
                                })
                              }
                              style={inputStyle}
                            />
                          </label>

                          <label style={fieldStyle}>
                            Imposta €

                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={draft.taxAmount}
                              disabled={
                                workingGuestId === guest.id
                              }
                              onChange={(event) =>
                                updateDraft(guest.id, {
                                  taxAmount:
                                    event.target.value,
                                })
                              }
                              style={inputStyle}
                            />
                          </label>
                        </>
                      ) : (
                        <div style={ordinaryInfoStyle}>
                          Horizon calcola tariffa e imposta
                          dalle date della prenotazione.
                        </div>
                      )}
                    </div>

                    <div style={editorActionsStyle}>
                      <ActionButton
                        label={
                          workingGuestId === guest.id
                            ? "Salvataggio..."
                            : "Conferma classificazione"
                        }
                        disabled={workingGuestId !== null}
                        onClick={() =>
                          void handleSave(guest.id)
                        }
                      />

                      {isEditing ? (
                        <ActionButton
                          label="Annulla"
                          variant="secondary"
                          disabled={workingGuestId !== null}
                          onClick={cancelEditing}
                        />
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {message ? (
          <p style={messageStyle}>{message}</p>
        ) : null}
      </div>
    </Panel>
  );
}

const contentStyle = {
  display: "grid",
  gap: uiTokens.spacing.xs,
};

const overviewStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "wrap" as const,
  gap: uiTokens.spacing.sm,
  padding: "7px 10px",
  borderRadius: uiTokens.radius.md,
  background: uiTokens.colors.primary,
};

const metricsStyle = {
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap" as const,
  gap: "10px 34px",
  flex: "1 1 340px",
};

const metricStyle = {
  display: "grid",
  gap: "2px",
  minWidth: "145px",
};

const metricLabelStyle = {
  color: "#94a3b8",
  fontSize: uiTokens.fontSize.xs,
  lineHeight: 1.2,
};

const metricValueStyle = {
  color: uiTokens.colors.primaryText,
  fontSize: uiTokens.fontSize.sm,
  lineHeight: 1.2,
};

const taxValueStyle = {
  color: uiTokens.colors.primaryText,
  fontSize: uiTokens.fontSize.lg,
  lineHeight: 1.1,
};

const paymentStyle = {
  flex: "1 1 360px",
  minWidth: 0,
};

const guestListStyle = {
  display: "grid",
  gap: "4px",
};

const guestRowStyle = {
  display: "grid",
  gridTemplateColumns:
    "minmax(145px, 1.25fr) minmax(190px, 1.65fr) minmax(72px, .55fr) minmax(72px, .55fr) minmax(80px, .6fr) auto",
  alignItems: "center",
  gap: "6px 10px",
  padding: "6px 10px",
  borderRadius: uiTokens.radius.md,
  background: uiTokens.colors.primary,
};

const editorRowStyle = {
  padding: "10px",
  borderRadius: uiTokens.radius.md,
  background: uiTokens.colors.primary,
};

const guestIdentityStyle = {
  minWidth: 0,
};

const guestNameStyle = {
  display: "block",
  color: uiTokens.colors.primaryText,
  fontSize: uiTokens.fontSize.sm,
  lineHeight: 1.2,
};

const secondaryTextStyle = {
  display: "block",
  marginTop: "1px",
  color: "#94a3b8",
  fontSize: uiTokens.fontSize.xs,
  lineHeight: 1.2,
};

const guestDetailStyle = {
  display: "grid",
  gap: "1px",
  minWidth: 0,
};

const detailLabelStyle = {
  color: "#64748b",
  fontSize: uiTokens.fontSize.xs,
  lineHeight: 1.1,
};

const detailValueStyle = {
  color: uiTokens.colors.primaryText,
  fontSize: uiTokens.fontSize.sm,
  fontWeight: uiTokens.fontWeight.strong,
  lineHeight: 1.2,
};

const actionStyle = {
  display: "flex",
  justifyContent: "flex-end",
};

const editorStyle = {
  display: "grid",
  gap: uiTokens.spacing.sm,
};

const editorFieldsStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(170px, 1fr))",
  alignItems: "end",
  gap: uiTokens.spacing.sm,
};

const fieldStyle = {
  display: "grid",
  gap: uiTokens.spacing.xs,
  color: "#94a3b8",
  fontSize: uiTokens.fontSize.sm,
};

const inputStyle = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: uiTokens.radius.md,
};

const ordinaryInfoStyle = {
  color: "#94a3b8",
  fontSize: uiTokens.fontSize.sm,
};

const editorActionsStyle = {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: uiTokens.spacing.sm,
};

const messageStyle = {
  margin: 0,
  color: "#94a3b8",
  fontSize: uiTokens.fontSize.xs,
};