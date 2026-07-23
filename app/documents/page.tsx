import Link from "next/link";
import {
  DocumentStatus,
  DocumentType,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { Navigation } from "@/components/Navigation";
import { AppShell } from "@/components/AppShell";

type DocumentsPageProps = {
  searchParams?: Promise<{
    type?: string;
    status?: string;
    ownerId?: string;
    propertyId?: string;
    q?: string;
  }>;
};

export default async function DocumentsPage({
  searchParams,
}: DocumentsPageProps) {
  const params = await searchParams;

  const typeFilter = params?.type ?? "all";
  const statusFilter = params?.status ?? "all";
  const ownerFilter = params?.ownerId ?? "all";
  const propertyFilter = params?.propertyId ?? "all";
  const searchQuery = params?.q?.trim() ?? "";

  const where: Prisma.DocumentWhereInput = {};

  if (typeFilter !== "all" && isDocumentType(typeFilter)) {
    where.type = typeFilter;
  }

  if (statusFilter !== "all" && isDocumentStatus(statusFilter)) {
    where.status = statusFilter;
  }

  if (ownerFilter !== "all") {
    where.ownerId = ownerFilter;
  }

  if (propertyFilter !== "all") {
    where.propertyId = propertyFilter;
  }

  if (searchQuery) {
    where.OR = [
      {
        title: {
          contains: searchQuery,
          mode: "insensitive",
        },
      },
      {
        subtitle: {
          contains: searchQuery,
          mode: "insensitive",
        },
      },
      {
        documentNumber: {
          contains: searchQuery,
          mode: "insensitive",
        },
      },
      {
        owner: {
          fullName: {
            contains: searchQuery,
            mode: "insensitive",
          },
        },
      },
      {
        property: {
          name: {
            contains: searchQuery,
            mode: "insensitive",
          },
        },
      },
    ];
  }

  const [documents, owners, properties] = await Promise.all([
    prisma.document.findMany({
      where,
      orderBy: {
        updatedAt: "desc",
      },
      take: 100,
      include: {
        owner: true,
        property: true,
        versions: {
          orderBy: {
            version: "desc",
          },
          take: 1,
          select: {
            version: true,
            createdAt: true,
          },
        },
      },
    }),

    prisma.user.findMany({
      where: {
        role: "OWNER",
      },
      orderBy: {
        fullName: "asc",
      },
      select: {
        id: true,
        fullName: true,
      },
    }),

    prisma.property.findMany({
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
      },
    }),
  ]);

  const draftCount = documents.filter(
    (document) => document.status === DocumentStatus.DRAFT
  ).length;

  const finalCount = documents.filter(
    (document) => document.status === DocumentStatus.FINAL
  ).length;

  const issuedCount = documents.filter(
    (document) => document.status === DocumentStatus.ISSUED
  ).length;

  return (
    <>
      <Navigation />

      <AppShell
        title="Documenti"
        subtitle="Report, rendiconti, fatture e documentazione operativa."
      >
        <div style={topBarStyle}>
          <div style={summaryRowStyle}>
            <SummaryBadge
              label="Risultati"
              value={documents.length}
              tone="default"
            />

            <SummaryBadge
              label="Bozze"
              value={draftCount}
              tone="yellow"
            />

            <SummaryBadge
              label="Finali"
              value={finalCount}
              tone="green"
            />

            <SummaryBadge
              label="Emessi"
              value={issuedCount}
              tone="blue"
            />
          </div>

          <Link href="/documents/new" style={primaryButtonStyle}>
            + Nuovo documento
          </Link>
        </div>

        <section style={filtersCardStyle}>
          <div>
            <div style={filterLabelStyle}>Tipo documento</div>

            <div style={filterRowStyle}>
              <FilterLink
                href={buildDocumentsUrl(params, { type: "all" })}
                label="Tutti"
                active={typeFilter === "all"}
              />

              <FilterLink
                href={buildDocumentsUrl(params, {
                  type: "MONTHLY_REPORT",
                })}
                label="Report mensili"
                active={typeFilter === "MONTHLY_REPORT"}
              />

              <FilterLink
                href={buildDocumentsUrl(params, {
                  type: "PROPERTY_STATEMENT",
                })}
                label="Rendiconti immobili"
                active={typeFilter === "PROPERTY_STATEMENT"}
              />

              <FilterLink
                href={buildDocumentsUrl(params, {
                  type: "COMMISSION_INVOICE",
                })}
                label="Fatture commissioni"
                active={typeFilter === "COMMISSION_INVOICE"}
              />

              <FilterLink
                href={buildDocumentsUrl(params, {
                  type: "MAINTENANCE_REPORT",
                })}
                label="Manutenzioni"
                active={typeFilter === "MAINTENANCE_REPORT"}
              />
            </div>
          </div>

          <div>
            <div style={filterLabelStyle}>Stato</div>

            <div style={filterRowStyle}>
              <FilterLink
                href={buildDocumentsUrl(params, { status: "all" })}
                label="Tutti"
                active={statusFilter === "all"}
              />

              <FilterLink
                href={buildDocumentsUrl(params, {
                  status: "DRAFT",
                })}
                label="Bozze"
                active={statusFilter === "DRAFT"}
              />

              <FilterLink
                href={buildDocumentsUrl(params, {
                  status: "FINAL",
                })}
                label="Finali"
                active={statusFilter === "FINAL"}
              />

              <FilterLink
                href={buildDocumentsUrl(params, {
                  status: "ISSUED",
                })}
                label="Emessi"
                active={statusFilter === "ISSUED"}
              />

              <FilterLink
                href={buildDocumentsUrl(params, {
                  status: "ARCHIVED",
                })}
                label="Archiviati"
                active={statusFilter === "ARCHIVED"}
              />
            </div>
          </div>

          <form method="GET" style={selectFiltersStyle}>
            {typeFilter !== "all" && (
              <input type="hidden" name="type" value={typeFilter} />
            )}

            {statusFilter !== "all" && (
              <input
                type="hidden"
                name="status"
                value={statusFilter}
              />
            )}

            <label style={searchLabelStyle}>
              Ricerca

              <input
                name="q"
                defaultValue={searchQuery}
                placeholder="Titolo, numero, owner o immobile"
                style={inputStyle}
              />
            </label>

            <label style={selectLabelStyle}>
              Proprietario

              <select
                name="ownerId"
                defaultValue={ownerFilter}
                style={inputStyle}
              >
                <option value="all">Tutti i proprietari</option>

                {owners.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.fullName}
                  </option>
                ))}
              </select>
            </label>

            <label style={selectLabelStyle}>
              Immobile

              <select
                name="propertyId"
                defaultValue={propertyFilter}
                style={inputStyle}
              >
                <option value="all">Tutti gli immobili</option>

                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </select>
            </label>

            <button type="submit" style={applyFiltersButtonStyle}>
              Applica
            </button>

            <Link href="/documents" style={resetFiltersStyle}>
              Azzera
            </Link>
          </form>
        </section>

        {documents.length === 0 ? (
          <section style={emptyStateStyle}>
            <strong>Nessun documento trovato</strong>

            <p style={{ margin: "7px 0 0", color: "#64748b" }}>
              I report salvati, le fatture e i rendiconti compariranno
              qui.
            </p>
          </section>
        ) : (
          <div style={{ display: "grid", gap: "16px" }}>
            {documents.map((document) => {
              const latestVersion =
                document.versions[0]?.version ??
                document.currentVersion;

              return (
                <section key={document.id} style={documentCardStyle}>
                  <div style={documentHeaderStyle}>
                    <div>
                      <div style={titleRowStyle}>
                        <h2 style={{ margin: 0, fontSize: "20px" }}>
                          <Link
                            href={`/documents/${document.id}`}
                            style={documentTitleStyle}
                          >
                            {document.title}
                          </Link>
                        </h2>

                        <DocumentTypeBadge type={document.type} />
                        <DocumentStatusBadge
                          status={document.status}
                        />
                      </div>

                      <p style={documentSubtitleStyle}>
                        {document.subtitle ??
                          "Nessun sottotitolo"}
                      </p>
                    </div>

                    <div style={documentNumberStyle}>
                      {document.documentNumber ??
                        "Numero non assegnato"}
                    </div>
                  </div>

                  <div style={metricsGridStyle}>
                    <MiniMetric
                      label="Proprietario"
                      value={
                        document.owner?.fullName ??
                        "Non collegato"
                      }
                    />

                    <MiniMetric
                      label="Immobile"
                      value={
                        document.property?.name ??
                        "Portfolio owner"
                      }
                    />

                    <MiniMetric
                      label="Periodo"
                      value={
                        document.referenceMonth
                          ? document.referenceMonth.toLocaleDateString(
                              "it-IT",
                              {
                                month: "long",
                                year: "numeric",
                              }
                            )
                          : "Non definito"
                      }
                    />

                    <MiniMetric
                      label="Versione"
                      value={`v${latestVersion}`}
                    />

                    <MiniMetric
                      label="Ultimo aggiornamento"
                      value={document.updatedAt.toLocaleString(
                        "it-IT"
                      )}
                    />
                  </div>

                  <div style={cardFooterStyle}>
                    <div style={actionRowStyle}>
                      <Link
                        href={`/documents/${document.id}`}
                        style={primarySmallButtonStyle}
                      >
                        Apri
                      </Link>

                      <Link
                        href={`/documents/${document.id}/versions`}
                        style={secondarySmallButtonStyle}
                      >
                        Versioni
                      </Link>

                      <Link
                        href={getSourceHref(document)}
                        style={secondarySmallButtonStyle}
                      >
                        Apri sorgente
                      </Link>
                    </div>

                    <span style={updatedTextStyle}>
                      Creato il{" "}
                      {document.createdAt.toLocaleDateString(
                        "it-IT"
                      )}
                    </span>
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </AppShell>
    </>
  );
}

function buildDocumentsUrl(
  current:
    | {
        type?: string;
        status?: string;
        ownerId?: string;
        propertyId?: string;
        q?: string;
      }
    | undefined,
  changes: {
    type?: string;
    status?: string;
    ownerId?: string;
    propertyId?: string;
    q?: string;
  }
) {
  const values = {
    type: current?.type ?? "all",
    status: current?.status ?? "all",
    ownerId: current?.ownerId ?? "all",
    propertyId: current?.propertyId ?? "all",
    q: current?.q ?? "",
    ...changes,
  };

  const query = new URLSearchParams();

  if (values.type !== "all") {
    query.set("type", values.type);
  }

  if (values.status !== "all") {
    query.set("status", values.status);
  }

  if (values.ownerId !== "all") {
    query.set("ownerId", values.ownerId);
  }

  if (values.propertyId !== "all") {
    query.set("propertyId", values.propertyId);
  }

  if (values.q) {
    query.set("q", values.q);
  }

  const queryString = query.toString();

  return queryString
    ? `/documents?${queryString}`
    : "/documents";
}

function getSourceHref(document: {
  type: DocumentType;
  ownerId: string | null;
  propertyId: string | null;
  referenceMonth: Date | null;
}) {
  const month = document.referenceMonth
    ? `${document.referenceMonth.getFullYear()}-${String(
        document.referenceMonth.getMonth() + 1
      ).padStart(2, "0")}`
    : null;

  if (
    document.type === DocumentType.MONTHLY_REPORT &&
    document.ownerId
  ) {
    return `/reports/monthly?ownerId=${document.ownerId}${
      month ? `&month=${month}` : ""
    }`;
  }

  if (
    document.type === DocumentType.PROPERTY_STATEMENT &&
    document.propertyId
  ) {
    return `/reports/monthly/property?propertyId=${
      document.propertyId
    }${month ? `&month=${month}` : ""}`;
  }

  if (document.ownerId) {
    return `/owners/${document.ownerId}`;
  }

  if (document.propertyId) {
    return `/properties/${document.propertyId}`;
  }

  return "/documents";
}

function isDocumentType(value: string): value is DocumentType {
  return Object.values(DocumentType).includes(
    value as DocumentType
  );
}

function isDocumentStatus(
  value: string
): value is DocumentStatus {
  return Object.values(DocumentStatus).includes(
    value as DocumentStatus
  );
}

function FilterLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "inline-block",
        padding: "9px 13px",
        borderRadius: "999px",
        border: active
          ? "1px solid #0f172a"
          : "1px solid #cbd5e1",
        background: active ? "#0f172a" : "#ffffff",
        color: active ? "#ffffff" : "#334155",
        textDecoration: "none",
        fontSize: "13px",
        fontWeight: 800,
      }}
    >
      {label}
    </Link>
  );
}

