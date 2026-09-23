export type CommissionInvoicePrerequisiteErrorCode =
  | "ISSUER_BILLING_PROFILE_MISSING"
  | "OWNER_BILLING_PROFILE_MISSING";

export class CommissionInvoicePrerequisiteError extends Error {
  readonly code: CommissionInvoicePrerequisiteErrorCode;

  constructor(input: {
    message: string;
    code: CommissionInvoicePrerequisiteErrorCode;
  }) {
    super(input.message);

    this.name = "CommissionInvoicePrerequisiteError";
    this.code = input.code;
  }
}

export function isCommissionInvoicePrerequisiteError(
  value: unknown,
): value is CommissionInvoicePrerequisiteError {
  return value instanceof CommissionInvoicePrerequisiteError;
}
