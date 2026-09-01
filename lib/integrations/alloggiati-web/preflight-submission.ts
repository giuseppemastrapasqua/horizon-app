import type {
  AlloggiatiWebSubmission,
  AlloggiatiWebValidationResult,
} from "./types";

export interface AlloggiatiWebSubmissionValidator {
  validateSubmission(
    submission: AlloggiatiWebSubmission,
  ): Promise<AlloggiatiWebValidationResult>;
}

export async function preflightAlloggiatiSubmission(
  submission: AlloggiatiWebSubmission,
  validator: AlloggiatiWebSubmissionValidator,
): Promise<AlloggiatiWebValidationResult> {
  const result =
    await validator.validateSubmission(
      submission,
    );

  if (!result.success) {
    throw new Error(
      result.message?.trim() ||
        "Preflight Alloggiati Web non superato.",
    );
  }

  return result;
}