function SummaryBadge({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "default" | "yellow" | "green" | "blue";
}) {
  const styles = {
    default: {
      background: "#ffffff",
      color: "#0f172a",
      border: "1px solid #e2e8f0",
    },
    yellow: {
      background: "#fffbeb",
      color: "#a16207",
      border: "1px solid #fde68a",
    },
    green: {
      background: "#ecfdf5",
      color: "#166534",
      border: "1px solid #bbf7d0",
    },
    blue: {
      background: "#eff6ff",
      color: "#1d4ed8",
      border: "1px solid #bfdbfe",
    },
  };

  return (
    <div
      style={{
        ...styles[tone],
        padding: "9px 12px",
        borderRadius: "13px",
        fontSize: "13px",
        fontWeight: 800,
      }}
    >
      {label}: {value}
    </div>
  );
}

function DocumentTypeBadge({
  type,
}: {
  type: DocumentType;
}) {
  return (
    <span style={typeBadgeStyle}>
      {formatEnum(type)}
    </span>
  );
}

function DocumentStatusBadge({
  status,
}: {
  status: DocumentStatus;
}) {
  const style =
    status === DocumentStatus.FINAL ||
    status === DocumentStatus.ISSUED
      ? greenBadgeStyle
      : status === DocumentStatus.ARCHIVED
        ? grayBadgeStyle
        : yellowBadgeStyle;

  return (
    <span style={style}>
      {formatEnum(status)}
    </span>
  );
}

