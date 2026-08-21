import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  RotateCcw,
  UserRound,
} from "lucide-react";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/AppShell";
import { Navigation } from "@/components/Navigation";
import { prisma } from "@/lib/prisma";

import {
  markTaskDone,
  reopenTask,
} from "../actions";

type TaskDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function TaskDetailPage({
  params,
}: TaskDetailPageProps) {
  const { id } =
    await params;

  const task =
    await prisma.task.findUnique({
      where: {
        id,
      },

      include: {
        property: true,
        booking: true,
        owner: true,
      },
    });

  if (!task) {
    notFound();
  }

  const statusLabel =
    task.status === "DONE"
      ? "Completato"
      : task.status === "IN_PROGRESS"
        ? "In corso"
        : "Da fare";

  const statusClass =
    task.status === "DONE"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : task.status === "IN_PROGRESS"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-blue-200 bg-blue-50 text-[#2563EB]";

  return (
    <>
      <Navigation />

      <AppShell
        title={task.title}
        subtitle={`${task.property.name} · ${formatTaskType(
          task.type,
        )}`}
      >
        <div className="mb-5">
          <Link
            href="/tasks"
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-[10px] font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#2563EB]"
          >
            <ArrowLeft size={13} />
            Torna ai task
          </Link>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={
              <ClipboardCheck
                size={16}
              />
            }
            title="Stato"
          >
            <span
              className={[
                "inline-flex rounded-full border px-2.5 py-1 text-[9px] font-bold",
                statusClass,
              ].join(" ")}
            >
              {statusLabel}
            </span>
          </MetricCard>

          <MetricCard
            icon={
              <ClipboardCheck
                size={16}
              />
            }
            title="Tipo"
          >
            {formatTaskType(
              task.type,
            )}
          </MetricCard>

          <MetricCard
            icon={
              <CalendarClock
                size={16}
              />
            }
            title="Scadenza"
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
          </MetricCard>

          <MetricCard
            icon={
              <Building2
                size={16}
              />
            }
            title="Immobile"
          >
            {task.property.name}
          </MetricCard>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_26px_rgba(15,23,42,0.05)]">
            <div className="mb-5">
              <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Operatività
              </p>

              <h2 className="mt-1 text-[17px] font-bold tracking-[-0.035em] text-slate-950">
                Dettaglio task
              </h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <InfoItem
                icon={
                  <UserRound
                    size={14}
                  />
                }
                label="Responsabile"
                value={
                  task.owner
                    ?.fullName ??
                  "Da assegnare"
                }
              />

              <InfoItem
                icon={
                  <Building2
                    size={14}
                  />
                }
                label="Immobile"
                href={`/properties/${task.property.id}`}
                value={
                  task.property
                    .name
                }
              />

              {task.booking ? (
                <InfoItem
                  icon={
                    <CalendarDays
                      size={14}
                    />
                  }
                  label="Prenotazione"
                  href={`/bookings/${task.booking.id}`}
                  value={
                    task.booking
                      .guestName
                  }
                />
              ) : null}
            </div>

            <div className="mt-5 border-t border-slate-100 pt-5">
              <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-slate-400">
                Descrizione
              </p>

              <p className="mt-2 whitespace-pre-wrap text-[12px] leading-5 text-slate-600">
                {task.description ??
                  "Nessuna descrizione inserita."}
              </p>
            </div>
          </section>

          <section className="h-fit rounded-2xl border border-blue-100 bg-[#F8FBFF] p-5">
            <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-[#2563EB]">
              Azioni
            </p>

            <h2 className="mt-1 text-[16px] font-bold tracking-[-0.03em] text-slate-950">
              Azioni rapide
            </h2>

            <p className="mt-2 text-[10px] leading-4 text-slate-500">
              Aggiorna lo stato operativo del task.
            </p>

            {task.status !==
            "DONE" ? (
              <form
                action={markTaskDone.bind(
                  null,
                  task.id,
                )}
                className="mt-5"
              >
                <button
                  type="submit"
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 text-[10px] font-semibold text-white shadow-[0_8px_20px_rgba(37,99,235,0.18)] transition hover:bg-[#1D4ED8]"
                >
                  <CheckCircle2
                    size={14}
                  />
                  Segna come completato
                </button>
              </form>
            ) : (
              <form
                action={reopenTask.bind(
                  null,
                  task.id,
                )}
                className="mt-5"
              >
                <button
                  type="submit"
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-4 text-[10px] font-semibold text-[#2563EB] transition hover:bg-blue-50"
                >
                  <RotateCcw
                    size={13}
                  />
                  Riapri task
                </button>
              </form>
            )}
          </section>
        </div>
      </AppShell>
    </>
  );
}

function MetricCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_6px_20px_rgba(15,23,42,0.04)]">
      <div className="flex items-center gap-2 text-[#2563EB]">
        {icon}

        <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-slate-400">
          {title}
        </span>
      </div>

      <div className="mt-2 text-[12px] font-bold text-slate-800">
        {children}
      </div>
    </div>
  );
}

function InfoItem({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
      <div className="flex items-center gap-2 text-slate-400">
        {icon}

        <span className="text-[8px] font-bold uppercase tracking-[0.1em]">
          {label}
        </span>
      </div>

      {href ? (
        <Link
          href={href}
          className="mt-1.5 block truncate text-[11px] font-bold text-[#2563EB] hover:underline"
        >
          {value}
        </Link>
      ) : (
        <p className="mt-1.5 truncate text-[11px] font-bold text-slate-800">
          {value}
        </p>
      )}
    </div>
  );
}

function formatTaskType(
  type: string,
) {
  const labels: Record<
    string,
    string
  > = {
    CLEANING: "Pulizie",
    MAINTENANCE:
      "Manutenzione",
    GUEST_DOCUMENTS:
      "Documenti ospite",
    CHECK_IN: "Check-in",
    CHECK_OUT: "Check-out",
    ADMIN:
      "Amministrazione",
    ISSUE: "Segnalazione",
  };

  return labels[type] ?? type;
}
