export function DashboardTaskBadge({ status }: { status: string }) {
  const style =
    status === "DONE"
      ? {
          background: "#dcfce7",
          color: "#166534",
          border: "1px solid #bbf7d0",
        }
      : status === "IN_PROGRESS"
      ? {
          background: "#fef9c3",
          color: "#854d0e",
          border: "1px solid #fde68a",
        }
      : {
          background: "#fee2e2",
          color: "#991b1b",
          border: "1px solid #fecaca",
        };

  return (
    <span
      style={{
        ...style,
        padding: "7px 11px",
        borderRadius: "999px",
        fontSize: "12px",
        fontWeight: 900,
        whiteSpace: "nowrap",
        alignSelf: "flex-start",
      }}
    >
      {status}
    </span>
  );
}