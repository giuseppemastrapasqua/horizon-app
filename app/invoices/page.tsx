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
import { getAccessiblePropertyIds } from "@/lib/auth/guards";
import { BillingIssuerProfileCard } from "@/components/invoices/BillingIssuerProfileCard";

import { requireUser } from "@/lib/auth/guards";
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
  const user = await requireUser();

  if (user.role === "OPERATOR") {
    throw new Error("Accesso non autorizzato.");
  }
  const params =
    await searchParams;
  const accessiblePropertyIds = await getAccessiblePropertyIds();

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
    ...(accessiblePropertyIds !== null
      ? { AND: [{ propertyId: { in: accessiblePropertyIds } }] }
      : {}),
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
    billingIssuerProfile,
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
          ...(accessiblePropertyIds !== null
            ? { properties: { some: { id: { in: accessiblePropertyIds } } } }
            : {}),
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
        where: accessiblePropertyIds !== null
          ? { id: { in: accessiblePropertyIds } }
          : undefined,
        orderBy: {
          name:
            "asc",
        },
        select: {
          id: true,
          name: true,
        },
      }),

      prisma.billingIssuerProfile.findUnique({
        where: { profileKey: "DEFAULT" },
        select: {
          businessName: true,
          vatNumber: true,
          taxCode: true,
          address: true,
          postalCode: true,
          city: true,
          province: true,
          country: true,
          email: true,
          pec: true,
        logoPath: true,
        },
      })
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
        <BillingIssuerProfileCard profile={billingIssuerProfile} />

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

        <section className="mb-6 rounded-[20px] border border-white/[0.07] bg-[#09131C]/90 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-[#D8B367]">
                Fatturazione
              </p>

              <h2 className="mt-1 font-serif text-[16px] font-semibold tracking-[-0.02em] text-[#FFF8EA]">
                Fatture commissioni
              </h2>
            </div>

            <Link
              href="/documents?type=COMMISSION_INVOICE"
              className="inline-flex h-9 items-center rounded-xl border border-[#D8B367]/30 bg-[#D8B367]/[0.06] px-4 text-[9px] font-bold text-[#D8B367] transition hover:border-[#D8B367]/50 hover:bg-[#D8B367]/[0.10]"
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

            <label className="grid min-w-[280px] flex-1 gap-1.5 text-[9px] font-bold text-[#A4AFB8]">
              Ricerca

              <input
                name="q"
                defaultValue={
                  searchQuery
                }
                placeholder="Titolo, numero, proprietario o immobile"
                className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#07111A] px-3 text-[10px] font-medium text-[#E8E1D5] outline-none [color-scheme:dark] transition placeholder:text-[#526472] focus:border-[#D8B367]/60 focus:ring-2 focus:ring-[#D8B367]/10"
              />
            </label>

            <label className="grid min-w-[210px] gap-1.5 text-[9px] font-bold text-[#A4AFB8]">
              Proprietario

              <select
                name="ownerId"
                defaultValue={
                  ownerFilter
                }
                className="h-10 rounded-xl border border-white/[0.08] bg-[#07111A] px-3 text-[10px] font-medium text-[#E8E1D5] outline-none [color-scheme:dark] focus:border-[#D8B367]/60 focus:ring-2 focus:ring-[#D8B367]/10"
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

            <label className="grid min-w-[210px] gap-1.5 text-[9px] font-bold text-[#A4AFB8]">
              Immobile

              <select
                name="propertyId"
                defaultValue={
                  propertyFilter
                }
                className="h-10 rounded-xl border border-white/[0.08] bg-[#07111A] px-3 text-[10px] font-medium text-[#E8E1D5] outline-none [color-scheme:dark] focus:border-[#D8B367]/60 focus:ring-2 focus:ring-[#D8B367]/10"
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
              className="h-10 rounded-xl bg-[#D8B367] px-5 text-[10px] font-bold text-[#07111A] transition hover:bg-[#E3C37E]"
            >
              Applica
            </button>

            <Link
              href="/invoices"
              className="inline-flex h-10 items-center rounded-xl border border-white/[0.08] bg-[#07111A] px-4 text-[10px] font-bold text-[#A4AFB8] transition hover:border-[#D8B367]/40 hover:text-[#D8B367]"
            >
              Azzera
            </Link>
          </form>
        </section>

        {invoices.length ===
        0 ? (
          <section className="rounded-[20px] border border-dashed border-white/[0.10] bg-[#09131C]/90 px-6 py-10 text-center">
            <strong className="font-serif text-sm font-semibold text-[#FFF8EA]">
              Nessuna fattura trovata
            </strong>

            <p className="mt-2 text-[9px] text-[#82909C]">
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
                    className="rounded-[20px] border border-white/[0.07] bg-[#09131C]/90 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.18)] transition hover:border-[#D8B367]/25"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/invoices/${invoice.id}/pdf`}
                            className="font-serif text-[15px] font-semibold tracking-[-0.02em] text-[#FFF8EA] transition hover:text-[#D8B367]"
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

                      <div className="rounded-lg border border-white/[0.06] bg-[#07111A] px-2.5 py-1.5 text-[8px] font-bold text-[#82909C]">
                        {invoice.documentNumber ??
                          "Numero non assegnato"}
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 border-t border-white/[0.06] pt-4 sm:grid-cols-2 lg:grid-cols-5">
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

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-4">
                      <div className="flex gap-2">
                        <Link
                          href={`/invoices/${invoice.id}/pdf`}
                          className="inline-flex h-8 items-center rounded-lg bg-[#D8B367] px-3 text-[8px] font-bold !text-[#07111A] transition hover:bg-[#E3C37E]"
                        >
                          Apri PDF
                        </Link>

                      </div>

                      <span className="text-[8px] text-[#6F7E8A]">
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
          ? "border-[#D8B367]/45 bg-[#D8B367]/[0.10] text-[#D8B367]"
          : "border-white/[0.08] bg-[#07111A] text-[#A4AFB8] hover:border-[#D8B367]/35 hover:text-[#D8B367]",
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
      "border-white/[0.07] bg-[#09131C] text-[#F4EEDF]",
    amber:
      "border-[#D8B367]/25 bg-[#D8B367]/[0.07] text-[#D8B367]",
    emerald:
      "border-emerald-400/20 bg-emerald-400/[0.07] text-emerald-300",
    blue:
      "border-sky-400/20 bg-sky-400/[0.07] text-sky-300",
  }[tone];

  return (
    <div
      className={[
        "min-h-[72px] rounded-[18px] border px-4 py-3 shadow-[0_14px_36px_rgba(0,0,0,0.16)]",
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
      ? "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-300"
      : status ===
          DocumentStatus.ARCHIVED
        ? "border-white/[0.08] bg-white/[0.04] text-[#82909C]"
        : "border-amber-400/20 bg-amber-400/[0.08] text-amber-300";

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
      <div className="text-[7px] font-bold uppercase tracking-[0.1em] text-[#6F7E8A]">
        {label}
      </div>

      <strong className="mt-1 block truncate text-[9px] font-semibold text-[#E8E1D5]">
        {value}
      </strong>
    </div>
  );
}
