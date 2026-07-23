"use client";

import { type CSSProperties } from "react";

export type PropertyOption = {
  id: string;
  name: string;
};

type PropertySelectProps = {
  value: string;
  properties: PropertyOption[];
  isLoading: boolean;
  error: string | null;
  onChange: (propertyId: string) => void;
};

export function PropertySelect({
  value,
  properties,
  isLoading,
  error,
  onChange,
}: PropertySelectProps) {
  return (
    <div style={fieldStyle}>
      <label
        style={labelStyle}
        htmlFor="property-id"
      >
        Immobile
      </label>

      <select
        id="property-id"
        value={value}
        disabled={isLoading}
        onChange={(event) =>
          onChange(event.target.value)
        }
        style={selectStyle}
      >
        <option value="">
          {isLoading
            ? "Caricamento immobili..."
            : "Seleziona un immobile"}
        </option>

        {properties.map((property) => (
          <option
            key={property.id}
            value={property.id}
          >
            {property.name}
          </option>
        ))}
      </select>

      {error ? (
        <p style={errorStyle}>{error}</p>
      ) : null}
    </div>
  );
}

const fieldStyle: CSSProperties = {
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