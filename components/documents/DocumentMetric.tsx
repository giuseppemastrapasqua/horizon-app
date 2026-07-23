type DocumentMetricProps = {
  label: string;
  value: string | number;
  note?: string;
  tone?: "default" | "green" | "red";
};

export function DocumentMetric({
  label,
  value,
  note,
  tone = "default",
}: DocumentMetricProps) {
  const valueColor =
    tone === "green"
      ? "#166534"
      : tone === "red"
        ? "#be123c"
        : "#0f172a";

  return (
    <div
      style={{
        padding: "16px",
        borderRadius: "14px",
        background:
          tone === "green"
            ? "#f0fdf4"
            : tone === "red"
              ? "#fff7f7"
              : "#f8fafc",
        border:
          tone === "green"
            ? "1px solid #bbf7d0"
            : tone === "red"
              ? "1px solid #fecaca"
              : "1px solid #e2e8f0",
      }}
    >
      <div
        style={{
          color: "#64748b",
          fontSize: "12px",
          fontWeight: 800,
        }}
      >
        {label}
      </div>

      <div
        style={{
          marginTop: "8px",
          color: valueColor,
          fontSize: "24px",
          fontWeight: 900,
          letterSpacing: "-0.025em",
        }}
      >
        {value}
      </div>

      {note ? (
        <div
          style={{
            marginTop: "7px",
            color: "#94a3b8",
            fontSize: "11px",
            lineHeight: 1.4,
          }}
        >
          {note}
        </div>
      ) : null}
    </div>
  );
}