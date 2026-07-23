import type { CSSProperties } from "react";

type RuleSelectOption = {
  value: string;
  label: string;
};

type RuleSelectProps = {
  label: string;
  value: string;
  options: RuleSelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function RuleSelect({
  label,
  value,
  options,
  onChange,
  disabled = false,
}: RuleSelectProps) {
  return (
    <div style={fieldStyle}>
      <label style={labelStyle}>
        {label}
      </label>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        disabled={disabled}
        style={{
          ...selectStyle,
          opacity: disabled ? 0.55 : 1,
          cursor: disabled
            ? "not-allowed"
            : "pointer",
        }}
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

const fieldStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
};

const labelStyle: CSSProperties = {
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: "#64748b",
};

const selectStyle: CSSProperties = {
  width: "100%",
  height: "40px",
  padding: "0 10px",
  border: "1px solid #cbd5e1",
  borderRadius: "10px",
  background: "#ffffff",
  fontSize: "13px",
  color: "#0f172a",
};