import {
  NonRetryableBackgroundJobError,
} from "@/lib/job/background-job-errors";

import type {
  AlloggiatiWebSubmission,
  AlloggiatiWebSubmissionResult,
} from "./types";
import {
  authorizeAlloggiatiTransmissionSend,
} from "./transmission-send-gate";

export type AlloggiatiTransmissionOrchestratorStore = {
  beginSending(
    transmissionId: string,
  ): Promise<boolean>;

  recordAcceptedRecords(
    transmissionId: string,
    acceptedRecords: number,
  ): Promise<boolean>;

  markRejected(
    transmissionId: string,
    error: string,
  ): Promise<boolean>;

  markOutcomeUnknown(
    transmissionId: string,
    error: string,
  ): Promise<boolean>;
};

export type AlloggiatiSubmissionSender = {
  submit(
    submission: AlloggiatiWebSubmission,
  ): Promise<AlloggiatiWebSubmissionResult>;
};

export async function sendAlloggiatiTransmission(
  transmissionId: string,
  submission: AlloggiatiWebSubmission,
  sender: AlloggiatiSubmissionSender,
  store: AlloggiatiTransmissionOrchestratorStore,
): Promise<void> {
  try {
    await authorizeAlloggiatiTransmissionSend(
      transmissionId,
      store,
    );
  } catch (error) {
    throw new NonRetryableBackgroundJobError(
      errorMessage(
        error,
        "Transmission Alloggiati Web non autorizzata all'invio.",
      ),
    );
  }

  let result: AlloggiatiWebSubmissionResult;

  try {
    result = await sender.submit(submission);
  } catch (error) {
    const message = errorMessage(
      error,
      "Esito invio Alloggiati Web non determinabile.",
    );

    try {
      await store.markOutcomeUnknown(
        transmissionId,
        message,
      );
    } catch {
      // SENDING resta lo stato prudenziale.
    }

    throw new NonRetryableBackgroundJobError(
      message,
    );
  }

  if (
    !Number.isInteger(result.acceptedRecords) ||
    result.acceptedRecords < 0 ||
    result.acceptedRecords >
      submission.records.length
  ) {
    const message =
      "Risposta Alloggiati Web non coerente con il payload inviato.";

    await persistSafely(() =>
      store.markOutcomeUnknown(
        transmissionId,
        message,
      ),
    );

    throw new NonRetryableBackgroundJobError(
      message,
    );
  }

  if (result.acceptedRecords === 0) {
    const message =
      result.message?.trim() ||
      "Nessuna schedina Alloggiati Web acquisita.";

    const persisted = await persistSafely(() =>
      store.markRejected(
        transmissionId,
        message,
      ),
    );

    if (!persisted) {
      throw new NonRetryableBackgroundJobError(
        "Esito Alloggiati Web ricevuto ma non persistito.",
      );
    }

    throw new NonRetryableBackgroundJobError(
      message,
    );
  }

  const persisted = await persistSafely(() =>
    store.recordAcceptedRecords(
      transmissionId,
      result.acceptedRecords,
    ),
  );

  if (!persisted) {
    throw new NonRetryableBackgroundJobError(
      "Esito Alloggiati Web ricevuto ma non persistito.",
    );
  }

  if (
    result.acceptedRecords <
    submission.records.length
  ) {
    throw new NonRetryableBackgroundJobError(
      result.message?.trim() ||
        "Trasmissione Alloggiati Web acquisita solo parzialmente.",
    );
  }
}

async function persistSafely(
  persist: () => Promise<boolean>,
): Promise<boolean> {
  try {
    return await persist();
  } catch {
    return false;
  }
}

function errorMessage(
  error: unknown,
  fallback: string,
): string {
  if (
    error instanceof Error &&
    error.message.trim()
  ) {
    return error.message.trim();
  }

  return fallback;
}