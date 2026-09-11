import Link from "next/link";
import {
  DocumentStatus,
  DocumentType,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAccessiblePropertyIds } from "@/lib/auth/guards";

import {
  buildDocumentInsights,
} from "@/lib/intelligence";
import { Navigation } from "@/components/Navigation";
import { AppShell } from "@/components/AppShell";

import { requireUser } from "@/lib/auth/guards";
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
  const user = await requireUser();

  if (user.role === "OPERATOR") {
    throw new Error("Accesso non autorizzato.");
  }
  const params = await searchParams;
  const accessiblePropertyIds = await getAccessiblePropertyIds();

  const typeFilter = params?.type ?? "all";
  const statusFilter = params?.status ?? "all";
  const ownerFilter = params?.ownerId ?? "all";
  const propertyFilter = params?.propertyId ?? "all";
  const searchQuery = params?.q?.trim() ?? "";

  const where: Prisma.DocumentWhereInput = accessiblePropertyIds !== null
    ? { AND: [{ propertyId: { in: accessiblePropertyIds } }] }
    : {};

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
        ...(accessiblePropertyIds !== null
          ? { properties: { some: { id: { in: accessiblePropertyIds } } } }
          : {}),
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
      where: accessiblePropertyIds !== null
        ? { id: { in: accessiblePropertyIds } }
        : undefined,
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

          <Link href="/documents/new" className="inline-flex h-10 items-center rounded-xl border border-[#D8B367]/50 bg-[#D8B367] px-4 text-[10px] font-bold text-[#07111A] shadow-[0_8px_20px_rgba(216,179,103,0.14)] transition hover:bg-[#E3C37E]">
            + Nuovo documento
          </Link>
        </div>

        {documentInsights.length > 0 ? (
          <section className="mb-5 overflow-hidden rounded-2xl border border-white/[0.07] bg-[#09131C]/90 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
            <div className="flex items-center justify-between gap-4 border-b border-white/[0.06] bg-[#0C1822] px-4 py-3">
              <div>
                <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-[#D8B367]">
                  Horizon Intelligence
                </p>

                <p className="mt-0.5 font-serif text-[14px] font-semibold text-[#FFF8EA]">
                  Documenti che richiedono attenzione
                </p>
              </div>

              <span className="rounded-full border border-[#D8B367]/20 bg-[#07111A] px-2.5 py-1 text-[8px] font-bold text-[#D8B367]">
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

        <section className="mb-6 space-y-5 rounded-[20px] border border-white/[0.07] bg-[#09131C]/90 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
          <div>
            <div className="mb-2.5 text-[8px] font-bold uppercase tracking-[0.14em] text-[#82909C]">Tipo documento</div>

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
            <div className="mb-2.5 text-[8px] font-bold uppercase tracking-[0.14em] text-[#82909C]">Stato</div>

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

          <form method="GET" className="flex flex-wrap items-end gap-3 border-t border-white/[0.06] pt-5">
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

            <label className="grid min-w-[280px] flex-1 gap-1.5 text-[9px] font-bold text-[#A4AFB8]">
              Ricerca

              <input
                name="q"
                defaultValue={searchQuery}
                placeholder="Titolo, numero, owner o immobile"
                className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#07111A] px-3 text-[10px] font-medium text-[#E8E1D5] outline-none [color-scheme:dark] transition placeholder:text-[#526472] focus:border-[#D8B367]/60 focus:ring-2 focus:ring-[#D8B367]/10"
              />
            </label>

            <label className="grid min-w-[210px] gap-1.5 text-[9px] font-bold text-[#A4AFB8]">
              Proprietario

              <select
                name="ownerId"
                defaultValue={ownerFilter}
                className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#07111A] px-3 text-[10px] font-medium text-[#E8E1D5] outline-none [color-scheme:dark] transition placeholder:text-[#526472] focus:border-[#D8B367]/60 focus:ring-2 focus:ring-[#D8B367]/10"
              >
                <option value="all">Tutti i proprietari</option>

                {owners.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.fullName}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid min-w-[210px] gap-1.5 text-[9px] font-bold text-[#A4AFB8]">
              Immobile

              <select
                name="propertyId"
                defaultValue={propertyFilter}
                className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#07111A] px-3 text-[10px] font-medium text-[#E8E1D5] outline-none [color-scheme:dark] transition placeholder:text-[#526472] focus:border-[#D8B367]/60 focus:ring-2 focus:ring-[#D8B367]/10"
              >
                <option value="all">Tutti gli immobili</option>

                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </select>
            </label>

            <button type="submit" className="h-10 rounded-xl bg-[#D8B367] px-5 text-[10px] font-bold text-[#07111A] transition hover:bg-[#E3C37E]">
              Applica
            </button>

            <Link href="/documents" className="inline-flex h-10 items-center rounded-xl border border-white/[0.08] bg-[#07111A] px-4 text-[10px] font-bold text-[#A4AFB8] transition hover:border-[#D8B367]/40 hover:text-[#D8B367]">
              Azzera
            </Link>
          </form>
        </section>

        {documents.length === 0 ? (
          <section className="rounded-[20px] border border-dashed border-white/[0.10] bg-[#09131C]/90 px-6 py-10 text-center shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
            <strong>Nessun documento trovato</strong>

            <p className="mt-2 text-[9px] text-[#82909C]">
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
                <section key={document.id} className="group rounded-[20px] border border-white/[0.07] bg-[#09131C]/90 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.18)] transition duration-300 hover:-translate-y-0.5 hover:border-[#D8B367]/25">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="m-0 font-serif text-[16px] font-semibold tracking-[-0.02em] text-[#FFF8EA]">
                          <Link
                            href={`/documents/${document.id}`}
                            className="text-[#FFF8EA] no-underline transition group-hover:text-[#D8B367]"
                          >
                            {document.title}
                          </Link>
                        </h2>

                        <DocumentTypeBadge type={document.type} />
                        <DocumentStatusBadge
                          status={document.status}
                        />
                      </div>

                      <p className="mt-1.5 text-[9px] font-medium text-[#82909C]">
                        {document.subtitle ??
                          "Nessun sottotitolo"}
                      </p>
                    </div>

                    <div className="rounded-lg border border-white/[0.06] bg-[#07111A] px-2.5 py-1.5 text-[8px] font-bold text-[#82909C]">
                      {document.documentNumber ??
                        "Numero non assegnato"}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 border-t border-white/[0.06] pt-4 sm:grid-cols-2 lg:grid-cols-5">
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

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-4">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/documents/${document.id}`}
                        className="inline-flex h-8 items-center rounded-lg bg-[#D8B367] px-3 text-[8px] font-bold text-[#07111A] transition hover:bg-[#E3C37E]"
                      >
                        Apri
                      </Link>

                      <Link
                        href={`/documents/${document.id}/versions`}
                        className="inline-flex h-8 items-center rounded-lg border border-white/[0.08] bg-[#07111A] px-3 text-[8px] font-bold text-[#A4AFB8] transition hover:border-[#D8B367]/40 hover:text-[#D8B367]"
                      >
                        Versioni
                      </Link>

                      <Link
                        href={getSourceHref(document)}
                        className="inline-flex h-8 items-center rounded-lg border border-white/[0.08] bg-[#07111A] px-3 text-[8px] font-bold text-[#A4AFB8] transition hover:border-[#D8B367]/40 hover:text-[#D8B367]"
                      >
                        Apri sorgente
                      </Link>
                    </div>

                    <span className="text-[8px] font-medium text-[#6F7E8A]">
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
          ? "1px solid rgba(216,179,103,0.45)"
          : "1px solid rgba(255,255,255,0.08)",
        background: active ? "rgba(216,179,103,0.10)" : "#07111A",
        color: active ? "#D8B367" : "#A4AFB8",
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
      background: "#09131C",
      color: "#F4EEDF",
      border: "1px solid rgba(255,255,255,0.07)",
    },
    yellow: {
      background: "rgba(216,179,103,0.08)",
      color: "#D8B367",
      border: "1px solid rgba(216,179,103,0.22)",
    },
    green: {
      background: "rgba(16,185,129,0.08)",
      color: "#34D399",
      border: "1px solid rgba(52,211,153,0.20)",
    },
    blue: {
      background: "rgba(56,189,248,0.08)",
      color: "#38BDF8",
      border: "1px solid rgba(56,189,248,0.20)",
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
    <span className="rounded-full border border-sky-400/20 bg-sky-400/[0.08] px-2 py-1 text-[6px] font-bold uppercase tracking-[0.08em] text-sky-300">
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
      ? "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-300"
      : status === DocumentStatus.ARCHIVED
        ? "border-white/[0.08] bg-white/[0.04] text-[#82909C]"
        : "border-amber-400/20 bg-amber-400/[0.08] text-amber-300";

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
      <div className="text-[7px] font-bold uppercase tracking-[0.1em] text-[#6F7E8A]">
        {label}
      </div>

      <strong className="mt-1 block truncate text-[9px] font-semibold text-[#E8E1D5]">
        {value}
      </strong>
    </div>
  );
}
function formatEnum(value: string) {
  return value.replaceAll("_", " ");
}



