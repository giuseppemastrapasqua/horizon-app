import type { IntegrationProvider } from "./types";
import type { IntegrationErrorCode } from "./error-codes";

export class IntegrationError extends Error {
  readonly code: IntegrationErrorCode;
  readonly provider: IntegrationProvider;
  readonly retryable: boolean;

  constructor(input: {
    message: string;
    code: IntegrationErrorCode;
    provider: IntegrationProvider;
    retryable: boolean;
    cause?: unknown;
  }) {
    super(input.message);

    this.name = "IntegrationError";
    this.code = input.code;
    this.provider = input.provider;
    this.retryable = input.retryable;

    if (input.cause !== undefined) {
      this.cause = input.cause;
    }
  }
}

export function isIntegrationError(
  value: unknown
): value is IntegrationError {
  return value instanceof IntegrationError;
}