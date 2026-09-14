import type {
  BackgroundJob,
  Prisma,
} from "@prisma/client";

import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  MockAlloggiatiWebTransport,
} from "@/lib/integrations/alloggiati-web/mock-transport";
import {
  MockAlloggiatiReferenceResolver,
} from "@/lib/integrations/alloggiati-web/mock-reference-resolver";
import {
  AlloggiatiWebAdapter,
} from "@/lib/integrations/alloggiati-web/adapter";
import {
  prepareBookingSubmission,
} from "@/lib/integrations/alloggiati-web/prepare-booking-submission";
import type {
  AlloggiatiWebSubmission,
} from "@/lib/integrations/alloggiati-web/types";

import {
  processAlloggiatiWebSubmissionJob,
} from "./process-alloggiati-web-submission-job";

const {
  bookingFindUniqueMock,
  connectionFindUniqueMock,
} = vi.hoisted(() => ({
  bookingFindUniqueMock: vi.fn(),
  connectionFindUniqueMock: vi.fn(),
}));

const createFingerprintMock = vi.fn();
const prepareTransmissionMock = vi.fn();
const beginSendingMock = vi.fn();
const recordAcceptedRecordsMock = vi.fn();
const markRejectedMock = vi.fn();
const markOutcomeUnknownMock = vi.fn();
const sendTransmissionMock = vi.fn();

const transmissionDependencies = {
  createFingerprint: createFingerprintMock,
  transmissionStore: {
    prepare: prepareTransmissionMock,
    beginSending: beginSendingMock,
    recordAcceptedRecords:
      recordAcceptedRecordsMock,
    markRejected: markRejectedMock,
    markOutcomeUnknown:
      markOutcomeUnknownMock,
  },
  createSender: vi.fn(() => ({
    submit: vi.fn(),
  })),
  sendTransmission:
    sendTransmissionMock,
};

vi.mock(
  "@/lib/prisma",
  () => ({
    prisma: {
      booking: {
        findUnique: bookingFindUniqueMock,
      },
      alloggiatiWebProperty: {
        findUnique: connectionFindUniqueMock,
      },
    },
  }),
);

function createJob(
  input: {
    type?: BackgroundJob["type"];
    payload?: Prisma.JsonValue;
  } = {},
): BackgroundJob {
  const now = new Date(
    "2026-09-01T12:00:00.000Z",
  );

  return {
    id: "job-1",
    type:
      input.type ??
      "ALLOGGIATI_WEB_SUBMISSION",
    payload:
      input.payload ??
      {
        bookingId: "booking-1",
        propertyId: "property-1",
      },
    status: "QUEUED",
    attempts: 0,
    maxAttempts: 3,
    availableAt: now,
    startedAt: null,
    finishedAt: null,
    lastError: null,
    createdAt: now,
    updatedAt: now,
    deduplicationKey: null,
    heartbeatAt: null,
  };
}

const booking = {
  id: "booking-1",
  propertyId: "property-1",
  checkIn: new Date(
    "2026-09-01T00:00:00.000Z",
  ),
  checkOut: new Date(
    "2026-09-04T00:00:00.000Z",
  ),
  nights: 3,
  guests: 1,
  bookingGuests: [
    {
      role: "SINGLE_GUEST",
      firstName: "Mario",
      lastName: "Rossi",
      gender: "MALE",
      birthDate: new Date(
        "1980-01-02T00:00:00.000Z",
      ),
      birthCity: "Milano",
      birthProvince: "MI",
      birthCountry: "ITALIA",
      citizenship: "ITALIA",
      documentType: "CARTA_IDENTITA",
      documentNumber: "AA1234567",
      documentIssueCountry: "ITALIA",
      documentIssueCity: "Milano",
    },
  ],
};

const resolver =
  new MockAlloggiatiReferenceResolver(
    {
      ITALIA: "100000100",
    },
    {
      "Milano|MI": "403015146",
      Milano: "403015146",
    },
    {
      CARTA_IDENTITA: "IDENT",
    },
  );

