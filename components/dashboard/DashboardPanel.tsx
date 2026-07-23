export function DashboardPanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: "24px",
        padding: "24px",
        boxShadow: "0 12px 34px rgba(15, 23, 42, 0.07)",
      }}
    >
      <h2
        style={{
          margin: "0 0 18px 0",
          fontSize: "22px",
          color: "#0f172a",
        }}
      >
        {title}
      </h2>

      <div style={{ display: "grid", gap: "12px" }}>{children}</div>
    </section>
  );
}