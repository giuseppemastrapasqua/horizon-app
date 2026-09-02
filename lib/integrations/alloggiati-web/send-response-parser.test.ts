import {
  describe,
  expect,
  it,
} from "vitest";

import {
  parseAlloggiatiSendResponse,
} from "./send-response-parser";

describe(
  "parseAlloggiatiSendResponse",
  () => {
    it(
      "legge una risposta con tutte le schedine acquisite",
      () => {
        const xml = `
          <GestioneAppartamenti_SendResponse
            xmlns="AlloggiatiService"
          >
            <result>
              <SchedineValide>3</SchedineValide>
              <Dettaglio></Dettaglio>
            </result>
          </GestioneAppartamenti_SendResponse>
        `;

        expect(
          parseAlloggiatiSendResponse(xml),
        ).toEqual({
          acceptedRecords: 3,
          resultCode: undefined,
          message: undefined,
        });
      },
    );

    it(
      "legge una acquisizione parziale",
      () => {
        const xml = `
          <result>
            <SchedineValide>2</SchedineValide>
            <Dettaglio>
              <EsitoOperazioneServizio>
                <ErroreCod>123</ErroreCod>
                <ErroreDes>Scheda non valida</ErroreDes>
                <ErroreDettaglio>
                  Campo documento errato
                </ErroreDettaglio>
              </EsitoOperazioneServizio>
            </Dettaglio>
          </result>
        `;

        expect(
          parseAlloggiatiSendResponse(xml),
        ).toEqual({
          acceptedRecords: 2,
          resultCode: "123",
          message:
            "Scheda non valida | Campo documento errato",
        });
      },
    );

    it(
      "legge zero schedine acquisite con errore",
      () => {
        const xml = `
          <result>
            <SchedineValide>0</SchedineValide>
            <Dettaglio>
              <EsitoOperazioneServizio>
                <ErroreCod>E01</ErroreCod>
                <ErroreDes>Invio rifiutato</ErroreDes>
              </EsitoOperazioneServizio>
            </Dettaglio>
          </result>
        `;

        expect(
          parseAlloggiatiSendResponse(xml),
        ).toEqual({
          acceptedRecords: 0,
          resultCode: "E01",
          message: "Invio rifiutato",
        });
      },
    );

    it(
      "raccoglie piu errori senza duplicati",
      () => {
        const xml = `
          <result>
            <SchedineValide>1</SchedineValide>
            <Dettaglio>
              <EsitoOperazioneServizio>
                <ErroreCod>E01</ErroreCod>
                <ErroreDes>Errore uno</ErroreDes>
                <ErroreDettaglio>Dettaglio uno</ErroreDettaglio>
              </EsitoOperazioneServizio>
              <EsitoOperazioneServizio>
                <ErroreCod>E02</ErroreCod>
                <ErroreDes>Errore uno</ErroreDes>
                <ErroreDettaglio>Dettaglio due</ErroreDettaglio>
              </EsitoOperazioneServizio>
            </Dettaglio>
          </result>
        `;

        expect(
          parseAlloggiatiSendResponse(xml),
        ).toEqual({
          acceptedRecords: 1,
          resultCode: "E01 | E02",
          message:
            "Errore uno | Dettaglio uno | Dettaglio due",
        });
      },
    );

    it(
      "decodifica le entita XML",
      () => {
        const xml = `
          <result>
            <SchedineValide>0</SchedineValide>
            <ErroreDes>
              Documento &amp; dati non validi
            </ErroreDes>
          </result>
        `;

        expect(
          parseAlloggiatiSendResponse(xml),
        ).toEqual({
          acceptedRecords: 0,
          resultCode: undefined,
          message:
            "Documento & dati non validi",
        });
      },
    );

    it(
      "rifiuta una risposta senza SchedineValide",
      () => {
        expect(() =>
          parseAlloggiatiSendResponse(
            "<result></result>",
          ),
        ).toThrow(
          "Risposta Alloggiati Web senza SchedineValide.",
        );
      },
    );

    it(
      "rifiuta SchedineValide non numerico",
      () => {
        expect(() =>
          parseAlloggiatiSendResponse(`
            <result>
              <SchedineValide>abc</SchedineValide>
            </result>
          `),
        ).toThrow(
          "SchedineValide Alloggiati Web non valido.",
        );
      },
    );

    it(
      "rifiuta SchedineValide negativo",
      () => {
        expect(() =>
          parseAlloggiatiSendResponse(`
            <result>
              <SchedineValide>-1</SchedineValide>
            </result>
          `),
        ).toThrow(
          "SchedineValide Alloggiati Web non valido.",
        );
      },
    );

    it(
      "legge il wrapper ufficiale GestioneAppartamenti_SendResponse",
      () => {
        const xml = `
          <soap:Envelope
            xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
          >
            <soap:Body>
              <GestioneAppartamenti_SendResponse
                xmlns="AlloggiatiService"
              >
                <GestioneAppartamenti_SendResult>
                  <esito>true</esito>
                  <ErroreCod></ErroreCod>
                  <ErroreDes></ErroreDes>
                  <ErroreDettaglio></ErroreDettaglio>
                </GestioneAppartamenti_SendResult>
                <result>
                  <SchedineValide>2</SchedineValide>
                  <Dettaglio>
                    <EsitoOperazioneServizio>
                      <esito>true</esito>
                      <ErroreCod></ErroreCod>
                      <ErroreDes></ErroreDes>
                      <ErroreDettaglio></ErroreDettaglio>
                    </EsitoOperazioneServizio>
                    <EsitoOperazioneServizio>
                      <esito>true</esito>
                      <ErroreCod></ErroreCod>
                      <ErroreDes></ErroreDes>
                      <ErroreDettaglio></ErroreDettaglio>
                    </EsitoOperazioneServizio>
                  </Dettaglio>
                </result>
              </GestioneAppartamenti_SendResponse>
            </soap:Body>
          </soap:Envelope>
        `;

        expect(
          parseAlloggiatiSendResponse(xml),
        ).toEqual({
          acceptedRecords: 2,
          resultCode: undefined,
          message: undefined,
        });
      },
    );
    it(
      "supporta tag SOAP con namespace",
      () => {
        const xml = `
          <soap:Envelope>
            <soap:Body>
              <x:result>
                <x:SchedineValide>2</x:SchedineValide>
              </x:result>
            </soap:Body>
          </soap:Envelope>
        `;

        expect(
          parseAlloggiatiSendResponse(xml),
        ).toEqual({
          acceptedRecords: 2,
          resultCode: undefined,
          message: undefined,
        });
      },
    );
  },
);