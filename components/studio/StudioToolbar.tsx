"use client";

import type { CSSProperties, ReactNode } from "react";

type StudioToolbarProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  actions?: ReactNode;
};

export function StudioToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Cerca...",
  actions,
}: StudioToolbarProps) {
  return (
    <div style={toolbarStyle}>
      <div style={searchWrapperStyle}>
        <span style={searchIconStyle}>⌕</span>

        <input
          type="search"
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          style={searchInputStyle}
        />
      </div>

      {actions ? <div style={actionsStyle}>{actions}</div> : null}
    </div>
  );
}

const toolbarStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "16px",
  padding: "14px",
  border: "1px solid #e2e8f0",
  borderRadius: "16px",
  background: "#ffffff",
  flexWrap: "wrap",
};

const searchWrapperStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  minWidth: "280px",
  flex: 1,
  padding: "0 12px",
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  background: "#f8fafc",
};

const searchIconStyle: CSSProperties = {
  fontSize: "18px",
  color: "#64748b",
};

const searchInputStyle: CSSProperties = {
  width: "100%",
  height: "42px",
  border: "none",
  outline: "none",
  background: "transparent",
  fontSize: "14px",
  color: "#0f172a",
};

const actionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  flexWrap: "wrap",
};