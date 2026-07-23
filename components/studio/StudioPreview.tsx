import type { CSSProperties, ReactNode } from "react";

type StudioPreviewProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
  onClose?: () => void;
};

export function StudioPreview({
  eyebrow = "Anteprima",
  title,
  subtitle,
  children,
  actions,
  onClose,
}: StudioPreviewProps) {
  return (
    <aside style={containerStyle}>
     <div style={headerStyle}>
  <div style={headerTopStyle}>
    <p style={eyebrowStyle}>{eyebrow}</p>

    {onClose ? (
      <button
        type="button"
        onClick={onClose}
        style={closeButtonStyle}
        aria-label="Chiudi"
      >
        ✕
      </button>
    ) : null}
  </div>

  <h2 style={titleStyle}>{title}</h2>

  {subtitle ? (
    <p style={subtitleStyle}>{subtitle}</p>
  ) : null}
</div>

      <div style={contentStyle}>{children}</div>

      {actions ? (
        <div style={actionsStyle}>{actions}</div>
      ) : null}
    </aside>
  );
}

type StudioPreviewSectionProps = {
  title?: string;
  children: ReactNode;
};

export function StudioPreviewSection({
  title,
  children,
}: StudioPreviewSectionProps) {
  return (
    <section style={sectionStyle}>
      {title ? (
        <h3 style={sectionTitleStyle}>{title}</h3>
      ) : null}

      <div style={sectionContentStyle}>{children}</div>
    </section>
  );
}

type StudioPreviewItemProps = {
  label: string;
  value: ReactNode;
};

export function StudioPreviewItem({
  label,
  value,
}: StudioPreviewItemProps) {
  return (
    <div style={itemStyle}>
      <span style={itemLabelStyle}>{label}</span>
      <div style={itemValueStyle}>{value}</div>
    </div>
  );
}

const containerStyle: CSSProperties = {
  overflow: "hidden",
  border: "1px solid #e2e8f0",
  borderRadius: "18px",
  background: "#ffffff",
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
};

const headerStyle: CSSProperties = {
  padding: "20px",
  borderBottom: "1px solid #e2e8f0",
};

const eyebrowStyle: CSSProperties = {
  margin: 0,
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "#64748b",
};

const titleStyle: CSSProperties = {
  margin: "8px 0 0",
  fontSize: "22px",
  lineHeight: 1.2,
  letterSpacing: "-0.02em",
  color: "#0f172a",
};

const subtitleStyle: CSSProperties = {
  margin: "6px 0 0",
  fontSize: "13px",
  lineHeight: 1.5,
  color: "#64748b",
};

const contentStyle: CSSProperties = {
  display: "grid",
};

const sectionStyle: CSSProperties = {
  padding: "18px 20px",
  borderBottom: "1px solid #f1f5f9",
};

const sectionTitleStyle: CSSProperties = {
  margin: "0 0 12px",
  fontSize: "12px",
  fontWeight: 700,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "#64748b",
};

const sectionContentStyle: CSSProperties = {
  display: "grid",
  gap: "14px",
};

const itemStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "110px minmax(0, 1fr)",
  gap: "12px",
  alignItems: "start",
};

const itemLabelStyle: CSSProperties = {
  fontSize: "12px",
  color: "#64748b",
};

const itemValueStyle: CSSProperties = {
  minWidth: 0,
  fontSize: "13px",
  fontWeight: 600,
  color: "#0f172a",
  overflowWrap: "anywhere",
};

const actionsStyle: CSSProperties = {
  display: "flex",
  gap: "10px",
  padding: "16px 20px",
  flexWrap: "wrap",
};

const headerTopStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const closeButtonStyle: CSSProperties = {
  width: "34px",
  height: "34px",
  borderRadius: "10px",
  border: "1px solid #e2e8f0",
  background: "#ffffff",
  color: "#64748b",
  cursor: "pointer",
  fontSize: "18px",
  fontWeight: 700,
};