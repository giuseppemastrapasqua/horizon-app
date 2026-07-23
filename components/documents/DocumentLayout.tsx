"use client";

import Link from "next/link";

type DocumentLayoutProps = {
  title: string;
  subtitle?: string;
  documentNumber?: string;
  status?: string;
  backHref: string;
  backLabel?: string;
  children: React.ReactNode;
};

export function DocumentLayout({
  title,
  subtitle,
  documentNumber,
  status = "BOZZA",
  backHref,
  backLabel = "← Torna indietro",
  children,
}: DocumentLayoutProps) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#eef2f7",
        padding: "28px",
      }}
    >
      <div
        style={{
          maxWidth: "1180px",
          margin: "0 auto",
        }}
      >
        <div
          className="document-toolbar"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
            marginBottom: "20px",
            flexWrap: "wrap",
          }}
        >
          <Link href={backHref} style={backLinkStyle}>
            {backLabel}
          </Link>

          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={() => window.print()}
              style={secondaryButtonStyle}
            >
              Stampa
            </button>

            <button type="button" style={primaryButtonStyle}>
              Salva bozza
            </button>
          </div>
        </div>

        <article
          style={{
            maxWidth: "920px",
            margin: "0 auto",
            background: "#ffffff",
            border: "1px solid #dbe3ee",
            borderRadius: "6px",
            boxShadow: "0 20px 55px rgba(15, 23, 42, 0.12)",
            overflow: "hidden",
          }}
        >
          <header
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "24px",
              padding: "38px 42px 30px",
              borderBottom: "1px solid #e2e8f0",
            }}
          >
            <div>
              <div
                style={{
                  marginBottom: "18px",
                  color: "#0f172a",
                  fontSize: "20px",
                  fontWeight: 950,
                  letterSpacing: "-0.04em",
                }}
              >
                HORIZON
              </div>

              <h1
                style={{
                  margin: 0,
                  color: "#0f172a",
                  fontSize: "32px",
                  lineHeight: 1.1,
                  letterSpacing: "-0.035em",
                }}
              >
                {title}
              </h1>

              {subtitle ? (
                <p
                  style={{
                    margin: "10px 0 0",
                    color: "#64748b",
                    fontSize: "14px",
                    lineHeight: 1.5,
                  }}
                >
                  {subtitle}
                </p>
              ) : null}
            </div>

            <div
              style={{
                minWidth: "170px",
                textAlign: "right",
              }}
            >
              <DocumentStatus status={status} />

              {documentNumber ? (
                <div
                  style={{
                    marginTop: "12px",
                    color: "#64748b",
                    fontSize: "12px",
                  }}
                >
                  Documento
                  <div
                    style={{
                      marginTop: "3px",
                      color: "#0f172a",
                      fontSize: "14px",
                      fontWeight: 850,
                    }}
                  >
                    {documentNumber}
                  </div>
                </div>
              ) : null}
            </div>
          </header>

          <div
            style={{
              padding: "34px 42px 44px",
            }}
          >
            {children}
          </div>

          <footer
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "20px",
              padding: "20px 42px",
              borderTop: "1px solid #e2e8f0",
              background: "#f8fafc",
              color: "#64748b",
              fontSize: "11px",
            }}
          >
            <span>Documento generato con Horizon</span>
            <span>Gestione documentale</span>
          </footer>
        </article>
      </div>
    </div>
  );
}

function DocumentStatus({ status }: { status: string }) {
  const isFinal = status === "FINALE" || status === "EMESSO";

  return (
    <span
      style={{
        display: "inline-block",
        padding: "7px 10px",
        borderRadius: "999px",
        background: isFinal ? "#ecfdf5" : "#fffbeb",
        color: isFinal ? "#166534" : "#a16207",
        border: isFinal
          ? "1px solid #bbf7d0"
          : "1px solid #fde68a",
        fontSize: "11px",
        fontWeight: 900,
      }}
    >
      {status}
    </span>
  );
}

const backLinkStyle = {
  display: "inline-block",
  padding: "10px 14px",
  borderRadius: "12px",
  background: "#ffffff",
  color: "#334155",
  border: "1px solid #cbd5e1",
  textDecoration: "none",
  fontWeight: 800,
  fontSize: "13px",
};

const primaryButtonStyle = {
  padding: "10px 14px",
  borderRadius: "12px",
  border: "1px solid #0f172a",
  background: "#0f172a",
  color: "#ffffff",
  cursor: "pointer",
  fontWeight: 800,
};

const secondaryButtonStyle = {
  padding: "10px 14px",
  borderRadius: "12px",
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#334155",
  cursor: "pointer",
  fontWeight: 800,
};