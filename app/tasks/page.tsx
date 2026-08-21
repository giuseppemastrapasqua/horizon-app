import Link from "next/link";

import {
  Prisma,
  TaskStatus,
  TaskType,
} from "@prisma/client";

import {
  AlertTriangle,
  Building2,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Filter,
  Plus,
  RotateCcw,
  UserRound,
} from "lucide-react";

import {
  AppShell,
} from "@/components/AppShell";

import {
  Navigation,
} from "@/components/Navigation";

import {
  prisma,
} from "@/lib/prisma";

import {
  buildTaskInsights,
} from "@/lib/intelligence";

import {
  markTaskDone,
  reopenTask,
} from "./actions";

type TasksPageProps = {
  searchParams?: Promise<{
    status?: string;
    due?: string;
    type?: string;
    propertyId?: string;
    linked?: string;
  }>;
};

export default async function TasksPage({
  searchParams,
}: TasksPageProps) {
  const params =
    await searchParams;

  const statusFilter =
    params?.status ?? "all";

  const dueFilter =
    params?.due ?? "all";

  const typeFilter =
    params?.type ?? "all";

  const propertyFilter =
    params?.propertyId ?? "all";

  const linkedFilter =
    params?.linked ?? "all";

  const now =
    new Date();

  const startOfToday =
    new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

  const startOfTomorrow =
    new Date(startOfToday);

  startOfTomorrow.setDate(
    startOfTomorrow.getDate() +
      1,
  );

  const endOfNextThreeDays =
    new Date(startOfToday);

  endOfNextThreeDays.setDate(
    endOfNextThreeDays.getDate() +
      3,
  );

  const where:
    Prisma.TaskWhereInput = {};

  if (
    statusFilter === "open"
  ) {
    where.status = {
      in: [
        TaskStatus.TODO,
        TaskStatus.IN_PROGRESS,
      ],
    };
  }

  if (
    statusFilter === "done"
  ) {
    where.status =
      TaskStatus.DONE;
  }

  if (
    typeFilter !== "all" &&
    isTaskType(typeFilter)
  ) {
    where.type =
      typeFilter;
  }

  if (
    propertyFilter !== "all"
  ) {
    where.propertyId =
      propertyFilter;
  }

  if (
    linkedFilter ===
    "booking"
  ) {
    where.bookingId = {
      not: null,
    };
  }

  if (
    linkedFilter ===
    "manual"
  ) {
    where.bookingId =
      null;
  }

  if (
    dueFilter === "overdue"
  ) {
    where.dueDate = {
      lt: startOfToday,
    };

    where.status = {
      in: [
        TaskStatus.TODO,
        TaskStatus.IN_PROGRESS,
      ],
    };
  }

  if (
    dueFilter === "today"
  ) {
    where.dueDate = {
      gte: startOfToday,
      lt: startOfTomorrow,
    };
  }

  if (
    dueFilter === "3days"
  ) {
    where.dueDate = {
      gte: startOfToday,
      lt: endOfNextThreeDays,
    };
  }

  if (
    dueFilter === "future"
  ) {
    where.dueDate = {
      gte: startOfTomorrow,
    };
  }

  const [
    tasks,
    properties,
  ] =
    await Promise.all([
      prisma.task.findMany({
        where,

        orderBy: [
          {
            dueDate: "asc",
          },
          {
            createdAt:
              "desc",
          },
        ],

        include: {
          property: true,
          booking: true,
          owner: true,
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

  const openTaskCount =
    tasks.filter(
      (task) =>
        task.status !==
        TaskStatus.DONE,
    ).length;

  const inProgressCount =
    tasks.filter(
      (task) =>
        task.status ===
        TaskStatus.IN_PROGRESS,
    ).length;

  const overdueTaskCount =
    tasks.filter(
      (task) =>
        task.status !==
          TaskStatus.DONE &&
        task.dueDate &&
        task.dueDate <
          startOfToday,
    ).length;

  const taskInsights =
    buildTaskInsights({
      tasks:
        tasks.map(
          (task) => ({
            id:
              task.id,

            title:
              task.title,

            type:
              task.type,

            status:
              task.status,

            dueDate:
              task.dueDate,

            ownerId:
              task.ownerId,

            propertyId:
              task.propertyId,

            propertyName:
              task.property.name,
          }),
        ),

      now,
    });

  return (
    <>
      <Navigation />

      <AppShell
        title="Task operativi"
        subtitle="Pulizie, manutenzioni e attivitÃ  operative collegate a immobili e prenotazioni."
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <SummaryCard
              label="Risultati"
              value={
                tasks.length
              }
              tone="blue"
            />

            <SummaryCard
              label="Aperti"
              value={
                openTaskCount
              }
              tone="slate"
            />

            <SummaryCard
              label="In corso"
              value={
                inProgressCount
              }
              tone="amber"
            />

            <SummaryCard
              label="Scaduti"
              value={
                overdueTaskCount
              }
              tone="rose"
            />
          </div>

          <Link
            href="/tasks/new"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#2563EB] px-4 text-[10px] font-semibold text-white shadow-[0_8px_20px_rgba(37,99,235,0.18)] transition hover:bg-[#1D4ED8]"
          >
            <Plus size={14} />

            Nuovo task
          </Link>
        </div>

        {taskInsights.length > 0 ? (
          <section className="mb-4 overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
            <div className="flex items-center justify-between gap-4 border-b border-blue-100 bg-blue-50/60 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0B3C98] text-white">
                  <ClipboardCheck
                    size={14}
                  />
                </span>

                <div>
                  <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-blue-600">
                    Horizon Intelligence
                  </p>

                  <p className="mt-0.5 text-[11px] font-bold text-slate-900">
                    Attività che richiedono attenzione
                  </p>
                </div>
              </div>

              <span className="rounded-full bg-white px-2.5 py-1 text-[8px] font-bold text-blue-700 shadow-sm">
                {taskInsights.length}
                {" "}
                {taskInsights.length === 1
                  ? "segnale"
                  : "segnali"}
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {taskInsights.map(
                (insight) => {
                  const critical =
                    insight.severity ===
                    "CRITICAL";

                  const warning =
                    insight.severity ===
                    "WARNING";

                  return (
                    <div
                      key={insight.id}
                      className="flex flex-col gap-3 px-4 py-3.5 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="flex min-w-0 gap-3">
                        <span
                          className={[
                            "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                            critical
                              ? "bg-red-50 text-red-600"
                              : warning
                                ? "bg-amber-50 text-amber-600"
                                : "bg-blue-50 text-blue-600",
                          ].join(" ")}
                        >
                          {critical ||
                          warning ? (
                            <AlertTriangle
                              size={13}
                            />
                          ) : (
                            <CalendarClock
                              size={13}
                            />
                          )}
                        </span>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-[10px] font-bold text-slate-900">
                              {insight.title}
                            </p>

                            <span
                              className={[
                                "rounded-full px-2 py-0.5 text-[7px] font-bold uppercase tracking-[0.08em]",
                                critical
                                  ? "bg-red-50 text-red-600"
                                  : warning
                                    ? "bg-amber-50 text-amber-600"
                                    : "bg-blue-50 text-blue-600",
                              ].join(" ")}
                            >
                              {critical
                                ? "Critico"
                                : warning
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
                      </div>

                      {insight.action?.href ? (
                        <Link
                          href={
                            insight.action
                              .href
                          }
                          className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-blue-100 bg-blue-50 px-3 text-[8px] font-bold text-blue-700 transition hover:border-blue-200 hover:bg-blue-100"
                        >
                          {
                            insight.action
                              .label
                          }

                          <ChevronRight
                            size={11}
                          />
                        </Link>
                      ) : null}
                    </div>
                  );
                },
              )}
            </div>
          </section>
        ) : null}

        <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_6px_20px_rgba(15,23,42,0.04)]">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#2563EB]">
              <Filter
                size={14}
              />
            </span>

            <div>
              <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Filtri operativi
              </p>

              <p className="text-[10px] font-semibold text-slate-700">
                Restringi le attivitÃ  da visualizzare
              </p>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <FilterGroup
              label="Stato"
            >
              <FilterLink
                href={buildTaskUrl(
                  params,
                  {
                    status:
                      "all",
                  },
                )}
                label="Tutti"
                active={
                  statusFilter ===
                  "all"
                }
              />

              <FilterLink
                href={buildTaskUrl(
                  params,
                  {
                    status:
                      "open",
                  },
                )}
                label="Aperti"
                active={
                  statusFilter ===
                  "open"
                }
              />

              <FilterLink
                href={buildTaskUrl(
                  params,
                  {
                    status:
                      "done",
                  },
                )}
                label="Completati"
                active={
                  statusFilter ===
                  "done"
                }
              />
            </FilterGroup>

            <FilterGroup
              label="Scadenza"
            >
              <FilterLink
                href={buildTaskUrl(
                  params,
                  {
                    due: "all",
                  },
                )}
                label="Tutte"
                active={
                  dueFilter ===
                  "all"
                }
              />

              <FilterLink
                href={buildTaskUrl(
                  params,
                  {
                    due:
                      "overdue",
                  },
                )}
                label="Scaduti"
                active={
                  dueFilter ===
                  "overdue"
                }
              />

              <FilterLink
                href={buildTaskUrl(
                  params,
                  {
                    due:
                      "today",
                  },
                )}
                label="Oggi"
                active={
                  dueFilter ===
                  "today"
                }
              />

              <FilterLink
                href={buildTaskUrl(
                  params,
                  {
                    due:
                      "3days",
                  },
                )}
                label="3 giorni"
                active={
                  dueFilter ===
                  "3days"
                }
              />

              <FilterLink
                href={buildTaskUrl(
                  params,
                  {
                    due:
                      "future",
                  },
                )}
                label="Futuri"
                active={
                  dueFilter ===
                  "future"
                }
              />
            </FilterGroup>

            <FilterGroup
              label="Collegamento"
            >
              <FilterLink
                href={buildTaskUrl(
                  params,
                  {
                    linked:
                      "all",
                  },
                )}
                label="Tutti"
                active={
                  linkedFilter ===
                  "all"
                }
              />

              <FilterLink
                href={buildTaskUrl(
                  params,
                  {
                    linked:
                      "booking",
                  },
                )}
                label="Prenotazione"
                active={
                  linkedFilter ===
                  "booking"
                }
              />

              <FilterLink
                href={buildTaskUrl(
                  params,
                  {
                    linked:
                      "manual",
                  },
                )}
                label="Solo immobile"
                active={
                  linkedFilter ===
                  "manual"
                }
              />
            </FilterGroup>
          </div>

          <form
            method="GET"
            className="mt-4 flex flex-wrap items-end gap-3 border-t border-slate-100 pt-4"
          >
            {statusFilter !==
              "all" && (
              <input
                type="hidden"
                name="status"
                value={
                  statusFilter
                }
              />
            )}

            {dueFilter !==
              "all" && (
              <input
                type="hidden"
                name="due"
                value={
                  dueFilter
                }
              />
            )}

            {linkedFilter !==
              "all" && (
              <input
                type="hidden"
                name="linked"
                value={
                  linkedFilter
                }
              />
            )}

            <label className="grid min-w-[220px] gap-1.5">
              <span className="text-[8px] font-semibold text-slate-500">
                Immobile
              </span>

              <select
                name="propertyId"
                defaultValue={
                  propertyFilter
                }
                className={selectClass}
              >
                <option value="all">
                  Tutti gli immobili
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

            <label className="grid min-w-[210px] gap-1.5">
              <span className="text-[8px] font-semibold text-slate-500">
                Tipo task
              </span>

              <select
                name="type"
                defaultValue={
                  typeFilter
                }
                className={selectClass}
              >
                <option value="all">
                  Tutti i tipi
                </option>

                <option value="CLEANING">
                  Pulizie
                </option>

                <option value="MAINTENANCE">
                  Manutenzione
                </option>

                <option value="GUEST_DOCUMENTS">
                  Documenti ospite
                </option>

                <option value="CHECK_IN">
                  Check-in
                </option>

                <option value="CHECK_OUT">
                  Check-out
                </option>

                <option value="ADMIN">
                  Amministrazione
                </option>

                <option value="ISSUE">
                  Segnalazione
                </option>
              </select>
            </label>

            <button
              type="submit"
              className="h-10 rounded-xl bg-slate-900 px-4 text-[9px] font-semibold text-white transition hover:bg-slate-800"
            >
              Applica filtri
            </button>

            <Link
              href="/tasks"
              className="flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-[9px] font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
            >
              Azzera
            </Link>
          </form>
        </section>

        {tasks.length ===
        0 ? (
          <section className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
            <ClipboardCheck
              size={24}
              className="mx-auto text-blue-400"
            />

            <h2 className="mt-3 text-[14px] font-bold text-slate-900">
              Nessun task trovato
            </h2>

            <p className="mt-1 text-[10px] text-slate-400">
              Modifica i filtri oppure crea un nuovo task operativo.
            </p>
          </section>
        ) : (
          <div className="grid gap-3">
            {tasks.map(
              (task) => {
                const isOverdue =
                  Boolean(
                    task.status !==
                      TaskStatus.DONE &&
                      task.dueDate &&
                      task.dueDate <
                        startOfToday,
                  );

                const isDueToday =
                  Boolean(
                    task.dueDate &&
                      task.dueDate >=
                        startOfToday &&
                      task.dueDate <
                        startOfTomorrow,
                  );

                return (
                  <article
                    key={
                      task.id
                    }
                    className={[
                      "relative overflow-hidden rounded-2xl border bg-white shadow-[0_6px_20px_rgba(15,23,42,0.04)]",
                      isOverdue
                        ? "border-rose-200"
                        : isDueToday
                          ? "border-amber-200"
                          : "border-slate-200",
                    ].join(
                      " ",
                    )}
                  >
                    <div
                      className={[
                        "absolute inset-y-0 left-0 w-1",
                        isOverdue
                          ? "bg-rose-500"
                          : isDueToday
                            ? "bg-amber-400"
                            : task.status ===
                                TaskStatus.DONE
                              ? "bg-emerald-400"
                              : "bg-blue-400",
                      ].join(
                        " ",
                      )}
                    />

                    <div className="p-4 pl-5">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <TaskTypeBadge
                              type={
                                task.type
                              }
                            />

                            {isOverdue ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-1 text-[7px] font-bold uppercase tracking-[0.08em] text-rose-700">
                                <AlertTriangle
                                  size={
                                    9
                                  }
                                />
                                Scaduto
                              </span>
                            ) : null}

                            {isDueToday &&
                            !isOverdue ? (
                              <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[7px] font-bold uppercase tracking-[0.08em] text-amber-700">
                                Oggi
                              </span>
                            ) : null}
                          </div>

                          <Link
                            href={`/tasks/${task.id}`}
                            className="mt-2 block truncate text-[15px] font-bold tracking-[-0.03em] text-slate-950 transition hover:text-[#2563EB]"
                          >
                            {
                              task.title
                            }
                          </Link>

                          <p className="mt-1 line-clamp-2 max-w-3xl text-[10px] leading-4 text-slate-400">
                            {task.description ??
                              "Nessuna descrizione"}
                          </p>
                        </div>

                        <StatusBadge
                          status={
                            task.status
                          }
                        />
                      </div>

                      <div className="mt-4 grid gap-2 border-t border-slate-100 pt-3 sm:grid-cols-2 xl:grid-cols-4">
                        <TaskMetric
                          icon={
                            <Building2
                              size={
                                12
                              }
                            />
                          }
                          label="Immobile"
                        >
                          <Link
                            href={`/properties/${task.property.id}`}
                            className="truncate font-bold text-[#2563EB] hover:underline"
                          >
                            {
                              task
                                .property
                                .name
                            }
                          </Link>
                        </TaskMetric>

                        <TaskMetric
                          icon={
                            <UserRound
                              size={
                                12
                              }
                            />
                          }
                          label="Responsabile"
                        >
                          {task.owner
                            ?.fullName ??
                            "Da assegnare"}
                        </TaskMetric>

                        <TaskMetric
                          icon={
                            <CalendarClock
                              size={
                                12
                              }
                            />
                          }
                          label="Scadenza"
                        >
                          {task.dueDate
                            ? new Date(
                                task.dueDate,
                              ).toLocaleString(
                                "it-IT",
                                {
                                  dateStyle:
                                    "short",
                                  timeStyle:
                                    "short",
                                },
                              )
                            : "Non impostata"}
                        </TaskMetric>

                        <TaskMetric
                          icon={
                            <CalendarDays
                              size={
                                12
                              }
                            />
                          }
                          label="Prenotazione"
                        >
                          {task.booking ? (
                            <Link
                              href={`/bookings/${task.booking.id}`}
                              className="truncate font-bold text-[#2563EB] hover:underline"
                            >
                              {
                                task
                                  .booking
                                  .guestName
                              }
                            </Link>
                          ) : (
                            "Solo immobile"
                          )}
                        </TaskMetric>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                        <Link
                          href={`/tasks/${task.id}`}
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[8px] font-semibold text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#2563EB]"
                        >
                          Dettaglio
                          <ChevronRight
                            size={
                              11
                            }
                          />
                        </Link>

                        {task.status !==
                        TaskStatus.DONE ? (
                          <form
                            action={markTaskDone.bind(
                              null,
                              task.id,
                            )}
                          >
                            <button
                              type="submit"
                              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#2563EB] px-3 text-[8px] font-semibold text-white transition hover:bg-[#1D4ED8]"
                            >
                              <CheckCircle2
                                size={
                                  11
                                }
                              />
                              Completa
                            </button>
                          </form>
                        ) : (
                          <form
                            action={reopenTask.bind(
                              null,
                              task.id,
                            )}
                          >
                            <button
                              type="submit"
                              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 text-[8px] font-semibold text-[#2563EB] transition hover:bg-blue-100"
                            >
                              <RotateCcw
                                size={
                                  10
                                }
                              />
                              Riapri
                            </button>
                          </form>
                        )}
                      </div>
                    </div>
                  </article>
                );
              },
            )}
          </div>
        )}
      </AppShell>
    </>
  );
}

function buildTaskUrl(
  current:
    | {
        status?: string;
        due?: string;
        type?: string;
        propertyId?: string;
        linked?: string;
      }
    | undefined,
  changes: {
    status?: string;
    due?: string;
    type?: string;
    propertyId?: string;
    linked?: string;
  },
) {
  const values = {
    status:
      current?.status ??
      "all",

    due:
      current?.due ??
      "all",

    type:
      current?.type ??
      "all",

    propertyId:
      current?.propertyId ??
      "all",

    linked:
      current?.linked ??
      "all",

    ...changes,
  };

  const query =
    new URLSearchParams();

  if (
    values.status !== "all"
  ) {
    query.set(
      "status",
      values.status,
    );
  }

  if (
    values.due !== "all"
  ) {
    query.set(
      "due",
      values.due,
    );
  }

  if (
    values.type !== "all"
  ) {
    query.set(
      "type",
      values.type,
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

  if (
    values.linked !== "all"
  ) {
    query.set(
      "linked",
      values.linked,
    );
  }

  const queryString =
    query.toString();

  return queryString
    ? `/tasks?${queryString}`
    : "/tasks";
}

function isTaskType(
  value: string,
): value is TaskType {
  return Object.values(
    TaskType,
  ).includes(
    value as TaskType,
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 text-[8px] font-bold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>

      <div className="flex flex-wrap gap-1.5">
        {children}
      </div>
    </div>
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
        "rounded-lg border px-2.5 py-1.5 text-[8px] font-semibold transition",
        active
          ? "border-blue-200 bg-blue-50 text-[#2563EB]"
          : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
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
    | "blue"
    | "slate"
    | "amber"
    | "rose";
}) {
  const toneClass = {
    blue:
      "border-blue-100 bg-blue-50 text-[#2563EB]",
    slate:
      "border-slate-200 bg-white text-slate-700",
    amber:
      "border-amber-100 bg-amber-50 text-amber-700",
    rose:
      "border-rose-100 bg-rose-50 text-rose-700",
  }[tone];

  return (
    <div
      className={[
        "flex min-w-[92px] items-center justify-between gap-3 rounded-xl border px-3 py-2",
        toneClass,
      ].join(" ")}
    >
      <span className="text-[8px] font-semibold">
        {label}
      </span>

      <strong className="text-[14px] font-black tabular-nums">
        {value}
      </strong>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: TaskStatus;
}) {
  const config =
    status ===
    TaskStatus.DONE
      ? {
          label:
            "Completato",
          classes:
            "border-emerald-200 bg-emerald-50 text-emerald-700",
        }
      : status ===
          TaskStatus.IN_PROGRESS
        ? {
            label:
              "In corso",
            classes:
              "border-amber-200 bg-amber-50 text-amber-700",
          }
        : {
            label:
              "Da fare",
            classes:
              "border-blue-200 bg-blue-50 text-[#2563EB]",
          };

  return (
    <span
      className={[
        "shrink-0 rounded-full border px-2.5 py-1 text-[8px] font-bold",
        config.classes,
      ].join(" ")}
    >
      {config.label}
    </span>
  );
}

function TaskTypeBadge({
  type,
}: {
  type: TaskType;
}) {
  return (
    <span className="rounded-full bg-slate-100 px-2 py-1 text-[7px] font-bold uppercase tracking-[0.08em] text-slate-500">
      {formatTaskType(
        type,
      )}
    </span>
  );
}

function TaskMetric({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-xl bg-slate-50/70 px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-slate-400">
        {icon}

        <span className="text-[7px] font-bold uppercase tracking-[0.09em]">
          {label}
        </span>
      </div>

      <div className="mt-1 truncate text-[9px] font-semibold text-slate-700">
        {children}
      </div>
    </div>
  );
}

function formatTaskType(
  type: TaskType,
) {
  const labels:
    Record<
      TaskType,
      string
    > = {
    CLEANING:
      "Pulizie",

    MAINTENANCE:
      "Manutenzione",

    GUEST_DOCUMENTS:
      "Documenti ospite",

    CHECK_IN:
      "Check-in",

    CHECK_OUT:
      "Check-out",

    ADMIN:
      "Amministrazione",

    ISSUE:
      "Segnalazione",
  };

  return labels[type];
}

const selectClass =
  "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-[9px] font-semibold text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100";

