import type {
  CalendarAvailabilityBlock,
  CalendarBooking,
  CalendarSegment,
} from "./types";

import {
  addDays,
  differenceInDays,
  startOfDay,
} from "./utils/dates";

export function buildSegments({
  bookings,
  weekStart,
  weekEndExclusive,
}: {
  bookings: CalendarBooking[];
  weekStart: Date;
  weekEndExclusive: Date;
}): CalendarSegment[] {
  const ordered =
    [...bookings].sort(
      (left, right) =>
        new Date(
          left.checkIn,
        ).getTime() -
        new Date(
          right.checkIn,
        ).getTime(),
    );

  const laneEnds:
    number[] = [];

  return ordered.map(
    (booking) => {
      const rawStart =
        startOfDay(
          new Date(
            booking.checkIn,
          ),
        );

      const rawEnd =
        startOfDay(
          new Date(
            booking.checkOut,
          ),
        );

      const segmentStart =
        rawStart >
        weekStart
          ? rawStart
          : weekStart;

      const segmentEnd =
        rawEnd <
        weekEndExclusive
          ? rawEnd
          : weekEndExclusive;

      const startColumn =
        differenceInDays(
          segmentStart,
          weekStart,
        );

      const endColumn =
        Math.max(
          startColumn,

          differenceInDays(
            segmentEnd,
            weekStart,
          ) - 1,
        );

      let lane =
        laneEnds.findIndex(
          (lastEnd) =>
            startColumn >
            lastEnd,
        );

      if (lane === -1) {
        lane =
          laneEnds.length;

        laneEnds.push(
          endColumn,
        );
      } else {
        laneEnds[lane] =
          endColumn;
      }

      return {
        booking,
        startColumn,
        endColumn,
        lane,
      };
    },
  );
}

export function buildAvailabilitySegments({
  blocks,
  weekStart,
  weekEndExclusive,
}: {
  blocks:
    CalendarAvailabilityBlock[];

  weekStart: Date;
  weekEndExclusive: Date;
}) {
  return blocks
    .map(
      (block) => {
        const rawStart =
          startOfDay(
            new Date(
              block.startDate,
            ),
          );

        /*
         * endDate nei blocchi è inclusiva.
         * La trasformiamo in limite esclusivo
         * aggiungendo un giorno.
         */
        const rawEndExclusive =
          addDays(
            startOfDay(
              new Date(
                block.endDate,
              ),
            ),
            1,
          );

        if (
          rawStart >=
            weekEndExclusive ||
          rawEndExclusive <=
            weekStart
        ) {
          return null;
        }

        const segmentStart =
          rawStart >
          weekStart
            ? rawStart
            : weekStart;

        const segmentEnd =
          rawEndExclusive <
          weekEndExclusive
            ? rawEndExclusive
            : weekEndExclusive;

        const startColumn =
          differenceInDays(
            segmentStart,
            weekStart,
          );

        const endColumn =
          Math.max(
            startColumn,

            differenceInDays(
              segmentEnd,
              weekStart,
            ) - 1,
          );

        return {
          id:
            block.id,

          startColumn,

          endColumn,
        };
      },
    )
    .filter(
      (
        segment,
      ): segment is {
        id: string;
        startColumn: number;
        endColumn: number;
      } =>
        segment !== null,
    );
}
