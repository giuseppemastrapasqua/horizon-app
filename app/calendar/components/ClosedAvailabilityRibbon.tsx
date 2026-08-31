"use client";

type ClosedAvailabilityRibbonProps = {
  dateKey: string;
  price: number;
  source: string;
  minimumStay: number;
  isStart: boolean;
  isEnd: boolean;
};

export function ClosedAvailabilityRibbon({
  dateKey,
  price,
  source,
  minimumStay,
  isStart,
  isEnd,
}: ClosedAvailabilityRibbonProps) {
  return (
    <button
      type="button"
      title="Periodo chiuso"
      aria-label={`Periodo chiuso ${dateKey}`}
      onClick={(event) => {
        event.stopPropagation();

        window.dispatchEvent(
          new CustomEvent("open-calendar-period-editor", {
            detail: {
              from: dateKey,
              to: dateKey,
              price,
              source,
              minimumStay,
              closed: true,
            },
          }),
        );
      }}
      className="relative z-[2] mt-4 -mx-3.5 flex h-7 w-[calc(100%+1.75rem)] bg-red-600 shadow-sm transition hover:z-[3] hover:bg-red-700"
      style={{
        clipPath:
          isStart && isEnd
            ? "polygon(16px 0, 100% 0, calc(100% - 16px) 100%, 0 100%)"
            : isStart
              ? "polygon(16px 0, 100% 0, 100% 100%, 0 100%)"
              : isEnd
                ? "polygon(0 0, 100% 0, calc(100% - 16px) 100%, 0 100%)"
                : undefined,
      }}
    />
  );
}

