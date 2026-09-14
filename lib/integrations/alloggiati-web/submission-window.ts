const ITALY_TIME_ZONE = "Europe/Rome";

function getItalyDateKey(value: Date): string {
  if (Number.isNaN(value.getTime())) {
    throw new Error("Data Alloggiati non valida.");
  }

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: ITALY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("Impossibile determinare la data italiana corrente.");
  }

  return `${year}-${month}-${day}`;
}

function getBookingDateKey(value: Date): string {
  if (Number.isNaN(value.getTime())) {
    throw new Error("Data Alloggiati non valida.");
  }

  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, "0");
  const day = String(value.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function assertAlloggiatiSubmissionWindowOpen(
  checkIn: Date,
  now = new Date(),
): void {
  const checkInDate = getBookingDateKey(checkIn);
  const todayInItaly = getItalyDateKey(now);

  if (checkInDate > todayInItaly) {
    throw new Error(
      "Alloggiati Web sarà disponibile dal giorno del check-in.",
    );
  }
}