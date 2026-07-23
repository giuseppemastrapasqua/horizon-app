"use client";

import {
  useEffect,
  useState,
  type CSSProperties,
  type FocusEvent,
} from "react";

type MoneyInputProps = {
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
  ariaLabel?: string;
  disabled?: boolean;
  min?: number;
};

export function MoneyInput({
  value,
  onChange,
  suffix = "€",
  ariaLabel = "Importo",
  disabled = false,
  min = 0,
}: MoneyInputProps) {
  const [inputValue, setInputValue] = useState(
    formatEditableValue(value)
  );

  useEffect(() => {
    setInputValue(formatEditableValue(value));
  }, [value]);

  function handleChange(rawValue: string) {
    const sanitizedValue = rawValue
      .replace(",", ".")
      .replace(/[^\d.]/g, "")
      .replace(/^0+(?=\d)/, "");

    setInputValue(sanitizedValue);

    if (
      sanitizedValue === "" ||
      sanitizedValue === "."
    ) {
      onChange(0);
      return;
    }

    const parsedValue = Number(sanitizedValue);

    if (Number.isNaN(parsedValue)) {
      return;
    }

    onChange(Math.max(min, parsedValue));
  }

  function handleBlur(
    event: FocusEvent<HTMLInputElement>
  ) {
    const parsedValue = Number(
      event.currentTarget.value.replace(",", ".")
    );

    const normalizedValue = Number.isFinite(parsedValue)
      ? Math.max(min, parsedValue)
      : min;

    setInputValue(formatEditableValue(normalizedValue));
    onChange(normalizedValue);
  }

  return (
    <div style={wrapperStyle}>
      <input
        type="text"
        inputMode="decimal"
        value={inputValue}
        onChange={(event) =>
          handleChange(event.target.value)
        }
        onBlur={handleBlur}
        onFocus={(event) => event.currentTarget.select()}
        aria-label={ariaLabel}
        disabled={disabled}
        style={{
          ...inputStyle,
          cursor: disabled ? "not-allowed" : "text",
        }}
      />

      <span style={suffixStyle}>{suffix}</span>
    </div>
  );
}

function formatEditableValue(value: number) {
  if (!Number.isFinite(value)) {
    return "0";
  }

  return String(value);
}

const wrapperStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  overflow: "hidden",
  border: "1px solid #cbd5e1",
  borderRadius: "10px",
  background: "#ffffff",
};

const inputStyle: CSSProperties = {
  width: "100%",
  height: "38px",
  padding: "0 10px",
  border: "none",
  outline: "none",
  background: "transparent",
  fontSize: "13px",
  color: "#0f172a",
};

const suffixStyle: CSSProperties = {
  paddingRight: "10px",
  fontSize: "12px",
  fontWeight: 700,
  color: "#64748b",
};