import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  ClipboardPlus,
  Info,
} from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { Navigation } from "@/components/Navigation";
import { prisma } from "@/lib/prisma";

import {
  createTask,
} from "../actions-create";

type NewTaskPageProps = {
  searchParams?: Promise<{
    propertyId?: string;
    bookingId?: string;
  }>;
};

export default async function NewTaskPage({
  searchParams,
}: NewTaskPageProps) {
  const params =
    await searchParams;

  const selectedPropertyId =
    params?.propertyId ??
    "";

  const selectedBookingId =
    params?.bookingId ??
    "";

  const properties =
    await prisma.property.findMany({
      orderBy: {
        name: "asc",
      },

      include: {
        bookings: {
          orderBy: {
            checkIn: "asc",
          },
        },
      },
    });

  const selectedProperty =
    properties.find(
      (property) =>
        property.id ===
        selectedPropertyId,
    ) ?? null;

  const compatibleBookings =
    selectedProperty?.bookings ??
    [];

  const selectedBooking =
    compatibleBookings.find(
      (booking) =>
        booking.id ===
        selectedBookingId,
    ) ?? null;

  const backHref =
    selectedBooking
      ? `/bookings/${selectedBooking.id}`
      : selectedProperty
        ? `/properties/${selectedProperty.id}`
        : "/tasks";

  const backLabel =
    selectedBooking
      ? "Torna alla prenotazione"
      : selectedProperty
        ? "Torna all'immobile"
        : "Torna ai task";

  return (
    <>
      <Navigation />

      <AppShell
        title="Nuovo task"
        subtitle="Crea un'attività operativa e lascia a Horizon l'assegnazione del responsabile corretto."
      >
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link
            href={backHref}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-[10px] font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#2563EB]"
          >
            <ArrowLeft size={13} />
            {backLabel}
          </Link>

          {selectedProperty ? (
            <div className="inline-flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-[9px] text-blue-700">
              <Building2
                size={12}
              />

              <span>
                {selectedProperty.name}

                {selectedBooking
                  ? ` · ${selectedBooking.guestName}`
                  : ""}
              </span>
            </div>
          ) : null}
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,720px)_280px]">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_26px_rgba(15,23,42,0.05)]">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#2563EB]">
                <ClipboardPlus
                  size={16}
                />
              </span>

              <div>
                <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  Operatività
                </p>

                <h2 className="text-[16px] font-bold tracking-[-0.03em] text-slate-950">
                  Dati del task
                </h2>
              </div>
            </div>

            <form
              action={createTask}
              className="grid gap-4"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <FieldLabel
                  title="Immobile"
                >
                  <select
                    name="propertyId"
                    defaultValue={
                      selectedPropertyId
                    }
                    required
                    className={inputClass}
                  >
                    <option value="">
                      Seleziona immobile
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
                </FieldLabel>

                <FieldLabel
                  title="Prenotazione"
                >
                  <select
                    name="bookingId"
                    defaultValue={
                      selectedBookingId
                    }
                    className={
                      inputClass
                    }
                    disabled={
                      !selectedProperty
                    }
                  >
                    <option value="">
                      {selectedProperty
                        ? "Nessuna prenotazione"
                        : "Seleziona prima un immobile"}
                    </option>

                    {compatibleBookings.map(
                      (booking) => (
                        <option
                          key={
                            booking.id
                          }
                          value={
                            booking.id
                          }
                        >
                          {
                            booking.guestName
                          }{" "}
                          ·{" "}
                          {new Date(
                            booking.checkIn,
                          ).toLocaleDateString(
                            "it-IT",
                          )}{" "}
                          →{" "}
                          {new Date(
                            booking.checkOut,
                          ).toLocaleDateString(
                            "it-IT",
                          )}
                        </option>
                      ),
                    )}
                  </select>
                </FieldLabel>
              </div>

              <FieldLabel title="Titolo task">
                <input
                  name="title"
                  required
                  placeholder="Es. Controllo documenti ospite"
                  className={
                    inputClass
                  }
                />
              </FieldLabel>

              <div className="grid gap-4 md:grid-cols-2">
                <FieldLabel title="Tipo task">
                  <select
                    name="type"
                    defaultValue="ADMIN"
                    className={
                      inputClass
                    }
                  >
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
                </FieldLabel>

                <FieldLabel title="Scadenza">
                  <input
                    name="dueDate"
                    type="datetime-local"
                    className={
                      inputClass
                    }
                  />
                </FieldLabel>
              </div>

              <FieldLabel title="Descrizione">
                <textarea
                  name="description"
                  rows={5}
                  placeholder="Dettagli operativi, istruzioni e note utili."
                  className={`${inputClass} min-h-[120px] resize-y py-3`}
                />
              </FieldLabel>

              <div className="border-t border-slate-100 pt-4">
                <button
                  type="submit"
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-5 text-[11px] font-semibold text-white shadow-[0_8px_20px_rgba(37,99,235,0.20)] transition hover:bg-[#1D4ED8] md:w-auto"
                >
                  <ClipboardPlus
                    size={14}
                  />
                  Crea task
                </button>
              </div>
            </form>
          </section>

          <aside className="h-fit rounded-2xl border border-blue-100 bg-[#F8FBFF] p-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#2563EB] shadow-sm">
              <Info size={14} />
            </div>

            <h3 className="mt-3 text-[13px] font-bold text-slate-900">
              Assegnazione automatica
            </h3>

            <p className="mt-2 text-[9px] leading-4 text-slate-500">
              Horizon assegna automaticamente il task al responsabile configurato per l&apos;immobile in base al tipo di attività.
            </p>

            <div className="mt-4 space-y-2 border-t border-blue-100 pt-4 text-[9px] text-slate-600">
              <AssignmentRow
                label="Pulizie"
                value="Cleaning"
              />

              <AssignmentRow
                label="Manutenzione"
                value="Maintenance"
              />

              <AssignmentRow
                label="Operatività"
                value="Operations"
              />
            </div>

            <div className="mt-4 flex gap-2 rounded-xl border border-blue-100 bg-white p-3">
              <CalendarDays
                size={13}
                className="mt-0.5 shrink-0 text-[#2563EB]"
              />

              <p className="text-[8px] leading-4 text-slate-500">
                Se colleghi una prenotazione, il task rimarrà disponibile anche nel relativo flusso operativo.
              </p>
            </div>
          </aside>
        </div>
      </AppShell>
    </>
  );
}

function FieldLabel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[9px] font-semibold text-slate-600">
        {title}
      </span>

      {children}
    </label>
  );
}

function AssignmentRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span>
        {label}
      </span>

      <strong className="text-[8px] font-bold uppercase tracking-[0.08em] text-[#2563EB]">
        {value}
      </strong>
    </div>
  );
}

const inputClass =
  "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-[10px] font-medium text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

