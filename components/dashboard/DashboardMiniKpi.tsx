import Link from "next/link";

export function DashboardMiniKpi({
  href,
  title,
  value,
  tone = "default",
}: {
  href: string;
  title: string;
  value: string | number;
  tone?: "default" | "green" | "red";
}) {
  const styles =
    tone === "green"
      ? {
          background: "#f0fdf4",
          border: "1px solid #bbf7d0",
          valueColor: "#15803d",
        }
      : tone === "red"
        ? {
            background: "#fff5f5",
            border: "1px solid #fecaca",
            valueColor: "#be123c",
          }
        : {
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            valueColor: "#0f172a",
          };

  return (
    <Link
      href={href}
      style={{
        display: "block",
        minWidth: 0,
        background: styles.background,
        border: styles.border,
        borderRadius: "16px",
        padding: "16px 18px",
        textDecoration: "none",
      }}
    >
      <div
        style={{
          color: "#64748b",
          fontSize: "12px",
          fontWeight: 750,
          lineHeight: 1.2,
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: "7px",
          color: styles.valueColor,
          fontSize: "24px",
          fontWeight: 900,
          lineHeight: 1,
          letterSpacing: "-0.025em",
          overflowWrap: "anywhere",
        }}
      >
        {value}
      </div>
    </Link>
  );
}