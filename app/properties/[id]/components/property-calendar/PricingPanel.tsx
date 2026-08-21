import {
  CalendarRange,
  Euro,
  UsersRound,
} from "lucide-react";

import {
  Field,
} from "./CalendarUi";

type PricingPanelProps = {
  rangeStart: string;
  rangeEnd: string;

  nightlyPrice: string;
  minimumStay: string;
  maximumStay: string;
  includedGuests: string;
  extraGuestPrice: string;
  cleaningCostInput: string;

  pricingMessage: string | null;
  isSavingPricing: boolean;

  onRangeStartChange:
    (value: string) => void;

  onRangeEndChange:
    (value: string) => void;

  onNightlyPriceChange:
    (value: string) => void;

  onMinimumStayChange:
    (value: string) => void;

  onMaximumStayChange:
    (value: string) => void;

  onIncludedGuestsChange:
    (value: string) => void;

  onExtraGuestPriceChange:
    (value: string) => void;

  onCleaningCostChange:
    (value: string) => void;

  onManualMode: () => void;
  onApplyPricing: () => void;
};

const inputClassName =
  "h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100";

const dateInputClassName =
  "h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-2 text-[10px] font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 [&::-webkit-datetime-edit]:text-[10px] [&::-webkit-datetime-edit]:font-semibold [&::-webkit-calendar-picker-indicator]:h-3.5 [&::-webkit-calendar-picker-indicator]:w-3.5 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60";

export function PricingPanel({
  rangeStart,
  rangeEnd,
  nightlyPrice,
  minimumStay,
  maximumStay,
  includedGuests,
  extraGuestPrice,
  cleaningCostInput,
  pricingMessage,
  isSavingPricing,
  onRangeStartChange,
  onRangeEndChange,
  onNightlyPriceChange,
  onMinimumStayChange,
  onMaximumStayChange,
  onIncludedGuestsChange,
  onExtraGuestPriceChange,
  onCleaningCostChange,
  onManualMode,
  onApplyPricing,
}: PricingPanelProps) {
  return (
    <div className="rounded-2xl border border-blue-100 bg-white p-3.5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <CalendarRange
                size={14}
              />
            </span>

            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-600">
              Tariffe & regole
            </p>
          </div>

          <h3 className="mt-2 text-sm font-bold text-slate-900">
            Modifica periodo
          </h3>
        </div>

        <span className="rounded-full border border-blue-100 bg-blue-50 px-2 py-1 text-[8px] font-bold text-blue-700">
          PREVIEW
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Field label="Da">
          <input
            type="date"
            value={rangeStart}
            onChange={(event) =>
              onRangeStartChange(
                event.target.value,
              )
            }
            className={dateInputClassName}
          />
        </Field>

        <Field label="A">
          <input
            type="date"
            min={rangeStart || undefined}
            value={rangeEnd}
            onChange={(event) =>
              onRangeEndChange(
                event.target.value,
              )
            }
            className={dateInputClassName}
          />
        </Field>
      </div>

      <div className="mt-3">
        <Field label="Prezzo / notte">
          <div className="relative">
            <Euro
              size={13}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="number"
              min="0"
              step="0.01"
              value={nightlyPrice}
              onChange={(event) =>
                onNightlyPriceChange(
                  event.target.value,
                )
              }
              placeholder="180"
              className={`${inputClassName} pl-8`}
            />
          </div>
        </Field>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Field label="Minimum stay">
          <input
            type="number"
            min="1"
            value={minimumStay}
            onChange={(event) =>
              onMinimumStayChange(
                event.target.value,
              )
            }
            className={inputClassName}
          />
        </Field>

        <Field label="Maximum stay">
          <input
            type="number"
            min="1"
            value={maximumStay}
            onChange={(event) =>
              onMaximumStayChange(
                event.target.value,
              )
            }
            placeholder="∞"
            className={inputClassName}
          />
        </Field>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Field label="Ospiti inclusi">
          <div className="relative">
            <UsersRound
              size={13}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="number"
              min="1"
              value={includedGuests}
              onChange={(event) =>
                onIncludedGuestsChange(
                  event.target.value,
                )
              }
              className={`${inputClassName} pl-8`}
            />
          </div>
        </Field>

        <Field label="Extra ospite">
          <input
            type="number"
            min="0"
            step="0.01"
            value={extraGuestPrice}
            onChange={(event) =>
              onExtraGuestPriceChange(
                event.target.value,
              )
            }
            placeholder="20"
            className={inputClassName}
          />
        </Field>
      </div>

      <div className="mt-3">
        <Field label="Costo pulizia per prenotazione">
          <div className="relative">
            <Euro
              size={13}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="number"
              min="0"
              step="0.01"
              value={cleaningCostInput}
              onChange={(event) =>
                onCleaningCostChange(
                  event.target.value,
                )
              }
              className={`${inputClassName} pl-8`}
            />
          </div>
        </Field>
      </div>

      <button
        type="button"
        onClick={onManualMode}
        className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50/40 hover:text-blue-700"
      >
        Modifica manualmente
      </button>

      <button
        type="button"
        onClick={onApplyPricing}
        disabled={isSavingPricing}
        className="mt-2 w-full rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm shadow-blue-600/15 transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
      >
        {isSavingPricing
          ? "Salvataggio..."
          : "Applica al periodo"}
      </button>

      {pricingMessage ? (
        <p className="mt-2 text-[9px] leading-4 text-slate-500">
          {pricingMessage}
        </p>
      ) : null}
    </div>
  );
}
