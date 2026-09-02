export class NonRetryableBackgroundJobError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NonRetryableBackgroundJobError";
  }
}

export function isNonRetryableBackgroundJobError(
  error: unknown,
): error is NonRetryableBackgroundJobError {
  return error instanceof NonRetryableBackgroundJobError;
}