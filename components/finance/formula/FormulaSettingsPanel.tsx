"use client";

import {
  type CSSProperties,
  type ReactNode,
} from "react";

export type FinanceFormulaScope =
  | "SINGLE_PROPERTY"
  | "ALL_PROPERTIES";

type FormulaSettingsPanelProps = {
  formulaName: string;
  formulaDescription: string;
  grossRevenue: number;

  propertyField: ReactNode;

  formulaScope?: FinanceFormulaScope;

  onFormulaNameChange: (value: string) => void;
  onFormulaDescriptionChange: (
    value: string
  ) => void;
  onGrossRevenueChange: (value: number) => void;

  onFormulaScopeChange?: (
    value: FinanceFormulaScope
  ) => void;
};

export function FormulaSettingsPanel({
  formulaName,
  formulaDescription,
  grossRevenue,
  propertyField,
  formulaScope = "SINGLE_PROPERTY",
  onFormulaNameChange,
  onFormulaDescriptionChange,
  onGrossRevenueChange,
  onFormulaScopeChange,
}: FormulaSettingsPanelProps) {
  const showScopeSelector =
    onFormulaScopeChange !== undefined;

  return (
    <section style={settingsStyle}>
      <div style={fieldStyle}>
        <label
          style={labelStyle}
          htmlFor="formula-name"
        >
          Nome formula
        </label>

        <input
          id="formula-name"
          value={formulaName}
          onChange={(event) =>
            onFormulaNameChange(event.target.value)
          }
          style={inputStyle}
        />
      </div>

      <div style={fieldStyle}>
        <label
          style={labelStyle}
          htmlFor="formula-description"
        >
          Descrizione
        </label>

        <input
          id="formula-description"
          value={formulaDescription}
          onChange={(event) =>
            onFormulaDescriptionChange(
              event.target.value
            )
          }
          style={inputStyle}
        />
      </div>

      {showScopeSelector ? (
        <fieldset style={scopeFieldsetStyle}>
          <legend style={labelStyle}>
            Applicazione formula
          </legend>

          <label style={scopeOptionStyle}>
            <input
              type="radio"
              name="formula-scope"
              value="SINGLE_PROPERTY"
              checked={
                formulaScope ===
                "SINGLE_PROPERTY"
              }
              onChange={() =>
                onFormulaScopeChange(
                  "SINGLE_PROPERTY"
                )
              }
            />

            <span style={scopeTextStyle}>
              <strong style={scopeTitleStyle}>
                Singola struttura
              </strong>

              <span style={scopeDescriptionStyle}>
                Applica la formula soltanto alla
                struttura selezionata.
              </span>
            </span>
          </label>

          <label style={scopeOptionStyle}>
            <input
              type="radio"
              name="formula-scope"
              value="ALL_PROPERTIES"
              checked={
                formulaScope ===
                "ALL_PROPERTIES"
              }
              onChange={() =>
                onFormulaScopeChange(
                  "ALL_PROPERTIES"
                )
              }
            />

            <span style={scopeTextStyle}>
              <strong style={scopeTitleStyle}>
                Tutte le strutture
              </strong>

             <span style={scopeDescriptionStyle}>
  Rende la formula disponibile per
  l&apos;intero portafoglio.
</span>
            </span>
          </label>
        </fieldset>
      ) : null}

      {formulaScope === "SINGLE_PROPERTY"
        ? propertyField
        : null}

      <div style={fieldStyle}>
        <label
          style={labelStyle}
          htmlFor="gross-revenue"
        >
          Prezzo lordo prenotazione
        </label>

        <div style={moneyInputWrapperStyle}>
          <span style={moneySymbolStyle}>€</span>

          <input
            id="gross-revenue"
            type="number"
            min="0"
            step="0.01"
            value={grossRevenue}
            onChange={(event) =>
              onGrossRevenueChange(
                Number(event.target.value) || 0
              )
            }
            style={moneyInputStyle}
          />
        </div>
      </div>
    </section>
  );
}

const settingsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "16px",
  padding: "18px",
  border: "1px solid #e2e8f0",
  borderRadius: "18px",
  background: "#ffffff",
};

const fieldStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
};

const labelStyle: CSSProperties = {
  fontSize: "13px",
  fontWeight: 700,
  color: "#334155",
};

const inputStyle: CSSProperties = {
  width: "100%",
  height: "42px",
  padding: "0 12px",
  border: "1px solid #cbd5e1",
  borderRadius: "11px",
  background: "#ffffff",
  fontSize: "14px",
  color: "#0f172a",
  outline: "none",
};

const scopeFieldsetStyle: CSSProperties = {
  display: "grid",
  gap: "10px",
  minWidth: 0,
  margin: 0,
  padding: 0,
  border: "none",
};

const scopeOptionStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: "10px",
  padding: "11px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: "11px",
  background: "#ffffff",
  cursor: "pointer",
};

const scopeTextStyle: CSSProperties = {
  display: "grid",
  gap: "3px",
};

const scopeTitleStyle: CSSProperties = {
  fontSize: "13px",
  color: "#0f172a",
};

const scopeDescriptionStyle: CSSProperties = {
  fontSize: "11px",
  lineHeight: 1.4,
  color: "#64748b",
};

const moneyInputWrapperStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  overflow: "hidden",
  border: "1px solid #cbd5e1",
  borderRadius: "11px",
  background: "#ffffff",
};

const moneySymbolStyle: CSSProperties = {
  paddingLeft: "12px",
  color: "#64748b",
};

const moneyInputStyle: CSSProperties = {
  width: "100%",
  height: "40px",
  padding: "0 12px 0 8px",
  border: "none",
  outline: "none",
  background: "transparent",
  fontSize: "14px",
  color: "#0f172a",
};