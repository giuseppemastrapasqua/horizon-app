import {
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  Ross1000SoapTransport,
} from "./soap-transport";

const credentials = {
  username: "test-user",
  password: "test-password",
};

const payloadXml =
  `<?xml version="1.0" encoding="UTF-8"?>` +
  `<movimenti>` +
  `<codice>TEST</codice>` +
  `<prodotto>Horizon</prodotto>` +
  `<movimento>` +
  `<data>20260929</data>` +
  `</movimento>` +
  `</movimenti>`;

function response(
  body: string,
  status = 200,
): Response {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "text/xml",
    },
  });
}

describe("Ross1000SoapTransport", () => {
  it("sends SOAP 1.1 to the Lombardia endpoint with Basic Auth", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      response(
        `<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">` +
          `<soap:Body>` +
          `<inviaMovimentazioneResponse>` +
          `<return />` +
          `</inviaMovimentazioneResponse>` +
          `</soap:Body>` +
          `</soap:Envelope>`,
      ),
    );

    const transport =
      new Ross1000SoapTransport(
        fetchImpl as typeof fetch,
      );

    await transport.sendMovements(
      credentials,
      payloadXml,
    );

    expect(fetchImpl).toHaveBeenCalledTimes(1);

    const [url, init] =
      fetchImpl.mock.calls[0];

    expect(url).toBe(
      "https://www.flussituristici.servizirl.it/Turismo5/app/ws/checkinV2",
    );

    expect(init.method).toBe("POST");

    expect(init.headers).toEqual({
      "Content-Type":
        "text/xml; charset=utf-8",
      SOAPAction: '""',
      Authorization:
        `Basic ${Buffer.from(
          "test-user:test-password",
          "utf8",
        ).toString("base64")}`,
    });

    expect(init.signal).toBeInstanceOf(
      AbortSignal,
    );

    const body = String(init.body);

    expect(body).toContain(
      `xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"`,
    );

    expect(body).toContain(
      `<ns2:inviaMovimentazione xmlns:ns2="http://checkin.ws.service.turismo5.gies.it/">`,
    );

    expect(body).toContain(
      `<movimentazione><codice>TEST</codice>`,
    );

    expect(body).not.toContain(
      `<movimentazione><?xml`,
    );

    expect(body).not.toContain(
      `<movimentazione><movimenti>`,
    );
  });

  it("returns the HTTP status and raw response XML", async () => {
    const xml =
      `<soap:Envelope>` +
      `<soap:Body>` +
      `<inviaMovimentazioneResponse>` +
      `<return />` +
      `</inviaMovimentazioneResponse>` +
      `</soap:Body>` +
      `</soap:Envelope>`;

    const fetchImpl =
      vi.fn().mockResolvedValue(
        response(xml),
      );

    const transport =
      new Ross1000SoapTransport(
        fetchImpl as typeof fetch,
      );

    await expect(
      transport.sendMovements(
        credentials,
        payloadXml,
      ),
    ).resolves.toEqual({
      httpStatus: 200,
      xml,
    });
  });

  it("rejects SOAP Fault responses", async () => {
    const fetchImpl =
      vi.fn().mockResolvedValue(
        response(
          `<soap:Envelope>` +
            `<soap:Body>` +
            `<soap:Fault>` +
            `<faultstring>Credenziali non valide</faultstring>` +
            `</soap:Fault>` +
            `</soap:Body>` +
            `</soap:Envelope>`,
          500,
        ),
      );

    const transport =
      new Ross1000SoapTransport(
        fetchImpl as typeof fetch,
      );

    await expect(
      transport.sendMovements(
        credentials,
        payloadXml,
      ),
    ).rejects.toThrow(
      "ROSS1000 SOAP Fault: Credenziali non valide",
    );
  });

  it("rejects non-success HTTP responses", async () => {
    const fetchImpl =
      vi.fn().mockResolvedValue(
        response("Service unavailable", 503),
      );

    const transport =
      new Ross1000SoapTransport(
        fetchImpl as typeof fetch,
      );

    await expect(
      transport.sendMovements(
        credentials,
        payloadXml,
      ),
    ).rejects.toThrow(
      "ROSS1000 HTTP 503.",
    );
  });

  it("rejects invalid local inputs before fetch", async () => {
    const fetchImpl = vi.fn();

    const transport =
      new Ross1000SoapTransport(
        fetchImpl as typeof fetch,
      );

    await expect(
      transport.sendMovements(
        {
          username: " ",
          password: "password",
        },
        payloadXml,
      ),
    ).rejects.toThrow(
      "ROSS1000: username mancante.",
    );

    await expect(
      transport.sendMovements(
        {
          username: "user",
          password: "",
        },
        payloadXml,
      ),
    ).rejects.toThrow(
      "ROSS1000: password mancante.",
    );

    await expect(
      transport.sendMovements(
        credentials,
        " ",
      ),
    ).rejects.toThrow(
      "ROSS1000: payload XML vuoto.",
    );

    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("rejects a payload without the movimenti root before fetch", async () => {
    const fetchImpl = vi.fn();

    const transport =
      new Ross1000SoapTransport(
        fetchImpl as typeof fetch,
      );

    await expect(
      transport.sendMovements(
        credentials,
        "<invalid />",
      ),
    ).rejects.toThrow(
      "ROSS1000: payload XML privo della radice movimenti.",
    );

    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("rejects invalid timeout configuration", () => {
    expect(
      () =>
        new Ross1000SoapTransport(
          vi.fn() as typeof fetch,
          0,
        ),
    ).toThrow(
      "Timeout ROSS1000 non valido.",
    );
  });

  it("converts an aborted request into a ROSS1000 timeout", async () => {
    const fetchImpl = vi.fn(
      async (
        _url: RequestInfo | URL,
        init?: RequestInit,
      ) =>
        await new Promise<Response>(
          (_resolve, reject) => {
            init?.signal?.addEventListener(
              "abort",
              () =>
                reject(
                  new DOMException(
                    "Aborted",
                    "AbortError",
                  ),
                ),
            );
          },
        ),
    );

    const transport =
      new Ross1000SoapTransport(
        fetchImpl as typeof fetch,
        5,
      );

    await expect(
      transport.sendMovements(
        credentials,
        payloadXml,
      ),
    ).rejects.toThrow(
      "Timeout ROSS1000 dopo 5 ms.",
    );
  });
});
