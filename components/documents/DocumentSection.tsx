type DocumentSectionProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

export function DocumentSection({
  title,
  subtitle,
  children,
}: DocumentSectionProps) {
  return (
    <section
      style={{
        padding: "24px 0",
        borderBottom: "1px solid #e2e8f0",
      }}
    >
      <div style={{ marginBottom: "18px" }}>
        <h2
          style={{
            margin: 0,
            color: "#0f172a",
            fontSize: "20px",
            letterSpacing: "-0.025em",
          }}
        >
          {title}
        </h2>

        {subtitle ? (
          <p
            style={{
              margin: "7px 0 0",
              color: "#64748b",
              fontSize: "13px",
              lineHeight: 1.5,
            }}
          >
            {subtitle}
          </p>
        ) : null}
      </div>

      {children}
    </section>
  );
}