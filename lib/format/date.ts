export function formatDate(
  value: Date,
  options?: Intl.DateTimeFormatOptions
) {
  return value.toLocaleDateString("it-IT", options);
}

export function formatDateTime(value: Date) {
  return value.toLocaleString("it-IT");
}