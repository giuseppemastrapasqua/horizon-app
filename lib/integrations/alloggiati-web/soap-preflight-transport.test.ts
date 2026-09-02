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
      "non abilita mai Send",
      async () => {
        const fetchMock = vi.fn<typeof fetch>();

        const transport =
          new SoapPreflightAlloggiatiWebTransport(
            fetchMock as typeof fetch,
          );

        await expect(
          transport.submit(
            {
              token: "token-123",
            },
            {
              records: ["record-1"],
            },
          ),
        ).rejects.toThrow(
          "Invio SOAP Alloggiati Web non ancora abilitato.",
        );

        expect(fetchMock).not.toHaveBeenCalled();
      },
    );
  },
);