import type { CSSProperties, ReactNode } from "react";

type StudioHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
};

export function StudioHeader({
  title,
  description,
  eyebrow = "Horizon Studio",
  actions,
}: StudioHeaderProps) {
  return (
    <header style={headerStyle}>
      <div style={contentStyle}>
        <p style={eyebrowStyle}>{eyebrow}</p>

        <h1 style={titleStyle}>{title}</h1>

        {description ? (
          <p style={descriptionStyle}>{description}</p>
        ) : null}
      </div>

      {actions ? <div style={actionsStyle}>{actions}</div> : null}
    </header>
  );
}

const headerStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "24px",
  flexWrap: "wrap",
};

const contentStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
};

const eyebrowStyle: CSSProperties = {
  margin: 0,
  fontSize: "12px",
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "#64748b",
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "32px",
  lineHeight: 1.1,
  fontWeight: 750,
  letterSpacing: "-0.03em",
  color: "#0f172a",
};

const descriptionStyle: CSSProperties = {
  margin: 0,
  maxWidth: "680px",
  fontSize: "15px",
  lineHeight: 1.6,
  color: "#64748b",
};

const actionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: "10px",
  flexWrap: "wrap",
};