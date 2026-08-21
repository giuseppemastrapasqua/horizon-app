"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";

type CalendarRangeControllerProps = {
  from: string;
  to: string;
  propertyId: string;
  month: string;
};

export function CalendarRangeController({
  from,
  to,
  propertyId,
  month,
}: CalendarRangeControllerProps) {
  const router =
    useRouter();

  const pathname =
    usePathname();

  const searchParams =
    useSearchParams();

  const [rangeFrom, setRangeFrom] =
    useState(from);

  const [rangeTo, setRangeTo] =
    useState(to);

  const [selectingEnd, setSelectingEnd] =
    useState(false);

  const selectedLabel =
    useMemo(
      () =>
        rangeFrom === rangeTo
          ? formatDate(rangeFrom)
          : `${formatDate(rangeFrom)} → ${formatDate(rangeTo)}`,
      [rangeFrom, rangeTo],
    );

  function updateUrl(
    nextFrom: string,
    nextTo: string,
  ) {
    const params =
      new URLSearchParams(
        searchParams.toString(),
      );

    params.set(
      "propertyId",
      propertyId,
    );

    /*
     * Il calendario segue automaticamente
     * il mese della data iniziale selezionata.
     */
    params.set(
      "month",
      nextFrom.slice(
        0,
        7,
      ) || month,
    );

    params.set(
      "from",
      nextFrom,
    );

    params.set(
      "to",
      nextTo,
    );

    router.replace(
      `${pathname}?${params.toString()}`,
      {
        scroll: false,
      },
    );
  }

  function commitRange(
    first: string,
    second: string,
  ) {
    const nextFrom =
      first <= second
        ? first
        : second;

    const nextTo =
      first <= second
        ? second
        : first;

    setRangeFrom(
      nextFrom,
    );

    setRangeTo(
      nextTo,
    );

    setSelectingEnd(
      false,
    );

    window.dispatchEvent(
      new CustomEvent(
        "calendar-range-changed",
        {
          detail: {
            from:
              nextFrom,

            to:
              nextTo,
          },
        },
      ),
    );

    updateUrl(
      nextFrom,
      nextTo,
    );
  }

  function selectDay(
    date: string,
  ) {
    if (!selectingEnd) {
      setRangeFrom(
        date,
      );

      setRangeTo(
        date,
      );

      setSelectingEnd(
        true,
      );

      highlightRange(
        date,
        date,
      );

      return;
    }

    commitRange(
      rangeFrom,
      date,
    );
  }

  useEffect(() => {
    function handleDocumentClick(
      event: MouseEvent,
    ) {
      const target =
        event.target;

      if (
        !(target instanceof Element)
      ) {
        return;
      }

      const cell =
        target.closest(
          "[data-calendar-date]",
        );

      if (!cell) {
        return;
      }

      const date =
        cell.getAttribute(
          "data-calendar-date",
        );

      if (
        !date ||
        !/^\d{4}-\d{2}-\d{2}$/.test(
          date,
        )
      ) {
        return;
      }

      selectDay(
        date,
      );
    }

    document.addEventListener(
      "click",
      handleDocumentClick,
    );

    return () => {
      document.removeEventListener(
        "click",
        handleDocumentClick,
      );
    };
  });

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

      setRangeFrom(
        nextFrom,
      );

      setRangeTo(
        nextTo,
      );

      highlightRange(
        nextFrom,
        nextTo,
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
    highlightRange(
      rangeFrom,
      rangeTo,
    );
  }, [
    rangeFrom,
    rangeTo,
  ]);


  return (
    <div className="min-w-0">
      <div className="grid grid-cols-2 gap-2">
        <label>
          <span className="mb-1 block text-[7px] font-bold uppercase tracking-[0.1em] text-slate-400">
            Da
          </span>

          <input
            type="date"
            value={rangeFrom}
            onChange={(
              event,
            ) => {
              const value =
                event.target.value;

              if (
                value &&
                rangeTo
              ) {
                commitRange(
                  value,
                  rangeTo,
                );
              } else {
                setRangeFrom(
                  value,
                );
              }
            }}
            className="h-10 w-[158px] rounded-xl border border-slate-200 bg-white px-2.5 text-[8px] font-medium tracking-[-0.02em] text-[#334155] shadow-[0_4px_14px_rgba(15,23,42,0.04)] outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <label>
          <span className="mb-1 block text-[7px] font-bold uppercase tracking-[0.1em] text-slate-400">
            A
          </span>

          <input
            type="date"
            value={rangeTo}
            onChange={(
              event,
            ) => {
              const value =
                event.target.value;

              if (
                rangeFrom &&
                value
              ) {
                commitRange(
                  rangeFrom,
                  value,
                );
              } else {
                setRangeTo(
                  value,
                );
              }
            }}
            className="h-10 w-[158px] rounded-xl border border-slate-200 bg-white px-2.5 text-[8px] font-medium tracking-[-0.02em] text-[#334155] shadow-[0_4px_14px_rgba(15,23,42,0.04)] outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
          />
        </label>
      </div>

      <div className="mt-2 rounded-xl border border-blue-100/80 bg-[#F4F8FF] px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[7px] font-semibold text-[#2563EB]">
            Periodo
          </span>

          <strong className="text-[8px] font-semibold text-[#1E40AF]">
            {selectedLabel}
          </strong>
        </div>

        <p className="mt-1 text-[7px] leading-3 text-blue-500">
          {selectingEnd
            ? "Seleziona ora la data finale sul calendario."
            : "Clicca sul calendario per selezionare un nuovo periodo."}
        </p>
      </div>
    </div>
  );
}

function highlightRange(
  first: string,
  second: string,
) {
  const from =
    first <= second
      ? first
      : second;

  const to =
    first <= second
      ? second
      : first;

  document
    .querySelectorAll<HTMLElement>(
      "[data-calendar-date]",
    )
    .forEach(
      (element) => {
        const date =
          element.dataset
            .calendarDate;

        const selected =
          Boolean(
            date &&
              date >= from &&
              date <= to,
          );

        element.classList.toggle(
          "bg-blue-50/70",
          selected,
        );
      },
    );
}

function formatDate(
  value: string,
) {
  const [
    year,
    month,
    day,
  ] =
    value.split("-");

  if (
    !year ||
    !month ||
    !day
  ) {
    return value;
  }

  return `${day}/${month}/${year}`;
}









