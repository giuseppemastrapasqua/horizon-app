import fs from "node:fs";
import path from "node:path";

import {
  describe,
  expect,
  it,
} from "vitest";

import { parseIcalCalendar } from "./parse-ical-calendar";

const fixturePath = path.join(
  process.cwd(),
  "lib",
  "integrations",
  "ical",
  "fixtures",
  "booking-calendar.ics",
);

describe("parseIcalCalendar", () => {
  it("estrae gli eventi VEVENT dal calendario", () => {
    const body =
      fs.readFileSync(
        fixturePath,
        "utf8",
      );

    const events =
      parseIcalCalendar(body);

    expect(events).toHaveLength(2);

    expect(events[0]).toMatchObject({
      uid: "booking-001@example.com",
      summary: "Reserved",
      status: "CONFIRMED",
      isAllDay: true,
    });

    expect(events[0]?.start).toEqual(
      new Date(
        "2026-08-20T00:00:00.000Z",
      ),
    );

    expect(events[0]?.end).toEqual(
      new Date(
        "2026-08-24T00:00:00.000Z",
      ),
    );
  });

  it("ordina gli eventi per data di inizio", () => {
    const body =
      fs.readFileSync(
        fixturePath,
        "utf8",
      );

    const events =
      parseIcalCalendar(body);

    expect(
      events.map(
        (event) => event.uid,
      ),
    ).toEqual([
      "booking-001@example.com",
      "booking-002@example.com",
    ]);
  });

  it("ignora componenti che non sono VEVENT", () => {
    const body = `
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Horizon//Test//EN
BEGIN:VTODO
UID:todo-001@example.com
DTSTAMP:20260811T070000Z
SUMMARY:Test task
END:VTODO
END:VCALENDAR
`;

    const events =
      parseIcalCalendar(body);

    expect(events).toEqual([]);
  });

  it("assegna un giorno di durata agli eventi all-day senza DTEND", () => {
    const body = `
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Horizon//Test//EN
BEGIN:VEVENT
UID:event-without-end@example.com
DTSTAMP:20260811T070000Z
DTSTART;VALUE=DATE:20260820
SUMMARY:Reserved
END:VEVENT
END:VCALENDAR
`;

    const events =
      parseIcalCalendar(body);

    expect(events).toHaveLength(1);

    expect(events[0]).toMatchObject({
      uid:
        "event-without-end@example.com",
      summary: "Reserved",
      isAllDay: true,
    });

    expect(events[0]?.start).toEqual(
      new Date(
        "2026-08-20T00:00:00.000Z",
      ),
    );

    expect(events[0]?.end).toEqual(
      new Date(
        "2026-08-21T00:00:00.000Z",
      ),
    );
  });
});