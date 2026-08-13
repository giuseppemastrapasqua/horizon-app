type DashboardScoreBadgeProps = {
  value: number;
};

const scoreBadgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "58px",
  height: "58px",
  borderRadius: "18px",
  background: "#0f172a",
  color: "#fff",
  fontWeight: 950,
  fontSize: "22px",
};

export function DashboardScoreBadge({
  value,
}: DashboardScoreBadgeProps) {
  return <div style={scoreBadgeStyle}>{value}</div>;
}