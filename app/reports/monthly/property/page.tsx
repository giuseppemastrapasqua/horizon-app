import type { CSSProperties } from "react";

import Link from "next/link";

import {
  generateFinanceReportAction,
  generateFinanceReportsBatchAction,
} from "@/app/reports/monthly/property/actions";
import { AppShell } from "@/components/AppShell";
import { FinancePreview } from "@/components/finance/FinancePreview";
import { Navigation } from "@/components/Navigation";
import { prisma } from "@/lib/prisma";
import {
  buildFinancePreview,
} from "@/lib/finance/preview";

type PropertyReportPageProps = {
  searchParams: Promise<{
    propertyId?: string | string[];
    referenceMonth?: string | string[];
  }>;
};

type FinancePreviewData = Awaited<
  ReturnType<typeof buildFinancePreview>
>;

export default async function PropertyReportPage({
  searchParams,
}: PropertyReportPageProps) {
  const resolvedSearchParams =
    await searchParams;

  const propertyIdValue =
    resolvedSearchParams.propertyId;

  const propertyId =
    typeof propertyIdValue === "string"
      ? propertyIdValue.trim()
      : "";

  const referenceMonthValue =
    resolvedSearchParams.referenceMonth;

  const referenceMonth =
    normalizeReferenceMonth(
      typeof referenceMonthValue === "string"
        ? referenceMonthValue
        : undefined
    );

  if (!propertyId) {
    const properties =
      await prisma.property.findMany({
        where: {
          status: {
            not: "ARCHIVED",
          },
        },

        orderBy: {
          name: "asc",
        },

        select: {
          id: true,
          name: true,
          city: true,
        },
      });

    return (
      <>
        <Navigation />

        <AppShell
          title="Genera rendiconti"
          subtitle="Scegli il mese e la struttura."
        >
          <section
            style={{
              maxWidth: "640px",
              margin: "0 auto",
              border: "1px solid #e2e8f0",
              borderRadius: "22px",
              background: "#ffffff",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "28px 32px",
                borderBottom: "1px solid #e2e8f0",
                background: "#f8fafc",
              }}
            >
              <div
                style={{
                  color: "#2563eb",
                  fontSize: "11px",
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                }}
              >
                FINANCE
              </div>

              <h2
                style={{
                  margin: "6px 0 0",
                  color: "#0f172a",
                  fontSize: "25px",
                }}
              >
                Genera rendiconti
              </h2>

              <p
                style={{
                  margin: "8px 0 0",
                  color: "#64748b",
                  lineHeight: 1.6,
                }}
              >
                Scegli il mese e se generare un rendiconto
                per tutte le strutture oppure per una sola.
              </p>
            </div>

            <form
              action={
                generateFinanceReportsBatchAction
              }
              style={{
                display: "grid",
                gap: "24px",
                padding: "32px",
              }}
            >
              <label>
                <span
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    color: "#334155",
                    fontSize: "14px",
                    fontWeight: 700,
                  }}
                >
                  Mese
                </span>

                <input
                  name="referenceMonth"
                  type="month"
                  required
                  defaultValue={
                    referenceMonth
                  }
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "13px 14px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "12px",
                    background: "#ffffff",
                    color: "#0f172a",
                    fontSize: "15px",
                  }}
                />
              </label>

              <label>
                <span
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    color: "#334155",
                    fontSize: "14px",
                    fontWeight: 700,
                  }}
                >
                  Struttura
                </span>

                <select
                  name="targetProperty"
                  required
                  defaultValue="ALL"
                  style={{
                    width: "100%",
                    padding: "13px 14px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "12px",
                    background: "#ffffff",
                    color: "#0f172a",
                    fontSize: "15px",
                  }}
                >
                  <option value="ALL">
                    Tutte le strutture
                  </option>

                  {properties.map(
                    (property) => (
                      <option
                        key={property.id}
                        value={property.id}
                      >
                        {property.name}
                        {property.city
                          ? ` · ${property.city}`
                          : ""}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                  paddingTop: "18px",
                  borderTop: "1px solid #e2e8f0",
                }}
              >
                <Link
                  href="/reports/finance"
                  style={secondaryLinkStyle}
                >
                  Annulla
                </Link>

                <button
                  type="submit"
                  style={generateButtonStyle}
                >
                  Genera rendiconti
                </button>
              </div>
            </form>
          </section>
        </AppShell>
      </>
    );
  }
  const monthStart =
    parseReferenceMonth(referenceMonth);

  let preview: FinancePreviewData | null =
    null;

  let previewError: string | null = null;

  try {
    preview =
      await buildFinancePreview({
        propertyId,
        referenceMonth: monthStart,
      });
  } catch (error) {
    previewError =
      error instanceof Error
        ? error.message
        : "Si è verificato un errore durante la preparazione del rendiconto.";
  }

  if (!preview) {
    const retryHref =
      `/reports/monthly/property` +
      `?propertyId=${encodeURIComponent(
        propertyId
      )}` +
      `&referenceMonth=${encodeURIComponent(
        referenceMonth
      )}`;

    return (
      <>
        <Navigation />

        <AppShell
          title="Rendiconto immobile"
          subtitle={`Periodo selezionato: ${formatMonth(
            monthStart
          )}`}
        >
          <section style={errorStateStyle}>
            <div style={errorIconStyle}>
              !
            </div>

            <div>
              <h2 style={errorTitleStyle}>
                Impossibile preparare il rendiconto
              </h2>

              <p style={errorDescriptionStyle}>
                {previewError ??
                  "I dati necessari al rendiconto non sono disponibili."}
              </p>
            </div>

            <div style={errorActionsStyle}>
              <Link
                href={retryHref}
                style={primaryLinkStyle}
              >
                Riprova
              </Link>

              <Link
                href={`/properties/${propertyId}`}
                style={secondaryLinkStyle}
              >
                Torna all’immobile
              </Link>

              <Link
                href="/properties"
                style={secondaryLinkStyle}
              >
                Tutti gli immobili
              </Link>
            </div>
          </section>
        </AppShell>
      </>
    );
  }

  const {
    property,
    owner,
    formula,
    calculation,
  } = preview;

  return (
    <>
      <Navigation />

      <AppShell
        title={`Rendiconto · ${property.name}`}
        subtitle={`${property.address}, ${
          property.zone ?? property.city
        }`}
      >
        <section style={headerStyle}>
          <div>
            <div style={eyebrowStyle}>
              RENDICONTO IMMOBILE
            </div>

            <h2 style={reportTitleStyle}>
              {property.name}
            </h2>

            <p style={ownerStyle}>
              Proprietario:{" "}
              <strong>
                {owner.fullName}
              </strong>
            </p>

            <p style={referenceMonthTextStyle}>
              Periodo:{" "}
              <strong>
                {formatMonth(
                  preview.referenceMonth
                )}
              </strong>
            </p>
          </div>

          <div style={headerActionsStyle}>
            <form
              method="get"
              style={monthFormStyle}
            >
              <input
                type="hidden"
                name="propertyId"
                value={property.id}
              />

              <label
                htmlFor="referenceMonth"
                style={monthLabelStyle}
              >
                Mese di riferimento
              </label>

              <div style={monthControlsStyle}>
                <input
                  id="referenceMonth"
                  name="referenceMonth"
                  type="month"
                  defaultValue={referenceMonth}
                  style={monthInputStyle}
                />

                <button
                  type="submit"
                  style={secondaryButtonStyle}
                >
                  Aggiorna
                </button>
              </div>
            </form>

            {formula && calculation ? (
              <form
                action={
                  generateFinanceReportAction
                }
              >
                <input
                  type="hidden"
                  name="propertyId"
                  value={property.id}
                />

                <input
                  type="hidden"
                  name="referenceMonth"
                  value={referenceMonth}
                />

                <button
                  type="submit"
                  style={generateButtonStyle}
                >
                  Genera rendiconto
                </button>
              </form>
            ) : null}

            <Link
              href={`/properties/${property.id}`}
              style={secondaryLinkStyle}
            >
              Torna all’immobile
            </Link>
          </div>
        </section>

        <FinancePreview preview={preview} />
      </AppShell>
    </>
  );
}

