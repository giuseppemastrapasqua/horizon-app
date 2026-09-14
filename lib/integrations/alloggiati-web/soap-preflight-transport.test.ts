import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  SoapPreflightAlloggiatiWebTransport,
} from "./soap-preflight-transport";

function response(xml: string) {
  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "text/xml",
    },
  });
}

describe(
  "SoapPreflightAlloggiatiWebTransport",
  () => {
    it(
      "autentica con GenerateToken",
      async () => {
        const fetchMock = vi.fn<typeof fetch>(
          async () =>
            response(`
              <GenerateTokenResponse>
                <GenerateTokenResult>
                  <ErroreDettaglio></ErroreDettaglio>
                  <token>token-123</token>
                </GenerateTokenResult>
              </GenerateTokenResponse>
            `),
        );

        const transport =
          new SoapPreflightAlloggiatiWebTransport(
            fetchMock as typeof fetch,
          );

        await expect(
          transport.authenticate({
            username: "user&amp;test",
            password: "password",
            wsKey: "wskey",
          }),
        ).resolves.toEqual({
          token: "token-123",
        });

        expect(fetchMock).toHaveBeenCalledTimes(1);

        const [, options] =
          fetchMock.mock.calls[0];

        expect(
          options?.headers,
        ).toMatchObject({
          SOAPAction:
            '"AlloggiatiService/GenerateToken"',
        });

        expect(
          String(options?.body),
        ).toContain(
          "<Utente>user&amp;amp;test</Utente>",
        );
      },
    );

    it(
      "usa Test senza apartmentId",
      async () => {
        const fetchMock = vi
          .fn<typeof fetch>()
          .mockResolvedValueOnce(
            response(`
              <GenerateTokenResponse>
                <token>token-123</token>
              </GenerateTokenResponse>
            `),
          )
          .mockResolvedValueOnce(
            response(`
              <TestResponse>
                <SchedineValide>1</SchedineValide>
              </TestResponse>
            `),
          );

        const transport =
          new SoapPreflightAlloggiatiWebTransport(
            fetchMock as typeof fetch,
          );

        const session =
          await transport.authenticate({
            username: "user",
            password: "password",
            wsKey: "wskey",
          });

        await expect(
          transport.validateSubmission(
            session,
            {
              records: ["record-1"],
            },
          ),
        ).resolves.toEqual({
          success: true,
          message: undefined,
        });

        const [, options] =
          fetchMock.mock.calls[1];

        expect(
          options?.headers,
        ).toMatchObject({
          SOAPAction:
            '"AlloggiatiService/Test"',
        });

        expect(
          String(options?.body),
        ).not.toContain(
          "<IdAppartamento>",
        );
      },
    );

    it(
      "formatta gli errori del Test con codice e dettaglio",
      async () => {
        const fetchMock = vi
          .fn<typeof fetch>()
          .mockResolvedValueOnce(
            response(`
              <GenerateTokenResponse>
                <token>token-123</token>
              </GenerateTokenResponse>
            `),
          )
          .mockResolvedValueOnce(
            response(`
              <TestResponse>
                <result>
                  <SchedineValide>0</SchedineValide>
                  <Dettaglio>
                    <EsitoOperazioneServizio>
                      <esito>false</esito>
                      <ErroreCod>12</ErroreCod>
                      <ErroreDes>SCHEDINA_CAMPO_NON_CORRETTO</ErroreDes>
                      <ErroreDettaglio>Data di Arrivo Errata</ErroreDettaglio>
                    </EsitoOperazioneServizio>
                  </Dettaglio>
                </result>
              </TestResponse>
            `),
          );

        const transport =
          new SoapPreflightAlloggiatiWebTransport(
            fetchMock as typeof fetch,
          );

        const session =
          await transport.authenticate({
            username: "user",
            password: "password",
            wsKey: "wskey",
          });

        await expect(
          transport.validateSubmission(
            session,
            { records: ["record-1"] },
          ),
        ).resolves.toEqual({
          success: false,
          message:
            "Verifica non superata: Data di Arrivo Errata (codice 12)",
        });
      },
    );

    it(
      "usa GestioneAppartamenti_Test con apartmentId",
      async () => {
        const fetchMock = vi
          .fn<typeof fetch>()
          .mockResolvedValueOnce(
            response(`
              <GenerateTokenResponse>
                <token>token-123</token>
              </GenerateTokenResponse>
            `),
          )
          .mockResolvedValueOnce(
            response(`
              <GestioneAppartamenti_TestResponse>
                <SchedineValide>1</SchedineValide>
              </GestioneAppartamenti_TestResponse>
            `),
          );

        const transport =
          new SoapPreflightAlloggiatiWebTransport(
            fetchMock as typeof fetch,
          );

        const session =
          await transport.authenticate({
            username: "user",
            password: "password",
            wsKey: "wskey",
          });

        await expect(
          transport.validateSubmission(
            session,
            {
              records: ["record-1"],
              apartmentId: "123",
            },
          ),
        ).resolves.toEqual({
          success: true,
          message: undefined,
        });

        const [, options] =
          fetchMock.mock.calls[1];

        expect(
          options?.headers,
        ).toMatchObject({
          SOAPAction:
            '"AlloggiatiService/GestioneAppartamenti_Test"',
        });

        expect(
          String(options?.body),
        ).toContain(
          "<IdAppartamento>123</IdAppartamento>",
        );
      },
    );

    it(
      "legge ListaAppartamenti con Tabella",
      async () => {
        const fetchMock = vi
          .fn<typeof fetch>()
          .mockResolvedValueOnce(
            response(`
              <GenerateTokenResponse>
                <token>token-123</token>
              </GenerateTokenResponse>
            `),
          )
          .mockResolvedValueOnce(
            response(`
              <TabellaResponse>
                <TabellaResult>
                  <ErroreDettaglio></ErroreDettaglio>
                  <CSV>IdAppartamento;Descrizione&amp;#13;&amp;#10;123;Casa Centro</CSV>
                </TabellaResult>
              </TabellaResponse>
            `),
          );

        const transport =
          new SoapPreflightAlloggiatiWebTransport(
            fetchMock as typeof fetch,
          );

        const session =
          await transport.authenticate({
            username: "user",
            password: "password",
            wsKey: "wskey",
          });

        await expect(
          transport.getTable(
            session,
            "ListaAppartamenti",
          ),
        ).resolves.toEqual({
          csv:
            "IdAppartamento;Descrizione&#13;&#10;123;Casa Centro",
        });

        const [, options] =
          fetchMock.mock.calls[1];

        expect(
          options?.headers,
        ).toMatchObject({
          SOAPAction:
            '"AlloggiatiService/Tabella"',
        });

        expect(
          String(options?.body),
        ).toContain(
          "<Utente>user</Utente>",
        );

        expect(
          String(options?.body),
        ).toContain(
          "<token>token-123</token>",
        );

        expect(
          String(options?.body),
        ).toContain(
          "<tipo>ListaAppartamenti</tipo>",
        );
      },
    );

    it(
      "propaga errore Tabella",
      async () => {
        const fetchMock = vi
          .fn<typeof fetch>()
          .mockResolvedValueOnce(
            response(`
              <GenerateTokenResponse>
                <token>token-123</token>
              </GenerateTokenResponse>
            `),
          )
          .mockResolvedValueOnce(
            response(`
              <TabellaResponse>
                <TabellaResult>
                  <ErroreDettaglio>Tabella non disponibile</ErroreDettaglio>
                </TabellaResult>
              </TabellaResponse>
            `),
          );

        const transport =
          new SoapPreflightAlloggiatiWebTransport(
            fetchMock as typeof fetch,
          );

        const session =
          await transport.authenticate({
            username: "user",
            password: "password",
            wsKey: "wskey",
          });

        await expect(
          transport.getTable(
            session,
            "ListaAppartamenti",
          ),
        ).rejects.toThrow(
          "Tabella Alloggiati Web fallita: Tabella non disponibile",
        );
      },
    );

    it(
      "rifiuta Tabella con sessione sconosciuta",
      async () => {
        const fetchMock = vi.fn<typeof fetch>();

        const transport =
          new SoapPreflightAlloggiatiWebTransport(
            fetchMock as typeof fetch,
          );

        await expect(
          transport.getTable(
            {
              token: "token-sconosciuto",
            },
            "ListaAppartamenti",
          ),
        ).rejects.toThrow(
          "Sessione Alloggiati Web non riconosciuta.",
        );

        expect(fetchMock).not.toHaveBeenCalled();
      },
    );

    it(
      "invia con GestioneAppartamenti_Send",
      async () => {
        const fetchMock = vi
          .fn<typeof fetch>()
          .mockResolvedValueOnce(
            response(`
              <GenerateTokenResponse>
                <token>token-123</token>
              </GenerateTokenResponse>
            `),
          )
          .mockResolvedValueOnce(
            response(`
              <GestioneAppartamenti_SendResponse>
                <result>
                  <SchedineValide>2</SchedineValide>
                  <Dettaglio></Dettaglio>
                </result>
              </GestioneAppartamenti_SendResponse>
            `),
          );

        const transport =
          new SoapPreflightAlloggiatiWebTransport(
            fetchMock as typeof fetch,
          );

        const session =
          await transport.authenticate({
            username: "user",
            password: "password",
            wsKey: "wskey",
          });

        await expect(
          transport.submit(
            session,
            {
              records: [
                "record<&1",
                "record-2",
              ],
              apartmentId: "123",
            },
          ),
        ).resolves.toEqual({
          acceptedRecords: 2,
          resultCode: undefined,
          message: undefined,
        });

        const [, options] =
          fetchMock.mock.calls[1];

        expect(
          options?.headers,
        ).toMatchObject({
          SOAPAction:
            '"AlloggiatiService/GestioneAppartamenti_Send"',
        });

        const body =
          String(options?.body);

        expect(body).toContain(
          "<Utente>user</Utente>",
        );

        expect(body).toContain(
          "<token>token-123</token>",
        );

        expect(body).toContain(
          "<IdAppartamento>123</IdAppartamento>",
        );

        expect(body).toContain(
          "<string>record&lt;&amp;1</string>",
        );

        expect(body).toContain(
          "<string>record-2</string>",
        );
      },
    );

    it(
      "propaga acquisizione parziale dal Send",
      async () => {
        const fetchMock = vi
          .fn<typeof fetch>()
          .mockResolvedValueOnce(
            response(`
              <GenerateTokenResponse>
                <token>token-123</token>
              </GenerateTokenResponse>
            `),
          )
          .mockResolvedValueOnce(
            response(`
              <GestioneAppartamenti_SendResponse>
                <result>
                  <SchedineValide>1</SchedineValide>
                  <ErroreCod>E01</ErroreCod>
                  <ErroreDes>Scheda non valida</ErroreDes>
                </result>
              </GestioneAppartamenti_SendResponse>
            `),
          );

        const transport =
          new SoapPreflightAlloggiatiWebTransport(
            fetchMock as typeof fetch,
          );

        const session =
          await transport.authenticate({
            username: "user",
            password: "password",
            wsKey: "wskey",
          });

        await expect(
          transport.submit(
            session,
            {
              records: [
                "record-1",
                "record-2",
              ],
              apartmentId: "123",
            },
          ),
        ).resolves.toEqual({
          acceptedRecords: 1,
          resultCode: "E01",
          message: "Scheda non valida",
        });
      },
    );

    it(
      "propaga zero schedine acquisite dal Send",
      async () => {
        const fetchMock = vi
          .fn<typeof fetch>()
          .mockResolvedValueOnce(
            response(`
              <GenerateTokenResponse>
                <token>token-123</token>
              </GenerateTokenResponse>
            `),
          )
          .mockResolvedValueOnce(
            response(`
              <GestioneAppartamenti_SendResponse>
                <result>
                  <SchedineValide>0</SchedineValide>
                  <ErroreCod>E02</ErroreCod>
                  <ErroreDes>Invio rifiutato</ErroreDes>
                </result>
              </GestioneAppartamenti_SendResponse>
            `),
          );

        const transport =
          new SoapPreflightAlloggiatiWebTransport(
            fetchMock as typeof fetch,
          );

        const session =
          await transport.authenticate({
            username: "user",
            password: "password",
            wsKey: "wskey",
          });

        await expect(
          transport.submit(
            session,
            {
              records: ["record-1"],
              apartmentId: "123",
            },
          ),
        ).resolves.toEqual({
          acceptedRecords: 0,
          resultCode: "E02",
          message: "Invio rifiutato",
        });
      },
    );

    it(
      "usa Send senza apartmentId",
      async () => {
        const fetchMock = vi
          .fn<typeof fetch>()
          .mockResolvedValueOnce(
            response(`
              <GenerateTokenResponse>
                <token>token-123</token>
              </GenerateTokenResponse>
            `),
          )
          .mockResolvedValueOnce(
            response(`
              <SendResponse>
                <result>
                  <SchedineValide>1</SchedineValide>
                  <Dettaglio></Dettaglio>
                </result>
              </SendResponse>
            `),
          );

        const transport =
          new SoapPreflightAlloggiatiWebTransport(
            fetchMock as typeof fetch,
          );

        const session =
          await transport.authenticate({
            username: "user",
            password: "password",
            wsKey: "wskey",
          });

        await expect(
          transport.submit(
            session,
            {
              records: ["record-1"],
            },
          ),
        ).resolves.toEqual({
          acceptedRecords: 1,
          resultCode: undefined,
          message: undefined,
        });

        expect(fetchMock).toHaveBeenCalledTimes(2);

        const [, options] =
          fetchMock.mock.calls[1];

        expect(
          options?.headers,
        ).toMatchObject({
          SOAPAction:
            '"AlloggiatiService/Send"',
        });

        const body =
          String(options?.body);

        expect(body).toContain(
          "<Utente>user</Utente>",
        );
        expect(body).toContain(
          "<token>token-123</token>",
        );
        expect(body).toContain(
          "<string>record-1</string>",
        );
        expect(body).not.toContain(
          "<IdAppartamento>",
        );
      },
    );

    it(
      "rifiuta Send con apartmentId non numerico",
      async () => {
        const fetchMock = vi
          .fn<typeof fetch>()
          .mockResolvedValueOnce(
            response(`
              <GenerateTokenResponse>
                <token>token-123</token>
              </GenerateTokenResponse>
            `),
          );

        const transport =
          new SoapPreflightAlloggiatiWebTransport(
            fetchMock as typeof fetch,
          );

        const session =
          await transport.authenticate({
            username: "user",
            password: "password",
            wsKey: "wskey",
          });

        await expect(
          transport.submit(
            session,
            {
              records: ["record-1"],
              apartmentId: "abc",
            },
          ),
        ).rejects.toThrow(
          "IdAppartamento Alloggiati Web non valido.",
        );

        expect(fetchMock).toHaveBeenCalledTimes(1);
      },
    );

    it(
      "rifiuta risposta Send non classificabile",
      async () => {
        const fetchMock = vi
          .fn<typeof fetch>()
          .mockResolvedValueOnce(
            response(`
              <GenerateTokenResponse>
                <token>token-123</token>
              </GenerateTokenResponse>
            `),
          )
          .mockResolvedValueOnce(
            response(`
              <GestioneAppartamenti_SendResponse>
                <result></result>
              </GestioneAppartamenti_SendResponse>
            `),
          );

        const transport =
          new SoapPreflightAlloggiatiWebTransport(
            fetchMock as typeof fetch,
          );

        const session =
          await transport.authenticate({
            username: "user",
            password: "password",
            wsKey: "wskey",
          });

        await expect(
          transport.submit(
            session,
            {
              records: ["record-1"],
              apartmentId: "123",
            },
          ),
        ).rejects.toThrow(
          "Risposta Alloggiati Web senza SchedineValide.",
        );
      },
    );
    it(
      "propaga SOAP Fault durante Send",
      async () => {
        const fetchMock = vi
          .fn<typeof fetch>()
          .mockResolvedValueOnce(
            response(`
              <GenerateTokenResponse>
                <token>token-123</token>
              </GenerateTokenResponse>
            `),
          )
          .mockResolvedValueOnce(
            response(`
              <soap:Envelope
                xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
              >
                <soap:Body>
                  <soap:Fault>
                    <faultcode>soap:Server</faultcode>
                    <faultstring>Errore remoto Send</faultstring>
                  </soap:Fault>
                </soap:Body>
              </soap:Envelope>
            `),
          );

        const transport =
          new SoapPreflightAlloggiatiWebTransport(
            fetchMock as typeof fetch,
          );

        const session =
          await transport.authenticate({
            username: "user",
            password: "password",
            wsKey: "wskey",
          });

        await expect(
          transport.submit(
            session,
            {
              records: ["record-1"],
              apartmentId: "123",
            },
          ),
        ).rejects.toThrow(
          "Alloggiati Web SOAP Fault: Errore remoto Send",
        );
      },
    );

    it(
      "propaga errore HTTP durante Send",
      async () => {
        const fetchMock = vi
          .fn<typeof fetch>()
          .mockResolvedValueOnce(
            response(`
              <GenerateTokenResponse>
                <token>token-123</token>
              </GenerateTokenResponse>
            `),
          )
          .mockResolvedValueOnce(
            new Response(
              "<html>Service unavailable</html>",
              {
                status: 503,
              },
            ),
          );

        const transport =
          new SoapPreflightAlloggiatiWebTransport(
            fetchMock as typeof fetch,
          );

        const session =
          await transport.authenticate({
            username: "user",
            password: "password",
            wsKey: "wskey",
          });

        await expect(
          transport.submit(
            session,
            {
              records: ["record-1"],
              apartmentId: "123",
            },
          ),
        ).rejects.toThrow(
          "Alloggiati Web HTTP 503.",
        );
      },
    );

    it(
      "propaga errore di rete durante Send",
      async () => {
        const fetchMock = vi
          .fn<typeof fetch>()
          .mockResolvedValueOnce(
            response(`
              <GenerateTokenResponse>
                <token>token-123</token>
              </GenerateTokenResponse>
            `),
          )
          .mockRejectedValueOnce(
            new Error(
              "Connessione interrotta.",
            ),
          );

        const transport =
          new SoapPreflightAlloggiatiWebTransport(
            fetchMock as typeof fetch,
          );

        const session =
          await transport.authenticate({
            username: "user",
            password: "password",
            wsKey: "wskey",
          });

        await expect(
          transport.submit(
            session,
            {
              records: ["record-1"],
              apartmentId: "123",
            },
          ),
        ).rejects.toThrow(
          "Connessione interrotta.",
        );
      },
    );

    it(
      "normalizza timeout durante Send",
      async () => {
        const fetchMock = vi
          .fn<typeof fetch>()
          .mockResolvedValueOnce(
            response(`
              <GenerateTokenResponse>
                <token>token-123</token>
              </GenerateTokenResponse>
            `),
          )
          .mockImplementationOnce(
            async (_input, init) =>
              new Promise<Response>(
                (_resolve, reject) => {
                  const signal =
                    init?.signal;

                  if (!signal) {
                    reject(
                      new Error(
                        "AbortSignal mancante.",
                      ),
                    );
                    return;
                  }

                  signal.addEventListener(
                    "abort",
                    () => {
                      reject(
                        new DOMException(
                          "Aborted",
                          "AbortError",
                        ),
                      );
                    },
                    { once: true },
                  );
                },
              ),
          );

        const transport =
          new SoapPreflightAlloggiatiWebTransport(
            fetchMock as typeof fetch,
            10,
          );

        const session =
          await transport.authenticate({
            username: "user",
            password: "password",
            wsKey: "wskey",
          });

        await expect(
          transport.submit(
            session,
            {
              records: ["record-1"],
              apartmentId: "123",
            },
          ),
        ).rejects.toThrow(
          "Timeout Alloggiati Web dopo 10 ms.",
        );
      },
    );
    it(
      "scarica Ricevuta PDF",
      async () => {
        const fetchMock = vi
          .fn<typeof fetch>()
          .mockResolvedValueOnce(
            response(`
              <GenerateTokenResponse>
                <token>token-123</token>
              </GenerateTokenResponse>
            `),
          )
          .mockResolvedValueOnce(
            response(`
              <RicevutaResponse>
                <RicevutaResult>
                  <ErroreDettaglio></ErroreDettaglio>
                </RicevutaResult>
                <PDF>JVBERi0xLjQ=</PDF>
              </RicevutaResponse>
            `),
          );

        const transport =
          new SoapPreflightAlloggiatiWebTransport(
            fetchMock as typeof fetch,
          );

        const session =
          await transport.authenticate({
            username: "user",
            password: "password",
            wsKey: "wskey",
          });

        await expect(
          transport.getReceipt(
            session,
            "2026-09-02",
          ),
        ).resolves.toEqual({
          date: "2026-09-02",
          pdfBase64: "JVBERi0xLjQ=",
        });
      },
    );

    it(
      "invia i parametri SOAP Ricevuta corretti",
      async () => {
        const fetchMock = vi
          .fn<typeof fetch>()
          .mockResolvedValueOnce(
            response(`
              <GenerateTokenResponse>
                <token>token-123</token>
              </GenerateTokenResponse>
            `),
          )
          .mockResolvedValueOnce(
            response(`
              <RicevutaResponse>
                <RicevutaResult>
                  <ErroreDettaglio></ErroreDettaglio>
                </RicevutaResult>
                <PDF>JVBERi0xLjQ=</PDF>
              </RicevutaResponse>
            `),
          );

        const transport =
          new SoapPreflightAlloggiatiWebTransport(
            fetchMock as typeof fetch,
          );

        const session =
          await transport.authenticate({
            username: "user",
            password: "password",
            wsKey: "wskey",
          });

        await transport.getReceipt(
          session,
          "2026-09-02",
        );

        const request =
          fetchMock.mock.calls[1]?.[1];

        expect(
          request?.headers,
        ).toMatchObject({
          SOAPAction:
            '"AlloggiatiService/Ricevuta"',
        });

        expect(request?.body).toContain(
          "<Utente>user</Utente>",
        );

        expect(request?.body).toContain(
          "<token>token-123</token>",
        );

        expect(request?.body).toContain(
          "<Data>2026-09-02T00:00:00</Data>",
        );

        expect(request?.body).toContain(
          "<PDF></PDF>",
        );
      },
    );

    it(
      "propaga errore Ricevuta",
      async () => {
        const fetchMock = vi
          .fn<typeof fetch>()
          .mockResolvedValueOnce(
            response(`
              <GenerateTokenResponse>
                <token>token-123</token>
              </GenerateTokenResponse>
            `),
          )
          .mockResolvedValueOnce(
            response(`
              <RicevutaResponse>
                <RicevutaResult>
                  <ErroreDettaglio>
                    Ricevuta non disponibile
                  </ErroreDettaglio>
                </RicevutaResult>
                <PDF></PDF>
              </RicevutaResponse>
            `),
          );

        const transport =
          new SoapPreflightAlloggiatiWebTransport(
            fetchMock as typeof fetch,
          );

        const session =
          await transport.authenticate({
            username: "user",
            password: "password",
            wsKey: "wskey",
          });

        await expect(
          transport.getReceipt(
            session,
            "2026-09-02",
          ),
        ).rejects.toThrow(
          "Ricevuta Alloggiati Web fallita: Ricevuta non disponibile",
        );
      },
    );

    it(
      "rifiuta Ricevuta senza PDF",
      async () => {
        const fetchMock = vi
          .fn<typeof fetch>()
          .mockResolvedValueOnce(
            response(`
              <GenerateTokenResponse>
                <token>token-123</token>
              </GenerateTokenResponse>
            `),
          )
          .mockResolvedValueOnce(
            response(`
              <RicevutaResponse>
                <RicevutaResult>
                  <ErroreDettaglio></ErroreDettaglio>
                </RicevutaResult>
                <PDF></PDF>
              </RicevutaResponse>
            `),
          );

        const transport =
          new SoapPreflightAlloggiatiWebTransport(
            fetchMock as typeof fetch,
          );

        const session =
          await transport.authenticate({
            username: "user",
            password: "password",
            wsKey: "wskey",
          });

        await expect(
          transport.getReceipt(
            session,
            "2026-09-02",
          ),
        ).rejects.toThrow(
          "Alloggiati Web non ha restituito la ricevuta PDF.",
        );
      },
    );

    it(
      "rifiuta data Ricevuta non valida prima del SOAP",
      async () => {
        const fetchMock = vi
          .fn<typeof fetch>()
          .mockResolvedValueOnce(
            response(`
              <GenerateTokenResponse>
                <token>token-123</token>
              </GenerateTokenResponse>
            `),
          );

        const transport =
          new SoapPreflightAlloggiatiWebTransport(
            fetchMock as typeof fetch,
          );

        const session =
          await transport.authenticate({
            username: "user",
            password: "password",
            wsKey: "wskey",
          });

        await expect(
          transport.getReceipt(
            session,
            "02/09/2026",
          ),
        ).rejects.toThrow(
          "Data Ricevuta Alloggiati Web non valida.",
        );

        expect(fetchMock).toHaveBeenCalledTimes(1);
      },
    );
  },
);