function MiniMetric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div>
      <div style={metricLabelStyle}>{label}</div>
      <strong style={metricValueStyle}>{value}</strong>
    </div>
  );
}

function formatEnum(value: string) {
  return value.replaceAll("_", " ");
}

const topBarStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "16px",
  alignItems: "center",
  marginBottom: "22px",
  flexWrap: "wrap" as const,
};

const summaryRowStyle = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap" as const,
};

const filtersCardStyle = {
  display: "grid",
  gap: "22px",
  marginBottom: "24px",
  padding: "22px",
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "20px",
  boxShadow: "0 8px 26px rgba(15, 23, 42, 0.05)",
};

const filterLabelStyle = {
  marginBottom: "10px",
  color: "#64748b",
  fontSize: "13px",
  fontWeight: 800,
};

const filterRowStyle = {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: "8px",
};

const selectFiltersStyle = {
  display: "flex",
  alignItems: "end",
  gap: "12px",
  flexWrap: "wrap" as const,
  paddingTop: "18px",
  borderTop: "1px solid #e2e8f0",
};

const searchLabelStyle = {
  display: "grid",
  gap: "7px",
  minWidth: "280px",
  flex: 1,
  color: "#475569",
  fontSize: "13px",
  fontWeight: 800,
};

const selectLabelStyle = {
  display: "grid",
  gap: "7px",
  minWidth: "210px",
  color: "#475569",
  fontSize: "13px",
  fontWeight: 800,
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "12px",
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
};

