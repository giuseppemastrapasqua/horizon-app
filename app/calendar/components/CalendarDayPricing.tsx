"use client";

import {
  X,
  Sparkles,
  Tags,
  CalendarRange,
} from "lucide-react";

import {
  ChannelLogo,
} from "./ChannelLogo";

type PricingChannel =
  | "BOOKING"
  | "AIRBNB"
  | "VRBO"
  | "HORIZON";

type ChannelPrice = {
  channel: PricingChannel;
  status: string;
  recommendedChannelPrice:
    | number
    | null;
};

type CalendarDayPricingProps = {
  dateKey: string;
  dayLabel: string;
  price: number;
  source:
    | "AI"
    | "MANUAL"
    | "CONFIGURED";
  channels: ChannelPrice[];
  minimumStay: number;
  closed: boolean;
};

function formatPrice(
  value: number | null,
) {
  if (
    value === null ||
    !Number.isFinite(value)
  ) {
    return "—";
  }

  return new Intl.NumberFormat(
    "it-IT",
    {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    },
  ).format(value);
}

export function CalendarDayPricing({
  dateKey,
  dayLabel,
  price,
  source,
  channels,
  minimumStay,
  closed,
}: CalendarDayPricingProps) {

  const openDialog = () => {
    const dialog =
      document.getElementById(
        `calendar-price-${dateKey}`,
      ) as HTMLDialogElement | null;

    dialog?.showModal();
  };

  const closeDialog = () => {
    const dialog =
      document.getElementById(
        `calendar-price-${dateKey}`,
      ) as HTMLDialogElement | null;

    dialog?.close();
  };

  return (
    <>
      <div className="group/pricing relative">
        <div className="flex min-w-0 items-center gap-1.5">
          {source === "AI" ? (
            <span
              title="Revenue AI"
              className="flex h-4 w-4 shrink-0 items-center justify-center rounded-md bg-violet-50 text-violet-600"
            >
              <Sparkles size={9} />
            </span>
          ) : null}

          <strong className="truncate text-[15px] font-semibold tracking-[-0.035em] text-[#2563EB] tabular-nums">
            {formatPrice(price)}
          </strong>
        </div>

        <div className="mt-1.5 flex items-center gap-1">
          <button
            type="button"
            onClick={openDialog}
            title="Tariffe"
            aria-label={`Tariffe ${dayLabel}`}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-blue-100 bg-blue-50 text-[#2563EB] transition hover:border-blue-200 hover:bg-blue-100 hover:text-blue-700"
          >
            <Tags size={11} />
          </button>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();

              window.dispatchEvent(
                new CustomEvent(
                  "open-calendar-period-editor",
                  {
                    detail: {
                      from: dateKey,
                      to: dateKey,
                      price,
                      source:
                        source === "AI"
                          ? "Revenue AI"
                          : source === "MANUAL"
                            ? "Manuale"
                            : "Configurata",
                      minimumStay,
                      closed,
                    },
                  },
                ),
              );
            }}
            title="Modifica"
            aria-label={`Modifica ${dayLabel}`}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-blue-100 bg-blue-50 text-[#2563EB] transition hover:border-blue-200 hover:bg-blue-100 hover:text-blue-700"
          >
            <CalendarRange size={11} />
          </button>
        </div>
      </div>

      <dialog
        id={`calendar-price-${dateKey}`}
        onClick={(event) => {
          if (
            event.target ===
            event.currentTarget
          ) {
            closeDialog();
          }
        }}
        className="m-auto w-[min(420px,calc(100vw-32px))] rounded-2xl border border-[#CBD5E1] bg-white p-0 shadow-[0_30px_90px_rgba(15,23,42,0.22)] backdrop:bg-slate-950/20 backdrop:backdrop-blur-[2px]"
      >
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[7px] font-black uppercase tracking-[0.16em] text-slate-400">
                Dettaglio tariffe
              </p>

              <h3 className="mt-1 text-lg font-black tracking-[-0.04em] text-[#0F172A]">
                {dayLabel}
              </h3>
            </div>

            <button
              type="button"
              onClick={closeDialog}
              aria-label="Chiudi"
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800"
            >
              <X size={14} />
            </button>
          </div>

          <div className="mt-5 rounded-2xl border border-[#BFDBFE] bg-[#EFF6FF] p-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[7px] font-black uppercase tracking-[0.12em] text-[#64748B]">
                  Prezzo origine
                </p>

                <strong className="mt-1 block text-[26px] font-black tracking-[-0.055em] text-[#2563EB] tabular-nums">
                  {formatPrice(price)}
                </strong>
              </div>

              <span className="rounded-full bg-white px-2.5 py-1 text-[7px] font-black text-[#2563EB] shadow-sm">
                {source === "AI"
                  ? "Revenue AI"
                  : source === "MANUAL"
                    ? "Manuale"
                    : "Standard"}
              </span>
            </div>
          </div>

          <div className="mt-4 space-y-1">
            {channels.map(
              (channel) => {
                const hasPrice =
                  channel.recommendedChannelPrice !==
                    null &&
                  Number.isFinite(
                    channel.recommendedChannelPrice,
                  );

                return (
                  <div
                    key={
                      channel.channel
                    }
                    className="flex items-center justify-between gap-4 rounded-xl px-2.5 py-2.5 transition hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-2.5">
                      <ChannelLogo
                        channel={
                          channel.channel
                        }
                        size={20}
                      />

                      <span className="text-[10px] font-bold text-slate-600">
                        {
                          channel.channel
                        }
                      </span>
                    </div>

                    <strong
                      className={[
                        "text-[12px] font-black tabular-nums",
                        hasPrice
                          ? "text-slate-700"
                          : "text-slate-300",
                      ].join(" ")}
                    >
                      {hasPrice
                        ? formatPrice(
                            channel.recommendedChannelPrice,
                          )
                        : "—"}
                    </strong>
                  </div>
                );
              },
            )}
          </div>
        </div>
      </dialog>
    </>
  );
}










