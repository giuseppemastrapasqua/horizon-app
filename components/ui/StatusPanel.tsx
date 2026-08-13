import type { ReactNode } from "react";

type StatusPanelTone = "green" | "red";

type StatusPanelProps = {
  title: string;
  tone: StatusPanelTone;
  children: ReactNode;
};

type StatusPanelRowProps = {
  tone: StatusPanelTone;
  children: ReactNode;
};

export function StatusPanel({
  title,
  tone,
  children,
}: StatusPanelProps) {
  const styles =
    tone === "green"
      ? {
          background: "#f0fdf4",
          border: "1px solid #bbf7d0",
          titleColor: "#166534",
          accent: "#22c55e",
        }
      : {
          background: "#fff7f7",
          border: "1px solid #fecaca",
          titleColor: "#be123c",
          accent: "#f43f5e",
        };

  return (
    <section
      style={{
        ...panelBaseStyle,
        background: styles.background,
        border: styles.border,
      }}
    >
      <div
        style={{
          ...accentStyle,
          background: styles.accent,
        }}
      />

      <h2
        style={{
          ...titleBaseStyle,
          color: styles.titleColor,
        }}
      >
        {title}
      </h2>

      <div style={contentStyle}>{children}</div>
    </section>
  );
}

export function StatusPanelRow({
  tone,
  children,
}: StatusPanelRowProps) {
  const styles =
    tone === "green"
      ? {
          border: "1px solid #d1fae5",
          color: "#166534",
        }
      : {
          border: "1px solid #ffe4e6",
          color: "#9f1239",
        };

  return (
    <div
      style={{
        ...rowBaseStyle,
        border: styles.border,
        color: styles.color,
      }}
    >
      {children}
    </div>
  );
}

const panelBaseStyle = {
  position: "relative" as const,
  overflow: "hidden",
  borderRadius: "22px",
  padding: "22px",
  boxShadow: "0 8px 26px rgba(15, 23, 42, 0.045)",
};

const accentStyle = {
  position: "absolute" as const,
  top: 0,
  left: 0,
  width: "100%",
  height: "4px",
};

const titleBaseStyle = {
  margin: "2px 0 16px",
  fontSize: "21px",
  letterSpacing: "-0.02em",
};

const contentStyle = {
  display: "grid",
  gap: "10px",
};

const rowBaseStyle = {
  display: "grid",
  gap: "3px",
  padding: "13px 14px",
  borderRadius: "14px",
  background: "#ffffff",
};