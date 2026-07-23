import type { CSSProperties, ReactNode } from "react";

type InsightTone =
  | "success"
  | "warning"
  | "danger"
  | "info";

type Insight = {
  label: string;
  value: string;
  tone: InsightTone;
};

type OperationalCardProps = {
  title: string;
  subtitle?: string;
  insights: Insight[];
  children?: ReactNode;
};

export function OperationalCard({
  title,
  subtitle,
  insights,
  children,
}: OperationalCardProps) {
  return (
    <section style={cardStyle}>
      <div style={headerStyle}>
        <h3 style={titleStyle}>{title}</h3>

        {subtitle && (
          <div style={subtitleStyle}>
            {subtitle}
          </div>
        )}
      </div>

      <div style={listStyle}>
        {insights.map((item) => (
          <div
            key={item.label}
            style={rowStyle}
          >
            <div
              style={{
                ...dotStyle,
                background: toneColor[item.tone],
              }}
            />

            <div style={contentStyle}>
              <strong>{item.label}</strong>

              <span style={valueStyle}>
                {item.value}
              </span>
            </div>
          </div>
        ))}
      </div>

      {children}
    </section>
  );
}

const toneColor = {
  success: "#22c55e",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#3b82f6",
};

const cardStyle: CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 18,
  padding: 20,
  background: "#fff",
};

const headerStyle: CSSProperties = {
  marginBottom: 18,
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: 18,
};

const subtitleStyle: CSSProperties = {
  marginTop: 4,
  color: "#64748b",
  fontSize: 13,
};

const listStyle: CSSProperties = {
  display: "grid",
  gap: 14,
};

const rowStyle: CSSProperties = {
  display: "flex",
  gap: 12,
  alignItems: "flex-start",
};

const dotStyle: CSSProperties = {
  width: 10,
  height: 10,
  borderRadius: 999,
  marginTop: 6,
};

const contentStyle: CSSProperties = {
  display: "grid",
};

const valueStyle: CSSProperties = {
  color: "#64748b",
  fontSize: 13,
};