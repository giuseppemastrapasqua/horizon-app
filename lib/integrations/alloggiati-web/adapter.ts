import type {
  AlloggiatiWebCredentials,
  AlloggiatiWebReceipt,
  AlloggiatiWebSubmission,
  AlloggiatiWebSubmissionResult,
  AlloggiatiWebValidationResult,
} from "./types";
import type {
  AlloggiatiWebTransport,
} from "./transport";

export class AlloggiatiWebAdapter {
  constructor(
    private readonly transport: AlloggiatiWebTransport,
    private readonly credentials: AlloggiatiWebCredentials,
  ) {
    validateCredentials(credentials);
  }

  async validateSubmission(
    submission: AlloggiatiWebSubmission,
  ): Promise<AlloggiatiWebValidationResult> {
    validateSubmissionInput(submission);

    const session =
      await this.transport.authenticate(
        this.credentials,
      );

    return this.transport.validateSubmission(
      session,
      submission,
    );
  }

  async submit(
    submission: AlloggiatiWebSubmission,
  ): Promise<AlloggiatiWebSubmissionResult> {
    validateSubmissionInput(submission);

    const session =
      await this.transport.authenticate(
        this.credentials,
      );

    return this.transport.submit(
      session,
      submission,
    );
  }

  async getReceipt(
    date: string,
  ): Promise<AlloggiatiWebReceipt> {
    const normalizedDate = date.trim();

    if (!normalizedDate) {
      throw new Error(
        "La data della ricevuta Alloggiati Web è obbligatoria.",
      );
    }

    const session =
      await this.transport.authenticate(
        this.credentials,
      );

    return this.transport.getReceipt(
      session,
      normalizedDate,
    );
  }
}

function validateCredentials(
  credentials: AlloggiatiWebCredentials,
): void {
  if (!credentials.username.trim()) {
    throw new Error(
      "Username Alloggiati Web obbligatorio.",
    );
  }

  if (!credentials.password.trim()) {
    throw new Error(
      "Password Alloggiati Web obbligatoria.",
    );
  }

  if (!credentials.wsKey.trim()) {
    throw new Error(
      "WSKEY Alloggiati Web obbligatoria.",
    );
  }
}

function validateSubmissionInput(
  submission: AlloggiatiWebSubmission,
): void {
  if (submission.records.length === 0) {
    throw new Error(
      "La trasmissione Alloggiati Web non contiene record.",
    );
  }

  if (
    submission.records.some(
      (record) => !record.trim(),
    )
  ) {
    throw new Error(
      "La trasmissione Alloggiati Web contiene un record vuoto.",
    );
  }
}