"use client";

import { type CSSProperties } from "react";

export type FormulaOption = {
  id: string;
  propertyId: string;
  name: string;
  description: string | null;
  status: string;
};

type FormulaSelectProps = {
  value: string;
  formulas: FormulaOption[];
  isLoading: boolean;
  error: string | null;
  onChange: (formulaId: string) => void;
};

export function FormulaSelect({
  value,
  formulas,
  isLoading,
  error,
  onChange,
}: FormulaSelectProps) {
  return (
    <div style={containerStyle}>
      <label
        htmlFor="formula-id"
        style={labelStyle}
      >
        Formula salvata
      </label>

      <select
        id="formula-id"
        value={value}
        disabled={isLoading}
        onChange={(event) =>
          onChange(event.target.value)
        }
        style={selectStyle}
      >
        <option value="">
          {isLoading
            ? "Caricamento formule..."
            : "Nuova formula"}
        </option>

        {formulas.map((formula) => (
          <option
            key={formula.id}
            value={formula.id}
          >
            {formula.name} · {formula.status}
          </option>
        ))}
      </select>

      {error ? (
        <p style={errorStyle}>{error}</p>
      ) : null}
    </div>
  );
}

const containerStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
};

const labelStyle: CSSProperties = {
  fontSize: "13px",
  fontWeight: 700,
  color: "#334155",
};

const selectStyle: CSSProperties = {
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

const errorStyle: CSSProperties = {
  margin: 0,
  fontSize: "12px",
  color: "#dc2626",
};