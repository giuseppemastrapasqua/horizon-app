import Link from "next/link";

export function DashboardKpiLink({
  href,
  title,
  value,
  hint,
}: {
  href: string;
  title: string;
  value: string | number;
  hint: string;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "block",
        minWidth: 0,
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "20px",
        padding: "20px 22px",
        boxShadow: "0 8px 26px rgba(15, 23, 42, 0.055)",
        textDecoration: "none",
        transition:
          "transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease",
      }}
    >
      <div
        style={{
          color: "#64748b",
          fontWeight: 750,
          fontSize: "13px",
          lineHeight: 1.2,
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: "10px",
          color: "#0f172a",
          fontSize: "32px",
          fontWeight: 900,
          lineHeight: 1,
          letterSpacing: "-0.035em",
          overflowWrap: "anywhere",
        }}
      >
        {value}
      </div>

      <div
        style={{
          marginTop: "9px",
          color: "#94a3b8",
          fontSize: "12px",
          lineHeight: 1.35,
        }}
      >
        {hint}
      </div>
    </Link>
  );
}