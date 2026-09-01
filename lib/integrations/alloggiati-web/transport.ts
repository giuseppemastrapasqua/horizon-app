import type {
  AlloggiatiWebCredentials,
  AlloggiatiWebReceipt,
  AlloggiatiWebSession,
  AlloggiatiWebSubmission,
  AlloggiatiWebSubmissionResult,
  AlloggiatiWebValidationResult,
} from "./types";

export interface AlloggiatiWebTransport {
  authenticate(
    credentials: AlloggiatiWebCredentials,
  ): Promise<AlloggiatiWebSession>;

  validateSubmission(
    session: AlloggiatiWebSession,
    submission: AlloggiatiWebSubmission,
  ): Promise<AlloggiatiWebValidationResult>;

  submit(
    session: AlloggiatiWebSession,
    submission: AlloggiatiWebSubmission,
  ): Promise<AlloggiatiWebSubmissionResult>;

  getReceipt(
    session: AlloggiatiWebSession,
    date: string,
  ): Promise<AlloggiatiWebReceipt>;
}