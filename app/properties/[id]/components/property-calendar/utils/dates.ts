export function startOfDay(
  date: Date,
) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
}

export function addDays(
  date: Date,
  amount: number,
) {
  const result =
    new Date(date);

  result.setDate(
    result.getDate() +
      amount,
  );

  return result;
}

export function differenceInDays(
  later: Date,
  earlier: Date,
) {
  return Math.round(
    (
      startOfDay(
        later,
      ).getTime() -
      startOfDay(
        earlier,
      ).getTime()
    ) /
      86_400_000,
  );
}

export function sameDay(
  left: Date,
  right: Date,
) {
  return (
    left.getFullYear() ===
      right.getFullYear() &&
    left.getMonth() ===
      right.getMonth() &&
    left.getDate() ===
      right.getDate()
  );
}

export function dateKey(
  date: Date,
) {
  return [
    date.getFullYear(),

    String(
      date.getMonth() + 1,
    ).padStart(
      2,
      "0",
    ),

    String(
      date.getDate(),
    ).padStart(
      2,
      "0",
    ),
  ].join("-");
}
