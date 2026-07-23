export function DashboardStatusPill({ value }: { value: string }) {
  return (
    <span
      style={{
        padding: "7px 11px",
        borderRadius: "999px",
        background: "#ffe4e6",
        color: "#9f1239",
        border: "1px solid #fecdd3",
        fontSize: "12px",
        fontWeight: 900,
        whiteSpace: "nowrap",
      }}
    >
      {value}
    </span>
  );
}