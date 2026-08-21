"use client";

import {
  useState,
} from "react";

type BookingPeriodFieldsProps = {
  initialFrom: string;
  initialTo: string;
};

export function BookingPeriodFields({
  initialFrom,
  initialTo,
}: BookingPeriodFieldsProps) {
  const [
    from,
    setFrom,
  ] =
    useState(
      initialFrom,
    );

  const [
    to,
    setTo,
  ] =
    useState(
      initialTo,
    );

  const handleFromChange =
    (
      value: string,
    ) => {
      setFrom(
        value,
      );

      if (!value) {
        return;
      }

      /*
       * Se la data A non è più coerente
       * con il nuovo Da, la portiamo
       * automaticamente alla fine
       * dello stesso mese.
       */
      if (
        !to ||
        to < value
      ) {
        setTo(
          getMonthEnd(
            value,
          ),
        );
      }
    };

  return (
    <>
      <label className="block">
        <span className="mb-1.5 block text-[8px] font-bold uppercase tracking-[0.1em] text-slate-400">
          Da
        </span>

        <input
          type="date"
          name="from"
          value={from}
          onChange={(
            event,
          ) =>
            handleFromChange(
              event.target
                .value,
            )
          }
          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-[10px] font-semibold text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-[8px] font-bold uppercase tracking-[0.1em] text-slate-400">
          A
        </span>

        <input
          type="date"
          name="to"
          value={to}
          min={from || undefined}
          onChange={(
            event,
          ) =>
            setTo(
              event.target
                .value,
            )
          }
          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-[10px] font-semibold text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
        />
      </label>
    </>
  );
}

function getMonthEnd(
  value: string,
) {
  const [
    year,
    month,
  ] =
    value
      .split("-")
      .map(Number);

  const lastDay =
    new Date(
      year,
      month,
      0,
    );

  return [
    lastDay.getFullYear(),
    String(
      lastDay.getMonth() +
        1,
    ).padStart(
      2,
      "0",
    ),
    String(
      lastDay.getDate(),
    ).padStart(
      2,
      "0",
    ),
  ].join("-");
}
