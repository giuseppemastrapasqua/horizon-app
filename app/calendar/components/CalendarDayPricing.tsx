"use client";

import {
  CalendarRange,
  Sparkles,
  Tags,
  X,
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

function getSourceLabel(
  source:
    | "AI"
    | "MANUAL"
    | "CONFIGURED",
) {
  if (source === "AI") {
    return "Revenue AI";
  }

  if (source === "MANUAL") {
    return "Manuale";
  }

  return "Standard";
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

  const sourceLabel =
    getSourceLabel(source);

  return (
    <>
      <div className="group/pricing relative">
        <div className="flex min-w-0 items-center gap-1.5">
          {source === "AI" ? (
            <span
              title="Revenue AI"
              className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md bg-violet-100 text-violet-600 ring-1 ring-violet-200/70"
            >
              <Sparkles size={10} />
            </span>
          ) : null}

          {source === "MANUAL" ? (
            <span
              title="Prezzo manuale"
              className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500 ring-1 ring-slate-200"
            >
              <Tags size={9} />
            </span>
          ) : null}

          <strong
            className={[
              "truncate text-[16px] font-bold tracking-[-0.04em] tabular-nums",
              source === "AI"
                ? "text-violet-700"
                : source === "MANUAL"
                  ? "text-slate-800"
                  : "text-blue-600",
            ].join(" ")}
          >
            {formatPrice(price)}
          </strong>
        </div>

        <div className="mt-2 flex items-center gap-1.5">
          <button
            type="button"
            onClick={openDialog}
            title="Dettaglio tariffe"
            aria-label={`Tariffe ${dayLabel}`}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-white shadow-[0_4px_12px_rgba(16,185,129,0.24)] transition hover:bg-emerald-600"
          >
            <Tags size={13} />
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
            title="Gestisci giorno"
            aria-label={`Modifica ${dayLabel}`}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-[0_4px_12px_rgba(37,99,235,0.24)] transition hover:bg-blue-700"
          >
            <CalendarRange size={13} />
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
        className="m-auto w-[min(420px,calc(100vw-32px))] rounded-[24px] border border-slate-200 bg-white p-0 shadow-[0_30px_90px_rgba(15,23,42,0.20)] backdrop:bg-slate-950/25 backdrop:backdrop-blur-[2px]"
      >
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Dettaglio tariffe
              </p>

              <h3 className="mt-1 text-lg font-black tracking-[-0.04em] text-slate-950">
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

          <div
            className={[
              "mt-5 rounded-2xl border p-4",
              source === "AI"
                ? "border-violet-200 bg-violet-50/70"
                : source === "MANUAL"
                  ? "border-slate-200 bg-slate-50"
                  : "border-blue-200 bg-blue-50/70",
            ].join(" ")}
          >
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-slate-500">
                  Prezzo origine
                </p>

                <strong
                  className={[
                    "mt-1 block text-[28px] font-black tracking-[-0.055em] tabular-nums",
                    source === "AI"
                      ? "text-violet-700"
                      : source === "MANUAL"
                        ? "text-slate-900"
                        : "text-blue-600",
                  ].join(" ")}
                >
                  {formatPrice(price)}
                </strong>
              </div>

              <span
                className={[
                  "rounded-full px-2.5 py-1 text-[8px] font-black",
                  source === "AI"
                    ? "bg-white text-violet-700 ring-1 ring-violet-200"
                    : source === "MANUAL"
                      ? "bg-white text-slate-700 ring-1 ring-slate-200"
                      : "bg-white text-blue-700 ring-1 ring-blue-200",
                ].join(" ")}
              >
                {sourceLabel}
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
                    key={channel.channel}
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
                          ? "text-slate-800"
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


