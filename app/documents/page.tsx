import Link from "next/link";
import {
  DocumentStatus,
  DocumentType,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

import {
  buildDocumentInsights,
} from "@/lib/intelligence";
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

  const documentInsights =
    buildDocumentInsights({
      documents:
        documents.map(
          (document) => ({
            id: document.id,
            title: document.title,
            type: document.type,
            status: document.status,
            referenceMonth: document.referenceMonth,
            updatedAt: document.updatedAt,
            propertyId: document.propertyId,
            propertyName:
              document.property?.name ?? null,
          }),
        ),
    });

  return (
    <>
      <Navigation />

      <AppShell
        title="Documenti"
        subtitle="Report, rendiconti, fatture e documentazione operativa."
      >
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div className="grid flex-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
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

          <Link href="/documents/new" className="inline-flex h-10 items-center rounded-xl bg-[#2563EB] px-4 text-[10px] font-bold text-white shadow-[0_8px_20px_rgba(37,99,235,0.20)] transition hover:-translate-y-0.5 hover:bg-[#1D4ED8]">
            + Nuovo documento
          </Link>
        </div>

        {documentInsights.length > 0 ? (
          <section className="mb-5 overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
            <div className="flex items-center justify-between gap-4 border-b border-blue-100 bg-blue-50/60 px-4 py-3">
              <div>
                <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-blue-600">
                  Horizon Intelligence
                </p>

                <p className="mt-0.5 text-[11px] font-bold text-slate-900">
                  Documenti che richiedono attenzione
                </p>
              </div>

              <span className="rounded-full bg-white px-2.5 py-1 text-[8px] font-bold text-blue-700 shadow-sm">
                {documentInsights.length}
                {" "}
                {documentInsights.length === 1
                  ? "segnale"
                  : "segnali"}
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {documentInsights.map(
                (insight) => {
                  const warning =
                    insight.severity ===
                    "WARNING";

                  return (
                    <div
                      key={insight.id}
                      className="flex flex-col gap-3 px-4 py-3.5 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-[10px] font-bold text-slate-900">
                            {insight.title}
                          </p>

                          <span
                            className={[
                              "rounded-full px-2 py-0.5 text-[7px] font-bold uppercase tracking-[0.08em]",
                              warning
                                ? "bg-amber-50 text-amber-600"
                                : "bg-blue-50 text-blue-600",
                            ].join(" ")}
                          >
                            {warning
                              ? "Attenzione"
                              : "Informazione"}
                          </span>
                        </div>

                        <p className="mt-1 text-[9px] leading-4 text-slate-500">
                          {insight.explanation}
                        </p>

                        <p className="mt-1 text-[8px] font-semibold text-slate-400">
                          {insight.propertyName}
                        </p>
                      </div>

                      {insight.action?.href ? (
                        <Link
                          href={
                            insight.action
                              .href
                          }
                          className="inline-flex h-8 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 px-3 text-[8px] font-bold text-blue-700 transition hover:border-blue-200 hover:bg-blue-100"
                        >
                          {
                            insight.action
                              .label
                          }
                        </Link>
                      ) : null}
                    </div>
                  );
                },
              )}
            </div>
          </section>
        ) : null}

        <section className="mb-6 space-y-5 rounded-[20px] border border-slate-200/80 bg-white p-5 shadow-[0_8px_26px_rgba(15,23,42,0.045)]">
          <div>
            <div className="mb-2.5 text-[8px] font-black uppercase tracking-[0.14em] text-slate-400">Tipo documento</div>

            <div className="flex flex-wrap gap-2">
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
            <div className="mb-2.5 text-[8px] font-black uppercase tracking-[0.14em] text-slate-400">Stato</div>

            <div className="flex flex-wrap gap-2">
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

          <form method="GET" className="flex flex-wrap items-end gap-3 border-t border-slate-100 pt-5">
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

            <label className="grid min-w-[280px] flex-1 gap-1.5 text-[9px] font-bold text-slate-500">
              Ricerca

              <input
                name="q"
                defaultValue={searchQuery}
                placeholder="Titolo, numero, owner o immobile"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-[10px] font-medium text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
              />
            </label>

            <label className="grid min-w-[210px] gap-1.5 text-[9px] font-bold text-slate-500">
              Proprietario

              <select
                name="ownerId"
                defaultValue={ownerFilter}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-[10px] font-medium text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
              >
                <option value="all">Tutti i proprietari</option>

                {owners.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.fullName}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid min-w-[210px] gap-1.5 text-[9px] font-bold text-slate-500">
              Immobile

              <select
                name="propertyId"
                defaultValue={propertyFilter}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-[10px] font-medium text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
              >
                <option value="all">Tutti gli immobili</option>

                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </select>
            </label>

            <button type="submit" className="h-10 rounded-xl bg-[#2563EB] px-5 text-[10px] font-bold text-white shadow-[0_6px_16px_rgba(37,99,235,0.16)] transition hover:bg-[#1D4ED8]">
              Applica
            </button>

            <Link href="/documents" className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-[10px] font-bold text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600">
              Azzera
            </Link>
          </form>
        </section>

        {documents.length === 0 ? (
          <section className="rounded-[20px] border border-dashed border-slate-300 bg-white px-6 py-10 text-center shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
            <strong>Nessun documento trovato</strong>

            <p className="mt-2 text-[9px] text-slate-400">
              I report salvati, le fatture e i rendiconti compariranno
              qui.
            </p>
          </section>
        ) : (
          <div className="grid gap-4">
            {documents.map((document) => {
              const latestVersion =
                document.versions[0]?.version ??
                document.currentVersion;

              return (
                <section key={document.id} className="group rounded-[20px] border border-slate-200/80 bg-white p-5 shadow-[0_8px_26px_rgba(15,23,42,0.045)] transition duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_16px_36px_rgba(37,99,235,0.08)]">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="m-0 text-[15px] font-black tracking-[-0.025em] text-slate-950">
                          <Link
                            href={`/documents/${document.id}`}
                            className="text-slate-950 no-underline transition group-hover:text-blue-600"
                          >
                            {document.title}
                          </Link>
                        </h2>

                        <DocumentTypeBadge type={document.type} />
                        <DocumentStatusBadge
                          status={document.status}
                        />
                      </div>

                      <p className="mt-1.5 text-[9px] font-medium text-slate-400">
                        {document.subtitle ??
                          "Nessun sottotitolo"}
                      </p>
                    </div>

                    <div className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-[8px] font-bold text-slate-400">
                      {document.documentNumber ??
                        "Numero non assegnato"}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2 lg:grid-cols-5">
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

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/documents/${document.id}`}
                        className="inline-flex h-8 items-center rounded-lg bg-[#2563EB] px-3 text-[8px] font-bold text-white transition hover:bg-[#1D4ED8]"
                      >
                        Apri
                      </Link>

                      <Link
                        href={`/documents/${document.id}/versions`}
                        className="inline-flex h-8 items-center rounded-lg border border-slate-200 bg-white px-3 text-[8px] font-bold text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                      >
                        Versioni
                      </Link>

                      <Link
                        href={getSourceHref(document)}
                        className="inline-flex h-8 items-center rounded-lg border border-slate-200 bg-white px-3 text-[8px] font-bold text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                      >
                        Apri sorgente
                      </Link>
                    </div>

                    <span className="text-[8px] font-medium text-slate-400">
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
    <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-[6px] font-black uppercase tracking-[0.08em] text-blue-700">
      {formatEnum(type)}
    </span>
  );
}

function DocumentStatusBadge({
  status,
}: {
  status: DocumentStatus;
}) {
  const className =
    status === DocumentStatus.FINAL ||
    status === DocumentStatus.ISSUED
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === DocumentStatus.ARCHIVED
        ? "border-slate-200 bg-slate-100 text-slate-500"
        : "border-amber-200 bg-amber-50 text-amber-700";

  return (
    <span
      className={[
        "rounded-full border px-2 py-1 text-[6px] font-black uppercase tracking-[0.08em]",
        className,
      ].join(" ")}
    >
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
    <div className="min-w-0">
      <div className="text-[7px] font-bold uppercase tracking-[0.1em] text-slate-400">
        {label}
      </div>

      <strong className="mt-1 block truncate text-[9px] font-bold text-slate-700">
        {value}
      </strong>
    </div>
  );
}
function formatEnum(value: string) {
  return value.replaceAll("_", " ");
}



