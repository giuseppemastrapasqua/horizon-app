type ResultRowProps = {
  label: string;
  value: string;
  strong?: boolean;
  muted?: boolean;
};

export function ResultRow({
  label,
  value,
  strong = false,
  muted = false,
}: ResultRowProps) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: "14px",
        fontSize: "13px",
      }}
    >
      <span
        style={{
          color: muted ? "#64748b" : "#0f172a",
          fontWeight: strong ? 700 : 500,
        }}
      >
        {label}
      </span>

      <span
        style={{
          color: muted ? "#64748b" : "#0f172a",
          fontWeight: strong ? 700 : 600,
        }}
      >
        {value}
      </span>
    </div>
  );
}