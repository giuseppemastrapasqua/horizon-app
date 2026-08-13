type DashboardMiniProps = {
  label: string;
  value: string | number;
};

const miniStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "4px",
};

const miniLabelStyle = {
  color: "#64748b",
  fontSize: "12px",
  fontWeight: 700,
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
};

const miniValueStyle = {
  color: "#0f172a",
  fontSize: "20px",
  fontWeight: 800,
};

export function DashboardMini({
  label,
  value,
}: DashboardMiniProps) {
  return (
    <div style={miniStyle}>
      <span style={miniLabelStyle}>{label}</span>
      <span style={miniValueStyle}>{value}</span>
    </div>
  );
}