function normalizeReferenceMonth(
  value?: string
) {
  if (
    value &&
    /^\d{4}-(0[1-9]|1[0-2])$/.test(value)
  ) {
    return value;
  }

  const now = new Date();

  return `${now.getUTCFullYear()}-${String(
    now.getUTCMonth() + 1
  ).padStart(2, "0")}`;
}

function parseReferenceMonth(
  value: string
) {
  const [yearValue, monthValue] =
    value.split("-");

  const year = Number(yearValue);
  const month = Number(monthValue);

  return new Date(
    Date.UTC(year, month - 1, 1)
  );
}

function formatMonth(date: Date) {
  const value =
    new Intl.DateTimeFormat("it-IT", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(date);

  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  );
}

const headerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "20px",
  padding: "24px",
  marginBottom: "20px",
  border: "1px solid #e2e8f0",
  borderRadius: "20px",
  background: "#ffffff",
  flexWrap: "wrap",
};

const eyebrowStyle: CSSProperties = {
  color: "#64748b",
  fontSize: "12px",
  fontWeight: 800,
  letterSpacing: "0.08em",
};

const reportTitleStyle: CSSProperties = {
  margin: "6px 0 0",
  color: "#0f172a",
  fontSize: "30px",
};

const ownerStyle: CSSProperties = {
  margin: "8px 0 0",
  color: "#64748b",
};

