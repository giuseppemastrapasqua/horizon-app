import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  NonRetryableBackgroundJobError,
} from "@/lib/job/background-job-errors";

import {
  sendAlloggiatiTransmission,
} from "./transmission-send-orchestrator";

function createSubmission(
  recordsCount = 3,
) {
  return {
    records: Array.from(
      { length: recordsCount },
      (_, index) => `record-${index + 1}`,
    ),
    apartmentId: "123",
  };
}

function createStore() {
  return {
    beginSending: vi.fn<
      (id: string) => Promise<boolean>
    >().mockResolvedValue(true),

    recordAcceptedRecords: vi.fn<
      (
        id: string,
        acceptedRecords: number,
      ) => Promise<boolean>
    >().mockResolvedValue(true),

    markRejected: vi.fn<
      (
        id: string,
        error: string,
      ) => Promise<boolean>
    >().mockResolvedValue(true),

    markOutcomeUnknown: vi.fn<
      (
        id: string,
        error: string,
      ) => Promise<boolean>
    >().mockResolvedValue(true),
  };
}

describe(
  "sendAlloggiatiTransmission",
  () => {
    it(
      "non invia se il gate nega la transmission",
      async () => {
        const store = createStore();

        store.beginSending.mockResolvedValue(
          false,
        );

        const sender = {
          submit: vi.fn(),
        };

        await expect(
          sendAlloggiatiTransmission(
            "transmission-1",
            createSubmission(),
            sender,
            store,
          ),
        ).rejects.toThrow(
          "Transmission Alloggiati Web non autorizzata all'invio.",
        );

        expect(
          sender.submit,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "conferma un invio completamente acquisito",
      async () => {
        const store = createStore();

        const sender = {
          submit: vi.fn().mockResolvedValue({
            success: true,
            acceptedRecords: 3,
          }),
        };

        await expect(
          sendAlloggiatiTransmission(
            "transmission-1",
            createSubmission(),
            sender,
            store,
          ),
        ).resolves.toBeUndefined();

        expect(
          store.recordAcceptedRecords,
        ).toHaveBeenCalledWith(
          "transmission-1",
          3,
        );

        expect(
          store.markRejected,
        ).not.toHaveBeenCalled();

        expect(
          store.markOutcomeUnknown,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "persiste il parziale e blocca il retry",
      async () => {
        const store = createStore();

        const sender = {
          submit: vi.fn().mockResolvedValue({
            success: false,
            acceptedRecords: 2,
            message: "Una schedina rifiutata.",
          }),
        };

        const promise =
          sendAlloggiatiTransmission(
            "transmission-1",
            createSubmission(),
            sender,
            store,
          );

        await expect(
          promise,
        ).rejects.toBeInstanceOf(
          NonRetryableBackgroundJobError,
        );

        expect(
          store.recordAcceptedRecords,
        ).toHaveBeenCalledWith(
          "transmission-1",
          2,
        );
      },
    );

    it(
      "marca REJECTED con zero record acquisiti",
      async () => {
        const store = createStore();

        const sender = {
          submit: vi.fn().mockResolvedValue({
            success: false,
            acceptedRecords: 0,
            message: "Schedine rifiutate.",
          }),
        };

        const promise =
          sendAlloggiatiTransmission(
            "transmission-1",
            createSubmission(),
            sender,
            store,
          );

        await expect(
          promise,
        ).rejects.toBeInstanceOf(
          NonRetryableBackgroundJobError,
        );

        expect(
          store.markRejected,
        ).toHaveBeenCalledWith(
          "transmission-1",
          "Schedine rifiutate.",
        );

        expect(
          store.recordAcceptedRecords,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "marca OUTCOME_UNKNOWN se submit fallisce",
      async () => {
        const store = createStore();

        const sender = {
          submit: vi
            .fn()
            .mockRejectedValue(
              new Error(
                "Timeout dopo Send.",
              ),
            ),
        };

        const promise =
          sendAlloggiatiTransmission(
            "transmission-1",
            createSubmission(),
            sender,
            store,
          );

        await expect(
          promise,
        ).rejects.toBeInstanceOf(
          NonRetryableBackgroundJobError,
        );

        expect(
          store.markOutcomeUnknown,
        ).toHaveBeenCalledWith(
          "transmission-1",
          "Timeout dopo Send.",
        );
      },
    );

    it(
      "resta non retryable se OUTCOME_UNKNOWN non viene persistito",
      async () => {
        const store = createStore();

        store.markOutcomeUnknown
          .mockRejectedValue(
            new Error("Database offline."),
          );

        const sender = {
          submit: vi
            .fn()
            .mockRejectedValue(
              new Error(
                "Connessione interrotta.",
              ),
            ),
        };

        await expect(
          sendAlloggiatiTransmission(
            "transmission-1",
            createSubmission(),
            sender,
            store,
          ),
        ).rejects.toBeInstanceOf(
          NonRetryableBackgroundJobError,
        );
      },
    );

    it(
      "blocca il retry se l'esito remoto non viene persistito",
      async () => {
        const store = createStore();

        store.recordAcceptedRecords
          .mockResolvedValue(false);

        const sender = {
          submit: vi.fn().mockResolvedValue({
            success: true,
            acceptedRecords: 3,
          }),
        };

        await expect(
          sendAlloggiatiTransmission(
            "transmission-1",
            createSubmission(),
            sender,
            store,
          ),
        ).rejects.toThrow(
          "Esito Alloggiati Web ricevuto ma non persistito.",
        );
      },
    );

    it(
      "rifiuta acceptedRecords incoerente senza classificare l'esito",
      async () => {
        const store = createStore();

        const sender = {
          submit: vi.fn().mockResolvedValue({
            success: true,
            acceptedRecords: 4,
          }),
        };

        const promise =
          sendAlloggiatiTransmission(
            "transmission-1",
            createSubmission(),
            sender,
            store,
          );

        await expect(
          promise,
        ).rejects.toBeInstanceOf(
          NonRetryableBackgroundJobError,
        );

        expect(
          store.recordAcceptedRecords,
        ).not.toHaveBeenCalled();

        expect(
          store.markRejected,
        ).not.toHaveBeenCalled();

        expect(
          store.markOutcomeUnknown,
        ).not.toHaveBeenCalled();
      },
    );
  },
);