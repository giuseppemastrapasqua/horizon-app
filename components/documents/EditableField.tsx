"use client";

import { useState } from "react";

type EditableFieldProps = {
  name: string;
  label: string;
  defaultValue?: string;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
};

export function EditableField({
  name,
  label,
  defaultValue = "",
  placeholder,
  multiline = false,
  rows = 4,
}: EditableFieldProps) {
  const [value, setValue] = useState(defaultValue);

  return (
    <label
      style={{
        display: "grid",
        gap: "8px",
      }}
    >
      <span
        style={{
          color: "#475569",
          fontSize: "12px",
          fontWeight: 800,
        }}
      >
        {label}
      </span>

      {multiline ? (
        <textarea
          name={name}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={placeholder}
          rows={rows}
          style={{
            width: "100%",
            padding: "12px 13px",
            borderRadius: "10px",
            border: "1px solid #cbd5e1",
            background: "#ffffff",
            color: "#0f172a",
            font: "inherit",
            lineHeight: 1.5,
            resize: "vertical",
          }}
        />
      ) : (
        <input
          name={name}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={placeholder}
          style={{
            width: "100%",
            padding: "12px 13px",
            borderRadius: "10px",
            border: "1px solid #cbd5e1",
            background: "#ffffff",
            color: "#0f172a",
            font: "inherit",
          }}
        />
      )}
    </label>
  );
}