const referenceMonthTextStyle: CSSProperties = {
  margin: "6px 0 0",
  color: "#475569",
  fontSize: "14px",
};

const headerActionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "flex-end",
  gap: "10px",
  flexWrap: "wrap",
};

const monthFormStyle: CSSProperties = {
  display: "grid",
  gap: "6px",
};

const monthLabelStyle: CSSProperties = {
  color: "#64748b",
  fontSize: "12px",
  fontWeight: 700,
};

const monthControlsStyle: CSSProperties = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
};

const monthInputStyle: CSSProperties = {
  minHeight: "40px",
  padding: "0 11px",
  border: "1px solid #cbd5e1",
  borderRadius: "10px",
  background: "#ffffff",
  color: "#0f172a",
  font: "inherit",
};

const secondaryButtonStyle: CSSProperties = {
  minHeight: "40px",
  padding: "0 14px",
  border: "1px solid #cbd5e1",
  borderRadius: "10px",
  background: "#ffffff",
  color: "#334155",
  fontWeight: 700,
  cursor: "pointer",
};

const generateButtonStyle: CSSProperties = {
  minHeight: "40px",
  padding: "0 16px",
  border: 0,
  borderRadius: "10px",
  background: "#2563eb",
  color: "#ffffff",
  fontWeight: 800,
  cursor: "pointer",
};

const errorStateStyle: CSSProperties = {
  display: "grid",
  justifyItems: "start",
  gap: "18px",
  padding: "30px",
  border: "1px solid #fecaca",
  borderRadius: "20px",
  background: "#fff7f7",
};

const errorIconStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "42px",
  height: "42px",
  borderRadius: "50%",
  background: "#fee2e2",
  color: "#be123c",
  fontSize: "22px",
  fontWeight: 900,
};

const errorTitleStyle: CSSProperties = {
  margin: 0,
  color: "#881337",
  fontSize: "22px",
};

const errorDescriptionStyle: CSSProperties = {
  margin: "8px 0 0",
  color: "#9f1239",
  lineHeight: 1.6,
};

const errorActionsStyle: CSSProperties = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
};

const primaryLinkStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: "40px",
  padding: "0 16px",
  borderRadius: "10px",
  background: "#2563eb",
  color: "#ffffff",
  fontWeight: 700,
  textDecoration: "none",
};

const secondaryLinkStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: "40px",
  padding: "0 16px",
  border: "1px solid #cbd5e1",
  borderRadius: "10px",
  background: "#ffffff",
  color: "#334155",
  fontWeight: 700,
  textDecoration: "none",
};







