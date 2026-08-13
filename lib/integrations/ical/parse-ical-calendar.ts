import ical, {
  type CalendarComponent,
  type DateWithTimeZone,
  type ParameterValue,
  type VEvent,
} from "node-ical";

import type { IcalBookingEvent } from "./types";

export function parseIcalCalendar(
  body: string,
): IcalBookingEvent[] {
  const calendar = ical.sync.parseICS(body);

  const events: IcalBookingEvent[] = [];

  for (const component of Object.values(calendar)) {
    if (!isVEvent(component)) {
      continue;
    }

    const isAllDay =
      component.datetype === "date" ||
      component.start.dateOnly === true;

    const start = normalizeDate(
      component.start,
      isAllDay,
    );

    const end = component.end
      ? normalizeDate(
          component.end,
          isAllDay,
        )
      : createDefaultEnd(
          start,
          isAllDay,
        );

    events.push({
      uid: component.uid,

      summary: getParameterValue(
        component.summary,
      ),

      start,
      end,

      status: component.status,

      description:
        getOptionalParameterValue(
          component.description,
        ),

      location:
        getOptionalParameterValue(
          component.location,
        ),

      isAllDay,
    });
  }

  return events.sort(
    (first, second) =>
      first.start.getTime() -
      second.start.getTime(),
  );
}

function isVEvent(
  component:
    | CalendarComponent
    | undefined,
): component is VEvent {
  return component?.type === "VEVENT";
}

function normalizeDate(
  value: DateWithTimeZone,
  isAllDay: boolean,
): Date {
  if (!isAllDay) {
    return new Date(value);
  }

  return new Date(
    Date.UTC(
      value.getFullYear(),
      value.getMonth(),
      value.getDate(),
    ),
  );
}

function createDefaultEnd(
  start: Date,
  isAllDay: boolean,
): Date {
  if (!isAllDay) {
    return new Date(start);
  }

  const end = new Date(start);

  end.setUTCDate(
    end.getUTCDate() + 1,
  );

  return end;
}

function getParameterValue(
  value: ParameterValue,
): string {
  if (typeof value === "string") {
    return value;
  }

  return value.val;
}

function getOptionalParameterValue(
  value?: ParameterValue,
): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  return getParameterValue(value);
}