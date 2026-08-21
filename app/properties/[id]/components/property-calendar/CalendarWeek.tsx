import Link from "next/link";

import {
  Lock,
  UserRound,
} from "lucide-react";

import {
  addDays,
  sameDay,
  startOfDay,
} from "./utils/dates";

import {
  buildAvailabilitySegments,
  buildSegments,
} from "./segments";

import {
  getCalendarDayPricing,
} from "./pricing";

import {
  formatCompactMoney,
} from "./formatters";

import {
  getChannelPresentation,
} from "./channel-presentation";
import type {
  CalendarAvailabilityBlock,
  CalendarBooking,
  CalendarDay,
  CalendarPriceOverride,
} from "./types";
export function CalendarWeek({
  week,
  bookings,
  today,
  priceOverrides,
  availabilityBlocks,
  rangeStart,
  rangeEnd,
  nightlyPrice,
  includedGuests,
  onDayClick,
}: {
  week: CalendarDay[];
  bookings: CalendarBooking[];
  today: Date;

  priceOverrides:
    CalendarPriceOverride[];

  availabilityBlocks:
    CalendarAvailabilityBlock[];

  rangeStart: string;
  rangeEnd: string;
  nightlyPrice: string;
  includedGuests: string;

  onDayClick?: (
    date: Date,
  ) => void;
}) {
  const weekStart =
    startOfDay(
      week[0]!.date,
    );

  const weekEndExclusive =
    addDays(
      startOfDay(
        week[6]!.date,
      ),
      1,
    );

  const weekBookings =
    bookings.filter(
      (booking) => {
        const checkIn =
          startOfDay(
            new Date(
              booking.checkIn,
            ),
          );

        const checkOut =
          startOfDay(
            new Date(
              booking.checkOut,
            ),
          );

        return (
          checkIn <
            weekEndExclusive &&
          checkOut >
            weekStart
        );
      },
    );

  const segments =
    buildSegments({
      bookings:
        weekBookings,

      weekStart,

      weekEndExclusive,
    });

  const availabilitySegments =
    buildAvailabilitySegments({
      blocks:
        availabilityBlocks,

      weekStart,

      weekEndExclusive,
    });

  const hasAvailabilityBlocks =
    availabilitySegments.length > 0;

  const laneCount =
    Math.max(
      1,
      ...segments.map(
        (segment) =>
          segment.lane + 1,
      ),
    );

  const rowHeight =
    Math.max(
      70,
      43 +
        (
          laneCount +
          (
            hasAvailabilityBlocks
              ? 1
              : 0
          )
        ) *
          21,
    );

  return (
    <div
      className="relative grid grid-cols-7 border-b border-slate-200 last:border-b-0"
      style={{
        minHeight:
          `${rowHeight}px`,
      }}
    >
      {week.map(
        (day, index) => {
          const isToday =
            sameDay(
              day.date,
              today,
            );

          const isWeekend =
            index >= 5;

          const dayKey =
            [
              day.date.getFullYear(),
              String(
                day.date.getMonth() + 1,
              ).padStart(
                2,
                "0",
              ),
              String(
                day.date.getDate(),
              ).padStart(
                2,
                "0",
              ),
            ].join(
              "-",
            );

          const isRangeStart =
            Boolean(
              rangeStart &&
              dayKey ===
                rangeStart,
            );

          const isRangeEnd =
            Boolean(
              rangeEnd &&
              dayKey ===
                rangeEnd,
            );

          const isInRange =
            Boolean(
              rangeStart &&
              rangeEnd &&
              dayKey >=
                rangeStart &&
              dayKey <=
                rangeEnd,
            );

          const dayPricing =
            day.currentMonth
              ? getCalendarDayPricing({
                  date:
                    day.date,

                  priceOverrides,

                  rangeStart,

                  rangeEnd,

                  nightlyPrice,

                  includedGuests,
                })
              : null;

          return (
            <button
              type="button"
              key={
                day.date.toISOString()
              }
              onClick={() => {
                if (
                  !day.currentMonth
                ) {
                  return;
                }

                onDayClick?.(
                  day.date,
                );
              }}
              className={[
                "relative z-0 border-r border-slate-200 px-2 pt-1.5 text-left last:border-r-0",
                "select-none transition-colors",
                day.currentMonth
                  ? "cursor-pointer hover:bg-blue-50/60"
                  : "cursor-default opacity-40",
                isInRange
                  ? "bg-blue-50/70"
                  : isWeekend
                    ? "bg-slate-50/65"
                    : "bg-white",
                isRangeStart ||
                isRangeEnd
                  ? "ring-2 ring-inset ring-blue-500"
                  : "",
              ].join(
                " ",
              )}
            >
              <div className="flex items-start justify-between gap-1">
                <span
                  className={[
                    "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-semibold",
                    isRangeStart ||
                    isRangeEnd
                      ? "bg-blue-600 text-white shadow-sm"
                      : isToday
                        ? "bg-slate-900 text-white shadow-sm"
                        : "text-slate-600",
                  ].join(
                    " ",
                  )}
                >
                  {
                    day.dayNumber
                  }
                </span>

                {dayPricing !== null ? (
                  <span className="inline-flex items-center gap-1 rounded-md border border-blue-100 bg-blue-50/80 px-1.5 py-0.5 text-[8px] font-bold text-blue-700">
                    <span>
                      {formatCompactMoney(
                        dayPricing.price,
                      )}
                    </span>

                    {dayPricing.guests !== null ? (
                      <span className="inline-flex items-center gap-0.5 whitespace-nowrap text-blue-600">
                        <UserRound size={8} />{dayPricing.guests}
                      </span>
                    ) : null}
                  </span>
                ) : null}
              </div>
            </button>
          );
        },
      )}

      {availabilitySegments.length > 0 ? (
        <div className="pointer-events-none absolute inset-x-0 top-[29px] z-20 grid grid-cols-7">
          {availabilitySegments.map(
            (segment) => (
              <div
                key={`availability-${segment.id}-${segment.startColumn}-${segment.endColumn}`}
                className="mx-0.5 flex h-[18px] items-center overflow-hidden rounded-md border border-rose-300 bg-rose-500/95 px-2 text-[8px] font-semibold text-white shadow-sm shadow-rose-200/40"
                style={{
                  gridColumn: `${segment.startColumn + 1} / ${segment.endColumn + 2}`,
                }}
                title="Struttura chiusa"
              >
                <span className="flex min-w-0 items-center gap-1.5">
                  <Lock size={9} className="shrink-0" />
                  <span className="truncate">Chiuso</span>
                </span>
              </div>
            ),
          )}
        </div>
      ) : null}

      <div className="pointer-events-none absolute inset-x-0 top-[29px] z-20 grid grid-cols-7">
        {segments.map(
          (segment) => {
            const presentation =
              getChannelPresentation(
                segment.booking,
              );

            return (
              <Link
                key={`${segment.booking.id}-${segment.startColumn}-${segment.endColumn}`}
                href={`/bookings/${segment.booking.id}`}
                className={[
                  "pointer-events-auto mx-0.5 flex h-[18px] items-center overflow-hidden rounded-md px-2 text-[8px] font-semibold shadow-sm transition-all hover:-translate-y-px hover:shadow-md",
                  presentation.className,
                ].join(
                  " ",
                )}
                style={{
                  gridColumn: `${segment.startColumn + 1} / ${segment.endColumn + 2}`,

                  marginTop:
                    `${
                      (
                        segment.lane +
                        (
                          hasAvailabilityBlocks
                            ? 1
                            : 0
                        )
                      ) *
                      21
                    }px`,
                }}
                title={
                  presentation.title
                }
              >
                <span className="flex min-w-0 items-center gap-1.5">
                  <span
                    className={[
                      "inline-flex h-4 min-w-4 shrink-0 items-center justify-center rounded px-1 text-[7px] font-black",
                      presentation.badgeClassName,
                    ].join(" ")}
                    title={
                      presentation.channelName
                    }
                  >
                    {
                      presentation.badge
                    }
                  </span>

                  <span className="truncate">
                    {
                      presentation.label
                    }
                  </span>
                </span>
              </Link>
            );
          },
        )}
      </div>
    </div>
  );
}









