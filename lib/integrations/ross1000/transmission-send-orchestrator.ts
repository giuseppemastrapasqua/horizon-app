import {
  NonRetryableBackgroundJobError,
} from "@/lib/job/background-job-errors";

import type {
  Ross1000CredentialProvider,
} from "./credential-provider";
import {
  parseRoss1000Response,
} from "./response-parser";
import {
  matchRoss1000Response,
} from "./response-matcher";
import type {
  Ross1000SoapResponse,
} from "./soap-transport";
import {
  authorizeRoss1000TransmissionSend,
} from "./transmission-send-gate";

export type Ross1000TransmissionForSend = {
  id: string;
  propertyId: string;
  status: string;
  payloadXml: string;
};

export type Ross1000TransmissionOrchestratorStore = {
  getById(
    transmissionId: string,
  ): Promise<Ross1000TransmissionForSend | null>;

  beginSending(
    transmissionId: string,
  ): Promise<boolean>;

  markConfirmed(
    transmissionId: string,
    responseSuccess?: boolean,
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

export type Ross1000MovementSender = {
  sendMovements(
    credentials: {
      username: string;
      password: string;
    },
    payloadXml: string,
  ): Promise<Ross1000SoapResponse>;
};

export async function sendRoss1000Transmission(
  transmissionId: string,
  credentialProvider: Ross1000CredentialProvider,
  sender: Ross1000MovementSender,
  store: Ross1000TransmissionOrchestratorStore,
): Promise<void> {
  const id = transmissionId.trim();

  if (!id) {
    throw new NonRetryableBackgroundJobError(
      "Transmission ROSS1000 non valida.",
    );
  }

  const transmission =
    await store.getById(id);

  if (!transmission) {
    throw new NonRetryableBackgroundJobError(
      "Transmission ROSS1000 non trovata.",
    );
  }

  if (transmission.status !== "PREPARED") {
    throw new NonRetryableBackgroundJobError(
      "Transmission ROSS1000 non autorizzata all'invio.",
    );
  }

  try {
    await authorizeRoss1000TransmissionSend(
      id,
      store,
    );
  } catch (error) {
    throw new NonRetryableBackgroundJobError(
      errorMessage(
        error,
        "Transmission ROSS1000 non autorizzata all'invio.",
      ),
    );
  }

  let credentials: {
    username: string;
    password: string;
  };

  try {
    credentials =
      await credentialProvider.getCredentials({
        propertyId: transmission.propertyId,
      });
  } catch (error) {
    const message = errorMessage(
      error,
      "Credenziali ROSS1000 non disponibili.",
    );

    const persisted =
      await persistSafely(() =>
        store.markRejected(
          id,
          message,
        ),
      );

    if (!persisted) {
      throw new NonRetryableBackgroundJobError(
        "Errore ROSS1000 pre-invio non persistito.",
      );
    }

    throw new NonRetryableBackgroundJobError(
      message,
    );
  }

  let soapResponse: Ross1000SoapResponse;

  try {
    soapResponse =
      await sender.sendMovements(
        credentials,
        transmission.payloadXml,
      );
  } catch (error) {
    const message = errorMessage(
      error,
      "Esito invio ROSS1000 non determinabile.",
    );

    await persistSafely(() =>
      store.markOutcomeUnknown(
        id,
        message,
      ),
    );

    throw new NonRetryableBackgroundJobError(
      message,
    );
  }

  let parsed;

  try {
    parsed =
      parseRoss1000Response(
        soapResponse.xml,
      );
  } catch (error) {
    const message = errorMessage(
      error,
      "Risposta ROSS1000 non interpretabile.",
    );

    await persistSafely(() =>
      store.markOutcomeUnknown(
        id,
        message,
      ),
    );

    throw new NonRetryableBackgroundJobError(
      message,
    );
  }

  let match;

  try {
    match =
      matchRoss1000Response(
        transmission.payloadXml,
        parsed,
      );
  } catch (error) {
    const message = errorMessage(
      error,
      "Risposta ROSS1000 non coerente con il payload inviato.",
    );

    await persistSafely(() =>
      store.markOutcomeUnknown(
        id,
        message,
      ),
    );

    throw new NonRetryableBackgroundJobError(
      message,
    );
  }

  if (!match.complete) {
    const message =
      "Risposta ROSS1000 incompleta o incoerente con il payload inviato.";

    const persisted =
      await persistSafely(() =>
        store.markOutcomeUnknown(
          id,
          message,
        ),
      );

    if (!persisted) {
      throw new NonRetryableBackgroundJobError(
        "Esito ROSS1000 ricevuto ma non persistito.",
      );
    }

    throw new NonRetryableBackgroundJobError(
      message,
    );
  }

  if (match.rejected.length > 0) {
    const message =
      rejectionMessage(
        match.rejected,
      );

    const persisted =
      await persistSafely(() =>
        store.markRejected(
          id,
          message,
        ),
      );

    if (!persisted) {
      throw new NonRetryableBackgroundJobError(
        "Esito ROSS1000 ricevuto ma non persistito.",
      );
    }

    throw new NonRetryableBackgroundJobError(
      message,
    );
  }

  if (!match.successful) {
    const message =
      "Esito ROSS1000 non determinabile.";

    const persisted =
      await persistSafely(() =>
        store.markOutcomeUnknown(
          id,
          message,
        ),
      );

    if (!persisted) {
      throw new NonRetryableBackgroundJobError(
        "Esito ROSS1000 ricevuto ma non persistito.",
      );
    }

    throw new NonRetryableBackgroundJobError(
      message,
    );
  }

  const persisted =
    await persistSafely(() =>
      store.markConfirmed(
        id,
        true,
      ),
    );

  if (!persisted) {
    throw new NonRetryableBackgroundJobError(
      "Esito ROSS1000 ricevuto ma non persistito.",
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

function rejectionMessage(
  rejected: Array<{
    idswh: string;
    error?: string;
  }>,
): string {
  const details =
    rejected.map((item) =>
      item.error?.trim()
        ? `${item.idswh}: ${item.error.trim()}`
        : `${item.idswh}: rifiutato`,
    );

  return (
    "ROSS1000 ha rifiutato uno o più record: " +
    details.join(" | ")
  );
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
