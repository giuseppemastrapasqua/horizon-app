"use client";

import {
  ArrowRight,
  CheckCircle2,
  Lock,
  LockOpen,
  Settings,
} from "lucide-react";

import {
  useState,
} from "react";

type AvailabilityMode =
  | "OPEN"
  | "CLOSED";

type AvailabilityPanelProps = {
  isStructureOpen: boolean;
  isSaving: boolean;
  message: string | null;
  disabled: boolean;
  onToggle: () => void;
};

export function AvailabilityPanel({
  isStructureOpen,
  isSaving,
  message,
  disabled,
  onToggle,
}: AvailabilityPanelProps) {
  const [
    selectedMode,
    setSelectedMode,
  ] =
    useState<AvailabilityMode>(
      isStructureOpen
        ? "OPEN"
        : "CLOSED",
    );


  const selectedMatchesCurrent =
    (
      selectedMode ===
        "OPEN" &&
      isStructureOpen
    ) ||
    (
      selectedMode ===
        "CLOSED" &&
      !isStructureOpen
    );

  const handleProceed =
    () => {
      if (
        disabled ||
        isSaving ||
        selectedMatchesCurrent
      ) {
        return;
      }

      onToggle();
    };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
          <Settings
            size={14}
          />
        </span>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-700">
            Disponibilità
          </p>

          <p className="mt-0.5 text-[9px] text-slate-400">
            Periodo selezionato
          </p>
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-medium text-slate-500">
              Stato attuale
            </p>

            <div className="mt-1.5 flex items-center gap-2">
              <span
                className={[
                  "h-2.5 w-2.5 rounded-full",
                  isStructureOpen
                    ? "bg-emerald-500"
                    : "bg-rose-500",
                ].join(
                  " ",
                )}
              />

              <span
                className={[
                  "text-sm font-semibold",
                  isStructureOpen
                    ? "text-emerald-700"
                    : "text-rose-700",
                ].join(
                  " ",
                )}
              >
                {isStructureOpen
                  ? "Aperta"
                  : "Chiusa"}
              </span>
            </div>
          </div>

          <CheckCircle2
            size={18}
            className="text-slate-300"
          />
        </div>

        <p className="mt-2 text-[10px] leading-4 text-slate-500">
          Scegli il nuovo stato da applicare
          alle date selezionate.
        </p>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={
              disabled ||
              isSaving
            }
            onClick={() =>
              setSelectedMode(
                "OPEN",
              )
            }
            className={[
              "flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-[10px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
              selectedMode ===
              "OPEN"
                ? "border-emerald-400 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
            ].join(
              " ",
            )}
          >
            <span
              className={[
                "flex h-4 w-4 items-center justify-center rounded-full border",
                selectedMode ===
                "OPEN"
                  ? "border-emerald-500 bg-emerald-500"
                  : "border-slate-300 bg-white",
              ].join(
                " ",
              )}
            >
              {selectedMode ===
              "OPEN" ? (
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
              ) : null}
            </span>

            <LockOpen
              size={13}
            />

            Apri
          </button>

          <button
            type="button"
            disabled={
              disabled ||
              isSaving
            }
            onClick={() =>
              setSelectedMode(
                "CLOSED",
              )
            }
            className={[
              "flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-[10px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
              selectedMode ===
              "CLOSED"
                ? "border-rose-400 bg-rose-50 text-rose-700 ring-1 ring-rose-200"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
            ].join(
              " ",
            )}
          >
            <span
              className={[
                "flex h-4 w-4 items-center justify-center rounded-full border",
                selectedMode ===
                "CLOSED"
                  ? "border-rose-500 bg-rose-500"
                  : "border-slate-300 bg-white",
              ].join(
                " ",
              )}
            >
              {selectedMode ===
              "CLOSED" ? (
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
              ) : null}
            </span>

            <Lock
              size={13}
            />

            Chiudi
          </button>
        </div>

        <button
          type="button"
          disabled={
            disabled ||
            isSaving ||
            selectedMatchesCurrent
          }
          onClick={
            handleProceed
          }
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSaving ? (
            <>
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />

              Salvataggio...
            </>
          ) : (
            <>
              Procedi

              <ArrowRight
                size={14}
              />
            </>
          )}
        </button>

        {selectedMatchesCurrent &&
        !disabled ? (
          <p className="mt-2 text-center text-[9px] leading-4 text-slate-400">
            Il periodo è già impostato come{" "}
            {selectedMode ===
            "OPEN"
              ? "aperto"
              : "chiuso"}.
          </p>
        ) : null}

        {message ? (
          <p className="mt-2 text-center text-[9px] font-medium leading-4 text-slate-500">
            {message}
          </p>
        ) : (
          <p className="mt-2 text-center text-[9px] leading-4 text-slate-400">
            La modifica viene applicata solo
            dopo aver premuto Procedi.
          </p>
        )}
      </div>
    </div>
  );
}

