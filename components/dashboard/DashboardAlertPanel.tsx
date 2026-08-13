import type { ReactNode } from "react";

type DashboardAlertPanelProps = {
  title: string;
  children: ReactNode;
};

type DashboardAlertRowProps = {
  children: ReactNode;
};

export function DashboardAlertPanel({
  title,
  children,
}: DashboardAlertPanelProps) {
  return (
    <section style={alertPanelStyle}>
      <div style={alertAccentStyle} />

      <h2 style={alertTitleStyle}>{title}</h2>

      <div style={stack10Style}>{children}</div>
    </section>
  );
}

export function DashboardAlertRow({
  children,
}: DashboardAlertRowProps) {
  return <div style={alertRowStyle}>{children}</div>;
}

const alertPanelStyle = {
  position: "relative" as const,
  overflow: "hidden",
  background: "#fff7f7",
  border: "1px solid #fecaca",
  borderRadius: "22px",
  padding: "22px",
  boxShadow: "0 8px 26px rgba(15, 23, 42, 0.045)",
};

const alertAccentStyle = {
  position: "absolute" as const,
  top: 0,
  left: 0,
  width: "100%",
  height: "4px",
  background: "#f43f5e",
};

const alertTitleStyle = {
  margin: "2px 0 16px",
  fontSize: "21px",
  color: "#be123c",
  letterSpacing: "-0.02em",
};

const stack10Style = {
  display: "grid",
  gap: "10px",
};

const alertRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "16px",
  padding: "13px 14px",
  borderRadius: "14px",
  background: "#ffffff",
  border: "1px solid #ffe4e6",
  alignItems: "center",
};