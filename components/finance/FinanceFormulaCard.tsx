import type { CSSProperties } from "react";

import { FinanceFormulaScope } from "@prisma/client";
import Link from "next/link";

import type {
  FinancePreview,
} from "@/lib/finance/preview";

type FinanceFormulaCardProps = {
  formula: FinancePreview["formula"];
};

export function FinanceFormulaCard({
  formula,
}: FinanceFormulaCardProps) {
  return (
    <section style={formulaPanelStyle}>
      <div>
        <div style={sectionEyebrowStyle}>
          FORMULA APPLICATA
        </div>

        {formula ? (
          <>
            <h3 style={formulaTitleStyle}>
              {formula.name}
            </h3>

            <p style={formulaDescriptionStyle}>
              {formula.description ??
                "Nessuna descrizione disponibile."}
            </p>
          </>
        ) : (
          <>
            <h3 style={formulaTitleStyle}>
              Nessuna formula disponibile
            </h3>

            <p style={formulaDescriptionStyle}>
              Non esiste una formula specifica
              per questo immobile e non è stata
              configurata una formula globale.
            </p>
          </>
        )}
      </div>

      {formula ? (
        <div style={formulaMetaStyle}>
          <span style={scopeBadgeStyle}>
            {formula.scope ===
            FinanceFormulaScope.SINGLE_PROPERTY
              ? "Formula immobile"
              : "Formula globale"}
          </span>

          <span style={statusBadgeStyle}>
            {formula.status}
          </span>

          <span style={rulesBadgeStyle}>
            {formula.rules.length} regole
          </span>
        </div>
      ) : (
        <Link
          href="/finance/formula-builder"
          style={primaryLinkStyle}
        >
          Configura una formula
        </Link>
      )}
    </section>
  );
}

const formulaPanelStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "20px",
  padding: "22px",
  marginBottom: "20px",
  border: "1px solid #bfdbfe",
  borderRadius: "20px",
  background: "#eff6ff",
  flexWrap: "wrap",
};

const sectionEyebrowStyle: CSSProperties = {
  color: "#64748b",
  fontSize: "11px",
  fontWeight: 800,
  letterSpacing: "0.08em",
};

const formulaTitleStyle: CSSProperties = {
  margin: "6px 0 0",
  color: "#0f172a",
  fontSize: "20px",
};

const formulaDescriptionStyle: CSSProperties = {
  margin: "7px 0 0",
  color: "#475569",
};

const formulaMetaStyle: CSSProperties = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
};

const scopeBadgeStyle: CSSProperties = {
  padding: "7px 10px",
  borderRadius: "999px",
  background: "#dbeafe",
  color: "#1d4ed8",
  fontSize: "12px",
  fontWeight: 700,
};

const statusBadgeStyle: CSSProperties = {
  padding: "7px 10px",
  borderRadius: "999px",
  background: "#ffffff",
  color: "#334155",
  fontSize: "12px",
  fontWeight: 700,
};

const rulesBadgeStyle: CSSProperties = {
  padding: "7px 10px",
  borderRadius: "999px",
  background: "#ffffff",
  color: "#334155",
  fontSize: "12px",
  fontWeight: 700,
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