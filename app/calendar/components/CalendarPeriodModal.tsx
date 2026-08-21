"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  CalendarRange,
  X,
} from "lucide-react";

type CalendarPeriodModalProps = {
  children: React.ReactNode;
  triggerLabel?: string;
  compact?: boolean;
};

export function CalendarPeriodModal({
  children,
  triggerLabel = "Gestisci periodo",
  compact = false,
}: CalendarPeriodModalProps) {
  const [open, setOpen] =
    useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener(
      "keydown",
      handleKeyDown,
    );

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown,
      );

      document.body.style.overflow =
        previousOverflow;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          compact
            ? "inline-flex h-7 w-7 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-600 transition hover:border-blue-200 hover:bg-blue-100"
            : "inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-[#1D4ED8]"
        }
        aria-label={triggerLabel}
        title={triggerLabel}
      >
        <CalendarRange
          size={compact ? 13 : 15}
        />

        {!compact ? (
          <span>{triggerLabel}</span>
        ) : null}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0F172A]/35 p-4 backdrop-blur-[2px]"
          onMouseDown={() =>
            setOpen(false)
          }
        >
          <div
            role="dialog"
            aria-modal="true"
            className="max-h-[90vh] w-full max-w-[760px] overflow-y-auto rounded-[24px] border border-slate-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.24)]"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-6 py-4 backdrop-blur">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#2563EB]">
                  Horizon Calendar
                </p>

                <h2 className="mt-1 text-[18px] font-semibold tracking-[-0.02em] text-[#0F172A]">
                  Gestisci periodo
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setOpen(false)
                }
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                aria-label="Chiudi"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6">
              {children}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