describe(
  "processAlloggiatiWebSubmissionJob",
  () => {
    beforeEach(() => {
      vi.clearAllMocks();

      bookingFindUniqueMock.mockResolvedValue(
        booking,
      );

      connectionFindUniqueMock.mockResolvedValue({
        apartmentId: "123",
      });

      createFingerprintMock.mockReturnValue(
        "hash-1",
      );

      prepareTransmissionMock.mockResolvedValue({
        id: "transmission-1",
        status: "PREPARED",
      });

      sendTransmissionMock.mockResolvedValue(
        undefined,
      );
    });

    it(
      "rifiuta un tipo di job diverso",
      async () => {
        await expect(
          processAlloggiatiWebSubmissionJob(
            createJob({
              type: "BOOKING_SYNC",
            }),
          ),
        ).rejects.toThrow(
          "Tipo di job non supportato dall'handler Alloggiati Web: BOOKING_SYNC.",
        );

        expect(
          bookingFindUniqueMock,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "rifiuta un payload JSON non valido",
      async () => {
        await expect(
          processAlloggiatiWebSubmissionJob(
            createJob({
              payload: "invalid",
            }),
          ),
        ).rejects.toThrow(
          "ALLOGGIATI_WEB_SUBMISSION con payload JSON non valido.",
        );
      },
    );

    it(
      "rifiuta una prenotazione inesistente",
      async () => {
        bookingFindUniqueMock.mockResolvedValue(
          null,
        );

        await expect(
          processAlloggiatiWebSubmissionJob(
            createJob(),
          ),
        ).rejects.toThrow(
          "Prenotazione Alloggiati non trovata: booking-1.",
        );
      },
    );

    it(
      "rifiuta il mismatch della struttura",
      async () => {
        bookingFindUniqueMock.mockResolvedValue({
          ...booking,
          propertyId: "property-2",
        });

        await expect(
          processAlloggiatiWebSubmissionJob(
            createJob(),
          ),
        ).rejects.toThrow(
          "La prenotazione Alloggiati non appartiene alla struttura del job.",
        );

        expect(
          connectionFindUniqueMock,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "richiede il collegamento Alloggiati Web",
      async () => {
        connectionFindUniqueMock.mockResolvedValue(
          null,
        );

        await expect(
          processAlloggiatiWebSubmissionJob(
            createJob(),
          ),
        ).rejects.toThrow(
          "Alloggiati Web non configurato per la struttura.",
        );
      },
    );

    it(
      "rifiuta un IdAppartamento non numerico",
      async () => {
        connectionFindUniqueMock.mockResolvedValue({
          apartmentId: "APT-123",
        });

        await expect(
          processAlloggiatiWebSubmissionJob(
            createJob(),
          ),
        ).rejects.toThrow(
          "IdAppartamento Alloggiati Web non valido.",
        );
      },
    );
    it(
      "supporta una utenza standard senza apartmentId",
      async () => {
        connectionFindUniqueMock.mockResolvedValue({
          apartmentId: null,
        });

        let prepared:
          | AlloggiatiWebSubmission
          | undefined;

        const validateSubmission = vi.fn(
          async () => ({
            success: true,
          }),
        );

        await expect(
          processAlloggiatiWebSubmissionJob(
            createJob(),
            {
              getReferenceResolver:
                async () => resolver,
              prepareSubmission:
                async (input, referenceResolver) => {
                  prepared =
                    await prepareBookingSubmission(
                      input,
                      referenceResolver,
                    );

                  return prepared;
                },
              credentialProvider: {
                getCredentials: async () => ({
                  username: "test-user",
                  password: "test-password",
                  wsKey: "test-wskey",
                }),
              },
              createValidator: () => ({
                validateSubmission,
              }),
              ...transmissionDependencies,
            },
          ),
        ).resolves.toBeUndefined();

        expect(prepared).toBeDefined();
        expect(prepared?.apartmentId).toBeUndefined();

        expect(
          createFingerprintMock,
        ).toHaveBeenCalledWith(prepared);

        expect(
          prepareTransmissionMock,
        ).toHaveBeenCalledWith({
          bookingId: "booking-1",
          propertyId: "property-1",
          apartmentId: null,
          payloadHash: "hash-1",
          recordsCount: 1,
        });
      },
    );

    it(
      "rifiuta dati ospiti incompleti",
      async () => {
        bookingFindUniqueMock.mockResolvedValue({
          ...booking,
          guests: 2,
        });

        await expect(
          processAlloggiatiWebSubmissionJob(
            createJob(),
          ),
        ).rejects.toThrow(
          "Dati ospiti Alloggiati incompleti rispetto alla prenotazione.",
        );
      },
    );

    it(
      "prepara la submission prima del preflight",
      async () => {
        let prepared:
          | AlloggiatiWebSubmission
          | undefined;

        const validateSubmission = vi.fn(
          async () => ({
            success: true,
          }),
        );

        await expect(
          processAlloggiatiWebSubmissionJob(
            createJob(),
            {
              getReferenceResolver:
                async () => resolver,
              prepareSubmission:
                async (input, referenceResolver) => {
                  prepared =
                    await prepareBookingSubmission(
                      input,
                      referenceResolver,
                    );

                  return prepared;
                },
              credentialProvider: {
                getCredentials: async () => ({
                  username: "test-user",
                  password: "test-password",
                  wsKey: "test-wskey",
                }),
              },
              createValidator: () => ({
                validateSubmission,
              }),
              ...transmissionDependencies,
            },
          ),
        ).resolves.toBeUndefined();

        expect(prepared).toBeDefined();
        expect(prepared?.apartmentId).toBe(
          "123",
        );
        expect(prepared?.records).toHaveLength(
          1,
        );
        expect(
          prepared?.records[0],
        ).toHaveLength(168);
        expect(
          prepared?.records[0].slice(0, 2),
        ).toBe("16");

        expect(
          validateSubmission,
        ).toHaveBeenCalledWith(prepared);

        expect(
          bookingFindUniqueMock,
        ).toHaveBeenCalledTimes(1);

        expect(
          connectionFindUniqueMock,
        ).toHaveBeenCalledTimes(1);

        expect(
          createFingerprintMock,
        ).toHaveBeenCalledWith(prepared);

        expect(
          prepareTransmissionMock,
        ).toHaveBeenCalledWith({
          bookingId: "booking-1",
          propertyId: "property-1",
          apartmentId: "123",
          payloadHash: "hash-1",
          recordsCount: 1,
        });
      },
    );

    it(
      "esegue il preflight senza inviare",
      async () => {
        const transport =
          new MockAlloggiatiWebTransport();

        const credentialProvider = {
          getCredentials: vi.fn(
            async () => ({
              username: "test-user",
              password: "test-password",
              wsKey: "test-wskey",
            }),
          ),
        };

        await expect(
          processAlloggiatiWebSubmissionJob(
            createJob(),
            {
              getReferenceResolver:
                async () => resolver,
              credentialProvider,
              createValidator: (credentials) =>
                new AlloggiatiWebAdapter(
                  transport,
                  credentials,
                ),
              ...transmissionDependencies,
            },
          ),
        ).resolves.toBeUndefined();

        expect(
          credentialProvider.getCredentials,
        ).toHaveBeenCalledWith({
          propertyId: "property-1",
        });

        expect(
          transport.authenticatedWith,
        ).toHaveLength(1);

        expect(
          transport.validatedSubmissions,
        ).toHaveLength(1);

        expect(
          transport.validatedSubmissions[0]
            .apartmentId,
        ).toBe("123");

        expect(
          transport.validatedSubmissions[0]
            .records[0],
        ).toHaveLength(168);

        expect(
          transport.submitted,
        ).toHaveLength(0);
      },
    );

    it(
      "non prepara la transmission se il preflight fallisce",
      async () => {
        const validateSubmission = vi.fn(
          async () => ({
            success: false,
            errors: [
              "Schedina non valida.",
            ],
          }),
        );

        await expect(
          processAlloggiatiWebSubmissionJob(
            createJob(),
            {
              getReferenceResolver:
                async () => resolver,
              credentialProvider: {
                getCredentials: async () => ({
                  username: "test-user",
                  password: "test-password",
                  wsKey: "test-wskey",
                }),
              },
              createValidator: () => ({
                validateSubmission,
              }),
              ...transmissionDependencies,
            },
          ),
        ).rejects.toThrow();

        expect(
          validateSubmission,
        ).toHaveBeenCalledTimes(1);

        expect(
          createFingerprintMock,
        ).not.toHaveBeenCalled();

        expect(
          prepareTransmissionMock,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "completa il preflight prima di avviare il Send",
      async () => {
        const order: string[] = [];

        const validateSubmission = vi.fn(
          async () => {
            order.push("preflight");
            return {
              success: true,
            };
          },
        );

        prepareTransmissionMock.mockImplementation(
          async () => {
            order.push("prepare");

            return {
              id: "transmission-1",
              status: "PREPARED",
            };
          },
        );

        const sendTransmission =
          vi.fn(async () => {
            order.push("send");
          });

        await processAlloggiatiWebSubmissionJob(
          createJob(),
          {
            getReferenceResolver:
              async () => resolver,
            credentialProvider: {
              getCredentials: async () => ({
                username: "test-user",
                password: "test-password",
                wsKey: "test-wskey",
              }),
            },
            createValidator: () => ({
              validateSubmission,
            }),
            createFingerprint:
              createFingerprintMock,
            transmissionStore: {
              prepare: prepareTransmissionMock,
              beginSending:
                beginSendingMock,
              recordAcceptedRecords:
                recordAcceptedRecordsMock,
              markRejected:
                markRejectedMock,
              markOutcomeUnknown:
                markOutcomeUnknownMock,
            },
            createSender: vi.fn(() => ({
              submit: vi.fn(),
            })),
            sendTransmission,
          },
        );

        expect(order).toEqual([
          "preflight",
          "prepare",
          "send",
        ]);
      },
    );
    it(
      "invia la transmission preparata tramite orchestrator",
      async () => {
        const validateSubmission = vi.fn(
          async () => ({
            success: true,
          }),
        );

        await expect(
          processAlloggiatiWebSubmissionJob(
            createJob(),
            {
              getReferenceResolver:
                async () => resolver,
              credentialProvider: {
                getCredentials: async () => ({
                  username: "test-user",
                  password: "test-password",
                  wsKey: "test-wskey",
                }),
              },
              createValidator: () => ({
                validateSubmission,
              }),
              ...transmissionDependencies,
            },
          ),
        ).resolves.toBeUndefined();

        expect(
          prepareTransmissionMock,
        ).toHaveBeenCalledTimes(1);

        expect(
          sendTransmissionMock,
        ).toHaveBeenCalledTimes(1);

        expect(
          sendTransmissionMock,
        ).toHaveBeenCalledWith(
          "transmission-1",
          expect.objectContaining({
            apartmentId: "123",
          }),
          expect.anything(),
          transmissionDependencies.transmissionStore,
        );
      },
    );
  },
);
