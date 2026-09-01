import type {
  AlloggiatiWebCredentials,
  AlloggiatiWebReceipt,
  AlloggiatiWebSession,
  AlloggiatiWebSubmission,
  AlloggiatiWebSubmissionResult,
  AlloggiatiWebValidationResult,
} from "./types";
import type {
  AlloggiatiWebTransport,
} from "./transport";

export class MockAlloggiatiWebTransport
  implements AlloggiatiWebTransport
{
  readonly authenticatedWith:
    AlloggiatiWebCredentials[] = [];

  readonly validatedSubmissions:
    AlloggiatiWebSubmission[] = [];

  readonly submitted:
    AlloggiatiWebSubmission[] = [];

  readonly receiptDates: string[] = [];

  session: AlloggiatiWebSession = {
    token: "mock-token",
  };

  validationResult:
    AlloggiatiWebValidationResult = {
      success: true,
    };

  submissionResult:
    AlloggiatiWebSubmissionResult = {
      success: true,
      resultCode: "MOCK_OK",
    };

  receipt: AlloggiatiWebReceipt = {
    date: "2026-09-01",
    pdfBase64: "bW9jay1wZGY=",
  };

  async authenticate(
    credentials: AlloggiatiWebCredentials,
  ): Promise<AlloggiatiWebSession> {
    this.authenticatedWith.push(credentials);

    return this.session;
  }

  async validateSubmission(
    _session: AlloggiatiWebSession,
    submission: AlloggiatiWebSubmission,
  ): Promise<AlloggiatiWebValidationResult> {
    this.validatedSubmissions.push(submission);

    return this.validationResult;
  }

  async submit(
    _session: AlloggiatiWebSession,
    submission: AlloggiatiWebSubmission,
  ): Promise<AlloggiatiWebSubmissionResult> {
    this.submitted.push(submission);

    return this.submissionResult;
  }

  async getReceipt(
    _session: AlloggiatiWebSession,
    date: string,
  ): Promise<AlloggiatiWebReceipt> {
    this.receiptDates.push(date);

    return {
      ...this.receipt,
      date,
    };
  }
}