"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  CalendarRange,
  Check,
  Lock,
  Sparkles,
  Tags,
  X,
} from "lucide-react";

import {
  saveCalendarPeriodAction,
} from "../actions";

type PriceSource =
  | "Revenue AI"
  | "Manuale"
  | "Configurata";

type CalendarPeriodEditorProps = {
  propertyId: string;
  month: string;
  from: string;
  to: string;
  price: number;
  source: PriceSource;
  minimumStay: number;
  closed: boolean;
  revenueAiAvailable: boolean;
};

function formatPrice(value: number) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function CalendarPeriodEditor({
  propertyId,
  month,
  from,
  to,
  price,
  source,
  minimumStay,
  closed,
  revenueAiAvailable,
}: CalendarPeriodEditorProps) {
  const [open, setOpen] = useState(false);

  const [editor, setEditor] = useState({
    from,
    to,
    price,
    source,
    minimumStay,
    closed,
  });

  useEffect(() => {
    function handleOpen(event: Event) {
      if (
        event instanceof CustomEvent &&
        event.detail
      ) {
        setEditor({
          from: event.detail.from ?? from,
          to:
            event.detail.to ??
            event.detail.from ??
            to,
          price: event.detail.price ?? price,
          source:
            event.detail.source ?? source,
          minimumStay:
            event.detail.minimumStay ??
            minimumStay,
          closed:
            event.detail.closed ?? closed,
        });
      } else {
        setEditor({
          from,
          to,
          price,
          source,
          minimumStay,
          closed,
        });
      }

      setOpen(true);
    }

    window.addEventListener(
      "open-calendar-period-editor",
      handleOpen,
    );

    return () => {
      window.removeEventListener(
        "open-calendar-period-editor",
        handleOpen,
      );
    };
  }, [
    from,
    to,
    price,
    source,
    minimumStay,
    closed,
  ]);

  useEffect(() => {
    function handleRangeChanged(event: Event) {
      if (
        !(event instanceof CustomEvent) ||
        !event.detail
      ) {
        return;
      }

      const nextFrom = String(
        event.detail.from ?? "",
      );

      const nextTo = String(
        event.detail.to ?? "",
      );

      if (!nextFrom || !nextTo) {
        return;
      }

      setEditor((current) => ({
        ...current,
        from: nextFrom,
        to: nextTo,
      }));
    }

    window.addEventListener(
      "calendar-range-changed",
      handleRangeChanged,
    );

    return () => {
      window.removeEventListener(
        "calendar-range-changed",
        handleRangeChanged,
      );
    };
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener(
      "keydown",
      onKeyDown,
    );

    return () => {
      document.removeEventListener(
        "keydown",
        onKeyDown,
      );
    };
  }, [open]);

  const analysisHref =
    `/calendar/revenue-ai?propertyId=${encodeURIComponent(
      propertyId,
    )}&from=${editor.from}&to=${editor.to}`;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-[14px] inline-flex h-10 w-[225px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-[14px] font-semibold text-white shadow-sm transition hover:bg-blue-700"
      >
        <CalendarRange size={14} />
        Gestisci periodo
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-[2px]"
          onMouseDown={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
            className="max-h-[92vh] w-full max-w-[680px] overflow-y-auto rounded-[24px] border border-slate-200 bg-white shadow-[0_32px_90px_rgba(15,23,42,0.24)]"
          >
            <header className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-blue-600">
                  Periodo selezionato
                </p>

                <h2 className="mt-1 text-xl font-bold tracking-[-0.04em] text-slate-950">
                  {editor.from}
                  {editor.from !== editor.to
                    ? ` → ${editor.to}`
                    : ""}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
                aria-label="Chiudi"
              >
                <X size={15} />
              </button>
            </header>

            <div className="p-6">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[11px] font-medium text-slate-500">
                    Prezzo corrente
                  </p>

                  <strong className="mt-1 block text-2xl font-bold tracking-[-0.04em] text-slate-950">
                    {formatPrice(editor.price)}
                  </strong>

                  <span className="mt-1 block text-[11px] text-slate-500">
                    {editor.source}
                  </span>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[11px] font-medium text-slate-500">
                    Minimum stay
                  </p>

                  <strong className="mt-1 block text-2xl font-bold text-slate-950">
                    {editor.minimumStay}
                  </strong>

                  <span className="mt-1 block text-[11px] text-slate-500">
                    notti
                  </span>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[11px] font-medium text-slate-500">
                    Disponibilità
                  </p>

                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={[
                        "flex h-6 w-6 items-center justify-center rounded-lg",
                        editor.closed
                          ? "bg-rose-100 text-rose-600"
                          : "bg-emerald-100 text-emerald-600",
                      ].join(" ")}
                    >
                      {editor.closed ? (
                        <Lock size={12} />
                      ) : (
                        <Check size={12} />
                      )}
                    </span>

                    <strong
                      className={[
                        "text-[14px] font-bold",
                        editor.closed
                          ? "text-rose-600"
                          : "text-emerald-600",
                      ].join(" ")}
                    >
                      {editor.closed
                        ? "Chiuso"
                        : "Aperto"}
                    </strong>
                  </div>
                </div>
              </div>

              <section className="mt-6 rounded-2xl border border-slate-200 p-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                    <Sparkles size={16} />
                  </span>

                  <div>
                    <h3 className="text-[14px] font-bold text-slate-950">
                      Revenue AI
                    </h3>

                    <p className="mt-0.5 text-[11px] leading-5 text-slate-500">
                      Analizza il periodo e genera una nuova
                      raccomandazione di prezzo.
                    </p>
                  </div>
                </div>
                <Link
                  href={analysisHref}
                  className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-[12px] font-semibold !text-white shadow-sm transition hover:bg-violet-700 [&_svg]:text-white"
                >
                  <Sparkles size={14} />
                  Apri analisi AI
                </Link>
              </section>

              <section className="mt-4 rounded-2xl border border-slate-200 p-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                    <Tags size={15} />
                  </span>

                  <div>
                    <h3 className="text-[14px] font-bold text-slate-950">
                      Modifica manuale
                    </h3>

                    <p className="mt-0.5 text-[11px] leading-5 text-slate-500">
                      Imposta prezzo e disponibilità per il
                      periodo selezionato.
                    </p>
                  </div>
                </div>

                <form
                  action={saveCalendarPeriodAction}
                  className="mt-5"
                >
                  <input
                    type="hidden"
                    name="propertyId"
                    value={propertyId}
                  />
                  <input
                    type="hidden"
                    name="month"
                    value={month}
                  />
                  <input
                    type="hidden"
                    name="from"
                    value={editor.from}
                  />
                  <input
                    type="hidden"
                    name="to"
                    value={editor.to}
                  />
                  <input
                    type="hidden"
                    name="availability"
                    value={
                      editor.closed
                        ? "CLOSED"
                        : "OPEN"
                    }
                  />

                  <label className="block">
                    <span className="mb-2 block text-[11px] font-semibold text-slate-600">
                      Prezzo
                    </span>

                    <div className="relative max-w-[260px]">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] font-semibold text-slate-500">
                        €
                      </span>

                      <input
                        type="number"
                        name="standardRate"
                        min="1"
                        step="0.01"
                        value={editor.price}
                        onFocus={(event) =>
                          event.currentTarget.select()
                        }
                        onChange={(event) => {
                          const rawValue =
                            event.currentTarget.value;

                          const normalizedValue =
                            rawValue.replace(
                              /^0+(?=\d)/,
                              "",
                            );

                          const numericValue =
                            Number(normalizedValue);

                          setEditor((current) => ({
                            ...current,
                            price:
                              Number.isFinite(
                                numericValue,
                              )
                                ? numericValue
                                : 0,
                            source: "Manuale",
                          }));
                        }}
                        className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-[14px] font-semibold text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </label>

                  <div className="mt-5">
                    <p className="mb-2 text-[11px] font-semibold text-slate-600">
                      Disponibilità
                    </p>

                    <div className="grid max-w-[360px] grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setEditor((current) => ({
                            ...current,
                            closed: false,
                          }))
                        }
                        className={[
                          "h-10 rounded-xl border text-[11px] font-semibold transition",
                          !editor.closed
                            ? "border-emerald-300 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-100"
                            : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
                        ].join(" ")}
                      >
                        Aperto
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setEditor((current) => ({
                            ...current,
                            closed: true,
                          }))
                        }
                        className={[
                          "h-10 rounded-xl border text-[11px] font-semibold transition",
                          editor.closed
                            ? "border-rose-300 bg-rose-50 text-rose-700 ring-2 ring-rose-100"
                            : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
                        ].join(" ")}
                      >
                        Chiuso
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="mt-5 flex h-11 w-full max-w-[360px] items-center justify-center rounded-xl bg-blue-600 px-5 text-[12px] font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    Applica modifiche manuali
                  </button>
                </form>
              </section>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}



