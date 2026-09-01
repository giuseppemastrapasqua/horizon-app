import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  SoapPreflightAlloggiatiWebTransport,
} from "./soap-preflight-transport";

const credentials = {
  username: "test-user",
  password: "test-password",
  wsKey: "test-wskey",
};

function response(
  xml: string,
  status = 200,
) {
  return new Response(xml, {
    status,
    headers: {
      "Content-Type": "text/xml",
    },
  });
}

describe(
  "SoapPreflightAlloggiatiWebTransport hardening",
  () => {
    it(
      "rifiuta un SOAP Fault",
      async () => {
        const fetchMock =
          vi.fn<typeof fetch>(
            async () =>
              response(`
                <soap:Envelope
                  xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
                >
                  <soap:Body>
                    <soap:Fault>
                      <faultcode>soap:Server</faultcode>
                      <faultstring>
                        Servizio temporaneamente non disponibile
                      </faultstring>
                    </soap:Fault>
                  </soap:Body>
                </soap:Envelope>
              `),
          );

        const transport =
          new SoapPreflightAlloggiatiWebTransport(
            fetchMock,
          );

        await expect(
          transport.authenticate(credentials),
        ).rejects.toThrow(
          "Alloggiati Web SOAP Fault: Servizio temporaneamente non disponibile",
        );
      },
    );

    it(
      "rifiuta una risposta HTTP non valida",
      async () => {
        const fetchMock =
          vi.fn<typeof fetch>(
            async () =>
              response(
                "<html>errore</html>",
                503,
              ),
          );

        const transport =
          new SoapPreflightAlloggiatiWebTransport(
            fetchMock,
          );

        await expect(
          transport.authenticate(credentials),
        ).rejects.toThrow(
          "Alloggiati Web HTTP 503.",
        );
      },
    );

    it(
      "interrompe la richiesta al timeout",
      async () => {
        const fetchMock =
          vi.fn<typeof fetch>(
            async (_input, init) =>
              new Promise<Response>(
                (_resolve, reject) => {
                  init?.signal?.addEventListener(
                    "abort",
                    () => {
                      reject(
                        new DOMException(
                          "Aborted",
                          "AbortError",
                        ),
                      );
                    },
                    {
                      once: true,
                    },
                  );
                },
              ),
          );

        const transport =
          new SoapPreflightAlloggiatiWebTransport(
            fetchMock,
            10,
          );

        await expect(
          transport.authenticate(credentials),
        ).rejects.toThrow(
          "Timeout Alloggiati Web dopo 10 ms.",
        );

        expect(fetchMock).toHaveBeenCalledTimes(1);

        const [, options] =
          fetchMock.mock.calls[0];

        expect(
          options?.signal,
        ).toBeInstanceOf(AbortSignal);

        expect(
          options?.signal?.aborted,
        ).toBe(true);
      },
    );

    it(
      "rifiuta un timeout non valido",
      () => {
        expect(
          () =>
            new SoapPreflightAlloggiatiWebTransport(
              fetch,
              0,
            ),
        ).toThrow(
          "Timeout Alloggiati Web non valido.",
        );
      },
    );
  },
);
