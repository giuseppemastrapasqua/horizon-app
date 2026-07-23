export function normalizeReferenceMonth(
  value: Date
) {
  if (Number.isNaN(value.getTime())) {
    throw new Error(
      "Il mese di riferimento non è valido."
    );
  }

  return new Date(
    Date.UTC(
      value.getUTCFullYear(),
      value.getUTCMonth(),
      1
    )
  );
}

export function getNextMonthStart(
  referenceMonth: Date
) {
  return new Date(
    Date.UTC(
      referenceMonth.getUTCFullYear(),
      referenceMonth.getUTCMonth() + 1,
      1
    )
  );
}