const applyFiltersButtonStyle = {
  padding: "11px 15px",
  borderRadius: "12px",
  border: "1px solid #0f172a",
  background: "#0f172a",
  color: "#ffffff",
  cursor: "pointer",
  fontWeight: 800,
};

const resetFiltersStyle = {
  display: "inline-block",
  padding: "10px 14px",
  borderRadius: "12px",
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#334155",
  textDecoration: "none",
  fontWeight: 800,
};

const documentCardStyle = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "20px",
  padding: "22px",
  boxShadow: "0 8px 26px rgba(15, 23, 42, 0.05)",
};

const documentHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "18px",
  alignItems: "flex-start",
  flexWrap: "wrap" as const,
};

const titleRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: "9px",
  flexWrap: "wrap" as const,
};

const documentTitleStyle = {
  color: "#0f172a",
  textDecoration: "none",
  fontWeight: 850,
};

const documentSubtitleStyle = {
  margin: "8px 0 0",
  color: "#64748b",
};

const documentNumberStyle = {
  color: "#64748b",
  fontSize: "13px",
  fontWeight: 800,
};

const metricsGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(5, minmax(130px, 1fr))",
  gap: "16px",
  marginTop: "20px",
  paddingTop: "18px",
  borderTop: "1px solid #e2e8f0",
};

const cardFooterStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "14px",
  alignItems: "center",
  marginTop: "18px",
  paddingTop: "16px",
  borderTop: "1px solid #e2e8f0",
  flexWrap: "wrap" as const,
};

const actionRowStyle = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap" as const,
};

const primaryButtonStyle = {
  display: "inline-block",
  padding: "11px 16px",
  borderRadius: "12px",
  background: "#0f172a",
  color: "#ffffff",
  textDecoration: "none",
  fontWeight: 800,
};

const primarySmallButtonStyle = {
  display: "inline-block",
  padding: "9px 13px",
  borderRadius: "11px",
  background: "#0f172a",
  color: "#ffffff",
  textDecoration: "none",
  fontSize: "13px",
  fontWeight: 800,
};

const secondarySmallButtonStyle = {
  display: "inline-block",
  padding: "9px 13px",
  borderRadius: "11px",
  background: "#ffffff",
  color: "#334155",
  border: "1px solid #cbd5e1",
  textDecoration: "none",
  fontSize: "13px",
  fontWeight: 800,
};

const updatedTextStyle = {
  color: "#94a3b8",
  fontSize: "12px",
};

const metricLabelStyle = {
  color: "#64748b",
  fontSize: "12px",
  marginBottom: "5px",
};

const metricValueStyle = {
  color: "#0f172a",
  fontSize: "13px",
};

const badgeBaseStyle = {
  display: "inline-block",
  padding: "5px 8px",
  borderRadius: "999px",
  fontSize: "10px",
  fontWeight: 900,
  whiteSpace: "nowrap" as const,
};

const typeBadgeStyle = {
  ...badgeBaseStyle,
  background: "#eff6ff",
  color: "#1d4ed8",
  border: "1px solid #bfdbfe",
};

const greenBadgeStyle = {
  ...badgeBaseStyle,
  background: "#ecfdf5",
  color: "#166534",
  border: "1px solid #bbf7d0",
};

const yellowBadgeStyle = {
  ...badgeBaseStyle,
  background: "#fffbeb",
  color: "#a16207",
  border: "1px solid #fde68a",
};

const grayBadgeStyle = {
  ...badgeBaseStyle,
  background: "#f1f5f9",
  color: "#64748b",
  border: "1px solid #cbd5e1",
};

const emptyStateStyle = {
  padding: "24px",
  borderRadius: "20px",
  background: "#ffffff",
  border: "1px dashed #cbd5e1",
};