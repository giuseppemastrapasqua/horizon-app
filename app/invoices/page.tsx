import Link from "next/link";

import {
  DocumentStatus,
  DocumentType,
  Prisma,
} from "@prisma/client";

import {
  AppShell,
} from "@/components/AppShell";

import {
  Navigation,
} from "@/components/Navigation";

import {
  prisma,
} from "@/lib/prisma";

type InvoicesPageProps = {
  searchParams?: Promise<{
    status?: string;
    ownerId?: string;
    propertyId?: string;
    q?: string;
  }>;
};

export default async function InvoicesPage({
  searchParams,
}: InvoicesPageProps) {
  const params =
    await searchParams;

  const statusFilter =
    params?.status ?? "all";

  const ownerFilter =
    params?.ownerId ?? "all";

  const propertyFilter =
    params?.propertyId ?? "all";

  const searchQuery =
    params?.q?.trim() ?? "";

  const where: Prisma.DocumentWhereInput = {
    type:
      DocumentType.COMMISSION_INVOICE,
  };

  if (
    statusFilter !== "all" &&
    isDocumentStatus(statusFilter)
  ) {
    where.status =
      statusFilter;
  }

  if (ownerFilter !== "all") {
    where.ownerId =
      ownerFilter;
  }

  if (propertyFilter !== "all") {
    where.propertyId =
      propertyFilter;
  }

  if (searchQuery) {
    where.OR = [
      {
        title: {
          contains:
            searchQuery,
          mode:
            "insensitive",
        },
      },
      {
        subtitle: {
          contains:
            searchQuery,
          mode:
            "insensitive",
        },
      },
      {
        documentNumber: {
          contains:
            searchQuery,
          mode:
            "insensitive",
        },
      },
      {
        owner: {
          fullName: {
            contains:
              searchQuery,
            mode:
              "insensitive",
          },
        },
      },
      {
        property: {
          name: {
            contains:
              searchQuery,
            mode:
              "insensitive",
          },
        },
      },
    ];
  }

  const [
    invoices,
    owners,
    properties,
  ] =
    await Promise.all([
      prisma.document.findMany({
        where,
        orderBy: {
          updatedAt:
            "desc",
        },
        include: {
          owner: true,
          property: true,
          versions: {
            orderBy: {
              version:
                "desc",
            },
            take: 1,
            select: {
              version: true,
            },
          },
        },
      }),

      prisma.user.findMany({
        where: {
          role:
            "OWNER",
        },
        orderBy: {
          fullName:
            "asc",
        },
        select: {
          id: true,
          fullName: true,
        },
      }),

      prisma.property.findMany({
        orderBy: {
          name:
            "asc",
        },
        select: {
          id: true,
          name: true,
        },
      }),
    ]);

  const draftCount =
    invoices.filter(
      (invoice) =>
        invoice.status ===
        DocumentStatus.DRAFT,
    ).length;

  const issuedCount =
    invoices.filter(
      (invoice) =>
        invoice.status ===
        DocumentStatus.ISSUED,
    ).length;

  const archivedCount =
    invoices.filter(
      (invoice) =>
        invoice.status ===
        DocumentStatus.ARCHIVED,
    ).length;

  return (
    <>
      <Navigation />

      <AppShell
        title="Fatture"
        subtitle="Fatture commissioni, documenti emessi e storico per proprietario e immobile."
      >
        <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Totali"
            value={invoices.length}
            tone="slate"
          />

          <SummaryCard
            label="Bozze"
            value={draftCount}
            tone="amber"
          />

          <SummaryCard
            label="Emesse"
            value={issuedCount}
            tone="emerald"
          />

          <SummaryCard
            label="Archiviate"
            value={archivedCount}
            tone="blue"
          />
        </div>

        <section className="mb-6 rounded-[20px] border border-slate-200/80 bg-white p-5 shadow-[0_8px_26px_rgba(15,23,42,0.045)]">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[8px] font-black uppercase tracking-[0.14em] text-blue-600">
                Fatturazione
              </p>

              <h2 className="mt-1 text-[16px] font-black tracking-[-0.03em] text-slate-950">
                Fatture commissioni
              </h2>
            </div>

            <Link
              href="/documents?type=COMMISSION_INVOICE"
              className="inline-flex h-9 items-center rounded-xl border border-blue-200 bg-blue-50 px-4 text-[9px] font-bold text-blue-700 transition hover:bg-blue-100"
            >
              Vedi in Documenti
            </Link>
          </div>

          <div className="mb-5 flex flex-wrap gap-2">
            <FilterLink
              href={buildInvoicesUrl(
                params,
                {
                  status:
                    "all",
                },
              )}
              label="Tutte"
              active={
                statusFilter ===
                "all"
              }
            />

            <FilterLink
              href={buildInvoicesUrl(
                params,
                {
                  status:
                    "DRAFT",
                },
              )}
              label="Bozze"
              active={
                statusFilter ===
                "DRAFT"
              }
            />

            <FilterLink
              href={buildInvoicesUrl(
                params,
                {
                  status:
                    "ISSUED",
                },
              )}
              label="Emesse"
              active={
                statusFilter ===
                "ISSUED"
              }
            />

            <FilterLink
              href={buildInvoicesUrl(
                params,
                {
                  status:
                    "ARCHIVED",
                },
              )}
              label="Archiviate"
              active={
                statusFilter ===
                "ARCHIVED"
              }
            />
          </div>

          <form
            method="GET"
            className="flex flex-wrap items-end gap-3 border-t border-slate-100 pt-5"
          >
            {statusFilter !==
            "all" ? (
              <input
                type="hidden"
                name="status"
                value={
                  statusFilter
                }
              />
            ) : null}

            <label className="grid min-w-[280px] flex-1 gap-1.5 text-[9px] font-bold text-slate-500">
              Ricerca

              <input
                name="q"
                defaultValue={
                  searchQuery
                }
                placeholder="Titolo, numero, proprietario o immobile"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-[10px] font-medium text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
              />
            </label>

            <label className="grid min-w-[210px] gap-1.5 text-[9px] font-bold text-slate-500">
              Proprietario

              <select
                name="ownerId"
                defaultValue={
                  ownerFilter
                }
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-[10px] font-medium text-slate-700 outline-none"
              >
                <option value="all">
                  Tutti
                </option>

                {owners.map(
                  (owner) => (
                    <option
                      key={owner.id}
                      value={
                        owner.id
                      }
                    >
                      {
                        owner.fullName
                      }
                    </option>
                  ),
                )}
              </select>
            </label>

            <label className="grid min-w-[210px] gap-1.5 text-[9px] font-bold text-slate-500">
              Immobile

              <select
                name="propertyId"
                defaultValue={
                  propertyFilter
                }
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-[10px] font-medium text-slate-700 outline-none"
              >
                <option value="all">
                  Tutti
                </option>

                {properties.map(
                  (property) => (
                    <option
                      key={
                        property.id
                      }
                      value={
                        property.id
                      }
                    >
                      {
                        property.name
                      }
                    </option>
                  ),
                )}
              </select>
            </label>

            <button
              type="submit"
              className="h-10 rounded-xl bg-[#2563EB] px-5 text-[10px] font-bold text-white shadow-[0_6px_16px_rgba(37,99,235,0.16)] transition hover:bg-[#1D4ED8]"
            >
              Applica
            </button>

            <Link
              href="/invoices"
              className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-[10px] font-bold text-slate-500 transition hover:bg-slate-50"
            >
              Azzera
            </Link>
          </form>
        </section>

        {invoices.length ===
        0 ? (
          <section className="rounded-[20px] border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
            <strong className="text-sm text-slate-800">
              Nessuna fattura trovata
            </strong>

            <p className="mt-2 text-[9px] text-slate-400">
              Le fatture commissioni generate da Horizon compariranno qui.
            </p>
          </section>
        ) : (
          <div className="grid gap-4">
            {invoices.map(
              (invoice) => {
                const latestVersion =
                  invoice
                    .versions[0]
                    ?.version ??
                  invoice.currentVersion;

                return (
                  <section
                    key={
                      invoice.id
                    }
                    className="rounded-[20px] border border-slate-200/80 bg-white p-5 shadow-[0_8px_26px_rgba(15,23,42,0.045)] transition hover:border-blue-200"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/documents/${invoice.id}`}
                            className="text-[15px] font-black tracking-[-0.025em] text-slate-950 transition hover:text-blue-600"
                          >
                            {
                              invoice.title
                            }
                          </Link>

                          <StatusBadge
                            status={
                              invoice.status
                            }
                          />
                        </div>

                        <p className="mt-1.5 text-[9px] text-slate-400">
                          {invoice.subtitle ??
                            "Fattura commissioni Horizon"}
                        </p>
                      </div>

                      <div className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-[8px] font-bold text-slate-400">
                        {invoice.documentNumber ??
                          "Numero non assegnato"}
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2 lg:grid-cols-5">
                      <Metric
                        label="Proprietario"
                        value={
                          invoice
                            .owner
                            ?.fullName ??
                          "Non collegato"
                        }
                      />

                      <Metric
                        label="Immobile"
                        value={
                          invoice
                            .property
                            ?.name ??
                          "Portfolio"
                        }
                      />

                      <Metric
                        label="Periodo"
                        value={
                          invoice.referenceMonth
                            ? invoice.referenceMonth.toLocaleDateString(
                                "it-IT",
                                {
                                  month:
                                    "long",
                                  year:
                                    "numeric",
                                },
                              )
                            : "Non definito"
                        }
                      />

                      <Metric
                        label="Versione"
                        value={`v${latestVersion}`}
                      />

                      <Metric
                        label="Aggiornato"
                        value={invoice.updatedAt.toLocaleDateString(
                          "it-IT",
                        )}
                      />
                    </div>

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                      <div className="flex gap-2">
                        <Link
                          href={`/documents/${invoice.id}`}
                          className="inline-flex h-8 items-center rounded-lg bg-[#2563EB] px-3 text-[8px] font-bold text-white transition hover:bg-[#1D4ED8]"
                        >
                          Apri
                        </Link>

                        <Link
                          href={`/documents/${invoice.id}/versions`}
                          className="inline-flex h-8 items-center rounded-lg border border-slate-200 bg-white px-3 text-[8px] font-bold text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
                        >
                          Versioni
                        </Link>
                      </div>

                      <span className="text-[8px] text-slate-400">
                        Creato il{" "}
                        {invoice.createdAt.toLocaleDateString(
                          "it-IT",
                        )}
                      </span>
                    </div>
                  </section>
                );
              },
            )}
          </div>
        )}
      </AppShell>
    </>
  );
}

function buildInvoicesUrl(
  current:
    | {
        status?: string;
        ownerId?: string;
        propertyId?: string;
        q?: string;
      }
    | undefined,
  changes: {
    status?: string;
    ownerId?: string;
    propertyId?: string;
    q?: string;
  },
) {
  const values = {
    status:
      current?.status ??
      "all",
    ownerId:
      current?.ownerId ??
      "all",
    propertyId:
      current?.propertyId ??
      "all",
    q:
      current?.q ??
      "",
    ...changes,
  };

  const query =
    new URLSearchParams();

  if (
    values.status !==
    "all"
  ) {
    query.set(
      "status",
      values.status,
    );
  }

  if (
    values.ownerId !==
    "all"
  ) {
    query.set(
      "ownerId",
      values.ownerId,
    );
  }

  if (
    values.propertyId !==
    "all"
  ) {
    query.set(
      "propertyId",
      values.propertyId,
    );
  }

  if (values.q) {
    query.set(
      "q",
      values.q,
    );
  }

  const queryString =
    query.toString();

  return queryString
    ? `/invoices?${queryString}`
    : "/invoices";
}

function isDocumentStatus(
  value: string,
): value is DocumentStatus {
  return Object.values(
    DocumentStatus,
  ).includes(
    value as DocumentStatus,
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
      className={[
        "inline-flex h-8 items-center rounded-full border px-3 text-[8px] font-bold transition",
        active
          ? "border-blue-600 bg-blue-600 text-white"
          : "border-slate-200 bg-white text-slate-500 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone:
    | "slate"
    | "amber"
    | "emerald"
    | "blue";
}) {
  const toneClass = {
    slate:
      "border-slate-200 bg-white text-slate-950",
    amber:
      "border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 text-amber-700",
    emerald:
      "border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-700",
    blue:
      "border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 text-blue-700",
  }[tone];

  return (
    <div
      className={[
        "min-h-[72px] rounded-[18px] border px-4 py-3 shadow-[0_8px_22px_rgba(15,23,42,0.04)]",
        toneClass,
      ].join(" ")}
    >
      <p className="text-[7px] font-black uppercase tracking-[0.14em] opacity-60">
        {label}
      </p>

      <strong className="mt-1 block text-[22px] font-black tracking-[-0.05em] tabular-nums">
        {value}
      </strong>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: DocumentStatus;
}) {
  const className =
    status ===
      DocumentStatus.ISSUED ||
    status ===
      DocumentStatus.FINAL
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status ===
          DocumentStatus.ARCHIVED
        ? "border-slate-200 bg-slate-100 text-slate-500"
        : "border-amber-200 bg-amber-50 text-amber-700";

  return (
    <span
      className={[
        "rounded-full border px-2 py-1 text-[6px] font-black uppercase tracking-[0.08em]",
        className,
      ].join(" ")}
    >
      {status.replaceAll(
        "_",
        " ",
      )}
    </span>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value:
    | string
    | number;
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
