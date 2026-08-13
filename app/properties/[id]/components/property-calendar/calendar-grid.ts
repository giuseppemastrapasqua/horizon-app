import type {
  CalendarDay,
} from "./types";

import {
  addDays,
  differenceInDays,
} from "./utils/dates";

export function buildCalendarDays(
  month: Date,
): CalendarDay[] {
  const monthStart =
    new Date(
      month.getFullYear(),
      month.getMonth(),
      1,
    );

  const monthEnd =
    new Date(
      month.getFullYear(),
      month.getMonth() + 1,
      0,
    );

  const firstWeekday =
    (
      monthStart.getDay() +
      6
    ) % 7;

  const lastWeekday =
    (
      monthEnd.getDay() +
      6
    ) % 7;

  const gridStart =
    addDays(
      monthStart,
      -firstWeekday,
    );

  const gridEnd =
    addDays(
      monthEnd,
      6 - lastWeekday,
    );

  const totalDays =
    differenceInDays(
      addDays(
        gridEnd,
        1,
      ),
      gridStart,
    );

  const days:
    CalendarDay[] = [];

  for (
    let index = 0;
    index < totalDays;
    index += 1
  ) {
    const date =
      addDays(
        gridStart,
        index,
      );

    days.push({
      date,

      dayNumber:
        date.getDate(),

      currentMonth:
        date.getMonth() ===
          month.getMonth() &&
        date.getFullYear() ===
          month.getFullYear(),
    });
  }

  return days;
}
