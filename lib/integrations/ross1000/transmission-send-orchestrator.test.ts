import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  sendRoss1000Transmission,
} from "./transmission-send-orchestrator";

const payloadXml =
  `<?xml version="1.0" encoding="UTF-8"?>` +
  `<movimenti>` +
  `<codice>TEST</codice>` +
  `<prodotto>Horizon</prodotto>` +
  `<movimento>` +
  `<data>20260929</data>` +
  `<struttura>` +
  `<apertura>SI</apertura>` +
  `<camereoccupate>1</camereoccupate>` +
  `<cameredisponibili>2</cameredisponibili>` +
  `<lettidisponibili>4</lettidisponibili>` +
  `</struttura>` +
  `<arrivi>` +
  `<arrivo><idswh>H001</idswh></arrivo>` +
  `</arrivi>` +
  `</movimento>` +
  `</movimenti>`;

function responseXml(
  success: boolean,
  idswh = "H001",
  error?: string,
): string {
  return (
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">` +
    `<soap:Body>` +
    `<inviaMovimentazioneResponse>` +
    `<return>` +
    `<risultatiGiorno data="20260929">` +
    `<arrivi>` +
    `<arrivo>` +
    `<idswh>${idswh}</idswh>` +
    `<successo>${success}</successo>` +
    (error
      ? `<errore>${error}</errore>`
      : "") +
    `</arrivo>` +
    `</arrivi>` +
    `</risultatiGiorno>` +
    `</return>` +
    `</inviaMovimentazioneResponse>` +
    `</soap:Body>` +
    `</soap:Envelope>`
  );
}

describe("sendRoss1000Transmission", () => {
  const getById = vi.fn();
  const beginSending = vi.fn();
  const markConfirmed = vi.fn();
  const markRejected = vi.fn();
  const markOutcomeUnknown = vi.fn();
  const getCredentials = vi.fn();
  const sendMovements = vi.fn();

  const store = {
    getById,
    beginSending,
    markConfirmed,
    markRejected,
    markOutcomeUnknown,
  };

  const credentialProvider = {
    getCredentials,
  };

  const sender = {
    sendMovements,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    getById.mockResolvedValue({
      id: "transmission-1",
      propertyId: "property-1",
      status: "PREPARED",
      payloadXml,
    });

    beginSending.mockResolvedValue(true);

    getCredentials.mockResolvedValue({
      username: "user",
      password: "secret",
    });

    markConfirmed.mockResolvedValue(true);
    markRejected.mockResolvedValue(true);
    markOutcomeUnknown.mockResolvedValue(true);

    sendMovements.mockResolvedValue({
      httpStatus: 200,
      xml: responseXml(true),
    });
  });

  it("confirms only a complete successful response", async () => {
    await expect(
      sendRoss1000Transmission(
        "transmission-1",
        credentialProvider,
        sender,
        store,
      ),
    ).resolves.toBeUndefined();

    expect(beginSending).toHaveBeenCalledWith(
      "transmission-1",
    );

    expect(sendMovements).toHaveBeenCalledWith(
      {
        username: "user",
        password: "secret",
      },
      payloadXml,
    );

    expect(markConfirmed).toHaveBeenCalledWith(
      "transmission-1",
      true,
    );

    expect(markRejected).not.toHaveBeenCalled();
    expect(markOutcomeUnknown).not.toHaveBeenCalled();
  });

  it("does not send when SENDING cannot be acquired", async () => {
    beginSending.mockResolvedValue(false);

    await expect(
      sendRoss1000Transmission(
        "transmission-1",
        credentialProvider,
        sender,
        store,
      ),
    ).rejects.toThrow(
      "Transmission ROSS1000 non autorizzata all'invio.",
    );

    expect(sendMovements).not.toHaveBeenCalled();
  });

  it("marks a certain application rejection as REJECTED", async () => {
    sendMovements.mockResolvedValue({
      httpStatus: 200,
      xml: responseXml(
        false,
        "H001",
        "Codice non valido",
      ),
    });

    await expect(
      sendRoss1000Transmission(
        "transmission-1",
        credentialProvider,
        sender,
        store,
      ),
    ).rejects.toThrow(
      "ROSS1000 ha rifiutato uno o più record",
    );

    expect(markRejected).toHaveBeenCalledWith(
      "transmission-1",
      expect.stringContaining(
        "Codice non valido",
      ),
    );

    expect(markConfirmed).not.toHaveBeenCalled();
  });

  it("marks a transport failure as OUTCOME_UNKNOWN", async () => {
    sendMovements.mockRejectedValue(
      new Error(
        "Timeout ROSS1000 dopo 10000 ms.",
      ),
    );

    await expect(
      sendRoss1000Transmission(
        "transmission-1",
        credentialProvider,
        sender,
        store,
      ),
    ).rejects.toThrow(
      "Timeout ROSS1000 dopo 10000 ms.",
    );

    expect(
      markOutcomeUnknown,
    ).toHaveBeenCalledWith(
      "transmission-1",
      "Timeout ROSS1000 dopo 10000 ms.",
    );

    expect(markConfirmed).not.toHaveBeenCalled();
  });

  it("marks an incomplete response as OUTCOME_UNKNOWN", async () => {
    sendMovements.mockResolvedValue({
      httpStatus: 200,
      xml:
        `<?xml version="1.0"?>` +
        `<Envelope><Body>` +
        `<risultatiGiorno data="20260929">` +
        `</risultatiGiorno>` +
        `</Body></Envelope>`,
    });

    await expect(
      sendRoss1000Transmission(
        "transmission-1",
        credentialProvider,
        sender,
        store,
      ),
    ).rejects.toThrow(
      "Risposta ROSS1000 incompleta o incoerente",
    );

    expect(
      markOutcomeUnknown,
    ).toHaveBeenCalled();

    expect(markConfirmed).not.toHaveBeenCalled();
  });

  it("does not send when credentials cannot be loaded", async () => {
    getCredentials.mockRejectedValue(
      new Error(
        "Credenziali ROSS1000 non configurate.",
      ),
    );

    await expect(
      sendRoss1000Transmission(
        "transmission-1",
        credentialProvider,
        sender,
        store,
      ),
    ).rejects.toThrow(
      "Credenziali ROSS1000 non configurate.",
    );

    expect(sendMovements).not.toHaveBeenCalled();

    expect(markRejected).toHaveBeenCalledWith(
      "transmission-1",
      "Credenziali ROSS1000 non configurate.",
    );
  });

  it("refuses a transmission that is not PREPARED", async () => {
    getById.mockResolvedValue({
      id: "transmission-1",
      propertyId: "property-1",
      status: "CONFIRMED",
      payloadXml,
    });

    await expect(
      sendRoss1000Transmission(
        "transmission-1",
        credentialProvider,
        sender,
        store,
      ),
    ).rejects.toThrow(
      "Transmission ROSS1000 non autorizzata all'invio.",
    );

    expect(beginSending).not.toHaveBeenCalled();
    expect(sendMovements).not.toHaveBeenCalled();
  });

  it("does not pretend success when the terminal state cannot be persisted", async () => {
    markConfirmed.mockResolvedValue(false);

    await expect(
      sendRoss1000Transmission(
        "transmission-1",
        credentialProvider,
        sender,
        store,
      ),
    ).rejects.toThrow(
      "Esito ROSS1000 ricevuto ma non persistito.",
    );
  });
});
