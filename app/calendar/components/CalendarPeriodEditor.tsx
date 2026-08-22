"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import {
  ArrowRight,
  BarChart3,
  CalendarRange,
  Sparkles,
  X,
} from "lucide-react";

import {
  applyRevenueAiAction,
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
  const [open, setOpen] =
    useState(false);

  const [editor, setEditor] =
    useState({
      from,
      to,
      price,
      source,
      minimumStay,
      closed,
    });

  useEffect(() => {
    function handleOpen(
      event: Event,
    ) {
      if (
        event instanceof CustomEvent &&
        event.detail
      ) {
        setEditor({
          from:
            event.detail.from ??
            from,
          to:
            event.detail.to ??
            event.detail.from ??
            to,
          price:
            event.detail.price ??
            price,
          source:
            event.detail.source ??
            source,
          minimumStay:
            event.detail.minimumStay ??
            minimumStay,
          closed:
            event.detail.closed ??
            closed,
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
    function handleRangeChanged(
      event: Event,
    ) {
      if (
        !(
          event instanceof
          CustomEvent
        ) ||
        !event.detail
      ) {
        return;
      }

      const nextFrom =
        String(
          event.detail.from ??
            "",
        );

      const nextTo =
        String(
          event.detail.to ??
            "",
        );

      if (
        !nextFrom ||
        !nextTo
      ) {
        return;
      }

      setEditor(
        (
          current,
        ) => ({
          ...current,

          from:
            nextFrom,

          to:
            nextTo,
        }),
      );
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

    function onKeyDown(
      event: KeyboardEvent,
    ) {
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

  const isAi =
    editor.source ===
    "Revenue AI";

  const isManual =
    editor.source ===
    "Manuale";

  const analysisHref =
    `/calendar/revenue-ai?propertyId=${encodeURIComponent(
      propertyId,
    )}&from=${editor.from}&to=${editor.to}`;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
        }}
        className="mt-[14px] inline-flex h-10 items-center gap-2 rounded-xl bg-[#2563EB] px-5 text-[10px] font-semibold text-white shadow-[0_8px_20px_rgba(37,99,235,0.20)] transition hover:bg-[#1D4ED8]"
      >
        <CalendarRange size={14} />
        Gestisci periodo
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-[#0F172A]/35 p-4 backdrop-blur-[2px]"
          onMouseDown={() =>
            setOpen(false)
          }
        >
          <div
            role="dialog"
            aria-modal="true"
            onMouseDown={(
              event,
            ) =>
              event.stopPropagation()
            }
            className="max-h-[92vh] w-full max-w-[680px] overflow-y-auto rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_32px_90px_rgba(15,23,42,0.24)]"
          >
            <header className="flex items-start justify-between border-b border-[#E2E8F0] px-5 py-4">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#2563EB]">
                  Periodo selezionato
                </p>

                <h2 className="mt-1 text-[19px] font-semibold tracking-[-0.03em] text-[#0F172A]">
                  {editor.from}
                  {editor.from !==
                  editor.to
                    ? ` → ${editor.to}`
                    : ""}
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setOpen(false)
                }
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E2E8F0] text-[#64748B]"
                aria-label="Chiudi"
              >
                <X size={15} />
              </button>
            </header>

            <div className="p-5">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3">
                  <p className="text-[9px] text-[#64748B]">
                    Prezzo corrente
                  </p>

                  <strong className="mt-1 block text-[22px] font-semibold text-[#2563EB]">
                    €{Math.round(
                      editor.price,
                    )}
                  </strong>

                  <span className="text-[9px] text-[#64748B]">
                    {editor.source}
                  </span>
                </div>

                <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3">
                  <p className="text-[9px] text-[#64748B]">
                    Minimum stay
                  </p>

                  <strong className="mt-1 block text-[22px] font-semibold text-[#0F172A]">
                    {
                      editor.minimumStay
                    }
                  </strong>

                  <span className="text-[9px] text-[#64748B]">
                    notti
                  </span>
                </div>

                <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3">
                  <p className="text-[9px] text-[#64748B]">
                    Disponibilità
                  </p>

                  <strong
                    className={[
                      "mt-1 block text-[14px] font-semibold",
                      editor.closed
                        ? "text-[#EF4444]"
                        : "text-[#10B981]",
                    ].join(
                      " ",
                    )}
                  >
                    {editor.closed
                      ? "Chiuso"
                      : "Aperto"}
                  </strong>
                </div>
              </div>

              <div className="mt-5">
                <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.1em] text-[#64748B]">
                  Modalità prezzo
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <form
                    action={
                      applyRevenueAiAction
                    }
                  >
                    <input
                      type="hidden"
                      name="propertyId"
                      value={
                        propertyId
                      }
                    />
                    <input
                      type="hidden"
                      name="month"
                      value={month}
                    />
                    <input
                      type="hidden"
                      name="from"
                      value={
                        editor.from
                      }
                    />
                    <input
                      type="hidden"
                      name="to"
                      value={
                        editor.to
                      }
                    />

                    <button
                      type="submit"
                      disabled={!revenueAiAvailable}
                      className={[
                        "flex h-12 w-full items-center gap-2 rounded-xl px-3 text-left transition",
                        !revenueAiAvailable
                          ? "cursor-not-allowed border border-[#E2E8F0] bg-[#F8FAFC] text-[#94A3B8] opacity-70"
                          : isAi
                            ? "bg-[#2563EB] text-white"
                            : "border border-[#E2E8F0] bg-white text-[#475569]",
                      ].join(
                        " ",
                      )}
                    >
                      <Sparkles
                        size={14}
                      />

                      <span>
                        <strong className="block text-[11px]">
                          Revenue AI
                        </strong>
                        <span className="text-[8px] opacity-70">
                          {revenueAiAvailable
                            ? "Ottimizzazione dinamica"
                            : "Configura Standard Rate"}
                        </span>
                      </span>
                    </button>
                  </form>

                  <button
                    type="button"
                    onClick={() =>
                      setEditor(
                        (
                          current,
                        ) => ({
                          ...current,
                          source:
                            "Manuale",
                        }),
                      )
                    }
                    className={[
                      "h-12 rounded-xl px-3 text-left",
                      isManual
                        ? "bg-[#0F172A] text-white"
                        : "border border-[#E2E8F0] bg-white text-[#475569]",
                    ].join(
                      " ",
                    )}
                  >
                    <strong className="block text-[11px]">
                      € Manuale
                    </strong>

                    <span className="text-[8px] opacity-70">
                      Prezzo personalizzato
                    </span>
                  </button>
                </div>
              </div>

              <form
                action={
                  saveCalendarPeriodAction
                }
                className="mt-5"
              >
                <input
                  type="hidden"
                  name="propertyId"
                  value={
                    propertyId
                  }
                />
                <input
                  type="hidden"
                  name="month"
                  value={month}
                />
                <input
                  type="hidden"
                  name="from"
                  value={
                    editor.from
                  }
                />
                <input
                  type="hidden"
                  name="to"
                  value={
                    editor.to
                  }
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
                  <span className="mb-1.5 block text-[9px] font-semibold text-[#64748B]">
                    Prezzo Standard
                  </span>

                  <div className="relative max-w-[240px]">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-semibold text-[#64748B]">
                      €
                    </span>

                    <input
                      type="number"
                      name="standardRate"
                      min="1"
                      step="0.01"
                      value={
                        editor.price
                      }
                      onFocus={(
                        event,
                      ) => {
                        event.currentTarget.select();
                      }}
                      onChange={(
                        event,
                      ) => {
                        const rawValue =
                          event.currentTarget.value;

                        const normalizedValue =
                          rawValue.replace(
                            /^0+(?=\d)/,
                            "",
                          );

                        const numericValue =
                          Number(
                            normalizedValue,
                          );

                        setEditor(
                          (
                            current,
                          ) => ({
                            ...current,
                            price:
                              Number.isFinite(
                                numericValue,
                              )
                                ? numericValue
                                : 0,
                            source:
                              "Manuale",
                          }),
                        );
                      }}
                      className="h-11 w-full rounded-xl border border-[#CBD5E1] pl-8 pr-3 text-[14px] font-semibold text-[#0F172A] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#E0F2FE]"
                    />
                  </div>
                </label>

                <div className="mt-5">
                  <p className="mb-2 text-[9px] font-semibold text-[#64748B]">
                    Disponibilità
                  </p>

                  <div className="grid max-w-[360px] grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setEditor(
                          (
                            current,
                          ) => ({
                            ...current,
                            closed:
                              false,
                          }),
                        )
                      }
                      className={[
                        "h-10 rounded-xl border text-[10px] font-semibold transition",
                        !editor.closed
                          ? "border-[#34D399] bg-[#ECFDF5] text-[#059669] ring-2 ring-emerald-100"
                          : "border-[#E2E8F0] bg-white text-[#94A3B8] hover:bg-[#F8FAFC]",
                      ].join(
                        " ",
                      )}
                    >
                      Aperto
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setEditor(
                          (
                            current,
                          ) => ({
                            ...current,
                            closed:
                              true,
                          }),
                        )
                      }
                      className={[
                        "h-10 rounded-xl border text-[10px] font-semibold transition",
                        editor.closed
                          ? "border-[#F87171] bg-[#FEF2F2] text-[#DC2626] ring-2 ring-rose-100"
                          : "border-[#E2E8F0] bg-white text-[#94A3B8] hover:bg-[#F8FAFC]",
                      ].join(
                        " ",
                      )}
                    >
                      Chiuso
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="mt-4 flex h-11 w-full max-w-[360px] items-center justify-center rounded-xl bg-[#2563EB] px-5 text-[11px] font-semibold text-white shadow-[0_8px_20px_rgba(37,99,235,0.20)] transition hover:bg-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    Applica modifiche
                  </button>
                </div>
              </form>

              <Link
                href={
                  analysisHref
                }
                className="mt-5 flex items-center justify-between rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#2563EB]">
                    <BarChart3
                      size={14}
                    />
                  </span>

                  <div>
                    <p className="text-[8px] font-semibold uppercase tracking-[0.1em] text-[#64748B]">
                      Revenue Intelligence
                    </p>

                    <p className="mt-0.5 text-[11px] font-semibold text-[#0F172A]">
                      Apri analisi mercato
                    </p>
                  </div>
                </div>

                <ArrowRight
                  size={14}
                  className="text-[#2563EB]"
                />
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
