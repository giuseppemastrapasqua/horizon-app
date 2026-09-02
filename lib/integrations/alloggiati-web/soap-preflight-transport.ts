import type {
  AlloggiatiWebCredentials,
  AlloggiatiWebReceipt,
  AlloggiatiWebSession,
  AlloggiatiWebSubmission,
  AlloggiatiWebSubmissionResult,
  AlloggiatiWebTableResult,
  AlloggiatiWebTableType,
  AlloggiatiWebValidationResult,
} from "./types";
import type {
  AlloggiatiWebTransport,
} from "./transport";

const SERVICE_URL =
  "https://alloggiatiweb.poliziadistato.it/service/Service.asmx";

const DEFAULT_TIMEOUT_MS = 10_000;

type FetchLike = typeof fetch;

export class SoapPreflightAlloggiatiWebTransport
  implements AlloggiatiWebTransport
{
  private readonly usernamesByToken =
    new Map<string, string>();

  constructor(
    private readonly fetchImpl: FetchLike = fetch,
    private readonly timeoutMs =
      DEFAULT_TIMEOUT_MS,
  ) {
    if (
      !Number.isFinite(timeoutMs) ||
      timeoutMs <= 0
    ) {
      throw new Error(
        "Timeout Alloggiati Web non valido.",
      );
    }
  }

  async authenticate(
    credentials: AlloggiatiWebCredentials,
  ): Promise<AlloggiatiWebSession> {
    const xml = await this.postSoap(
      "GenerateToken",
      `
        <GenerateToken xmlns="AlloggiatiService">
          <Utente>${escapeXml(credentials.username)}</Utente>
          <Password>${escapeXml(credentials.password)}</Password>
          <WsKey>${escapeXml(credentials.wsKey)}</WsKey>
          <result>
            <ErroreDettaglio></ErroreDettaglio>
          </result>
        </GenerateToken>
      `,
    );

    const error =
      readTag(xml, "ErroreDettaglio");

    const token = readTag(xml, "token");

    if (error && !token) {
      throw new Error(
        `Autenticazione Alloggiati Web fallita: ${error}`,
      );
    }

    if (!token) {
      throw new Error(
        "Alloggiati Web non ha restituito un token.",
      );
    }

    this.usernamesByToken.set(
      token,
      credentials.username,
    );

    return { token };
  }

  async validateSubmission(
    session: AlloggiatiWebSession,
    submission: AlloggiatiWebSubmission,
  ): Promise<AlloggiatiWebValidationResult> {
    const username =
      this.getUsername(session);

    const records = submission.records
      .map(
        (record) =>
          `<string>${escapeXml(record)}</string>`,
      )
      .join("");

    const apartmentId =
      submission.apartmentId?.trim();

    const operation = apartmentId
      ? "GestioneAppartamenti_Test"
      : "Test";

    let apartmentXml = "";

    if (apartmentId) {
      if (!/^\d+$/.test(apartmentId)) {
        throw new Error(
          "IdAppartamento Alloggiati Web non valido.",
        );
      }

      apartmentXml =
        `<IdAppartamento>${apartmentId}</IdAppartamento>`;
    }

    const xml = await this.postSoap(
      operation,
      `
        <${operation} xmlns="AlloggiatiService">
          <Utente>${escapeXml(username)}</Utente>
          <token>${escapeXml(session.token)}</token>
          <ElencoSchedine>${records}</ElencoSchedine>
          ${apartmentXml}
          <result>
            <SchedineValide>0</SchedineValide>
            <Dettaglio></Dettaglio>
          </result>
        </${operation}>
      `,
    );

    const validRecordsText =
      readTag(xml, "SchedineValide");

    const validRecords =
      Number.parseInt(
        validRecordsText ?? "",
        10,
      );

    const errors =
      readTags(xml, "ErroreDettaglio")
        .map((value) => value.trim())
        .filter(Boolean);

    const success =
      Number.isInteger(validRecords) &&
      validRecords ===
        submission.records.length &&
      errors.length === 0;

    return {
      success,
      message:
        errors.length > 0
          ? errors.join(" | ")
          : success
            ? undefined
            : "Preflight Alloggiati Web non superato.",
    };
  }

  async submit(
    _session: AlloggiatiWebSession,
    _submission: AlloggiatiWebSubmission,
  ): Promise<AlloggiatiWebSubmissionResult> {
    throw new Error(
      "Invio SOAP Alloggiati Web non ancora abilitato.",
    );
  }

  async getReceipt(
    _session: AlloggiatiWebSession,
    _date: string,
  ): Promise<AlloggiatiWebReceipt> {
    throw new Error(
      "Ricevuta SOAP Alloggiati Web non ancora abilitata.",
    );
  }

  async getTable(
    session: AlloggiatiWebSession,
    table: AlloggiatiWebTableType,
  ): Promise<AlloggiatiWebTableResult> {
    const username =
      this.getUsername(session);

    const xml = await this.postSoap(
      "Tabella",
      `
        <Tabella xmlns="AlloggiatiService">
          <Utente>${escapeXml(username)}</Utente>
          <token>${escapeXml(session.token)}</token>
          <tipo>${escapeXml(table)}</tipo>
          <result>
            <ErroreDettaglio></ErroreDettaglio>
          </result>
        </Tabella>
      `,
    );

    const error =
      readTag(xml, "ErroreDettaglio");

    if (error?.trim()) {
      throw new Error(
        `Tabella Alloggiati Web fallita: ${error.trim()}`,
      );
    }

    const csv =
      readTag(xml, "CSV") ??
      readTag(xml, "Csv") ??
      readTag(xml, "csv");

    if (csv === undefined) {
      throw new Error(
        "Alloggiati Web non ha restituito la tabella richiesta.",
      );
    }

    return { csv };
  }

  private getUsername(
    session: AlloggiatiWebSession,
  ): string {
    const username =
      this.usernamesByToken.get(session.token);

    if (!username) {
      throw new Error(
        "Sessione Alloggiati Web non riconosciuta.",
      );
    }

    return username;
  }

  private async postSoap(
    operation: string,
    body: string,
  ): Promise<string> {
    const envelope =
      `<?xml version="1.0" encoding="utf-8"?>` +
      `<soap:Envelope ` +
      `xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ` +
      `xmlns:xsd="http://www.w3.org/2001/XMLSchema" ` +
      `xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">` +
      `<soap:Body>${body}</soap:Body>` +
      `</soap:Envelope>`;

    const controller =
      new AbortController();

    const timeout = setTimeout(
      () => controller.abort(),
      this.timeoutMs,
    );

    try {
      const response =
        await this.fetchImpl(
          SERVICE_URL,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "text/xml; charset=utf-8",
              SOAPAction:
                `"AlloggiatiService/${operation}"`,
            },
            body: envelope,
            signal: controller.signal,
          },
        );

      const xml = await response.text();

      const soapFault =
        readSoapFault(xml);

      if (soapFault) {
        throw new Error(
          `Alloggiati Web SOAP Fault: ${soapFault}`,
        );
      }

      if (!response.ok) {
        throw new Error(
          `Alloggiati Web HTTP ${response.status}.`,
        );
      }

      return xml;
    } catch (error) {
      if (
        controller.signal.aborted &&
        isAbortError(error)
      ) {
        throw new Error(
          `Timeout Alloggiati Web dopo ${this.timeoutMs} ms.`,
        );
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function readSoapFault(
  xml: string,
): string | undefined {
  if (!/<(?:\w+:)?Fault(?:\s|>)/i.test(xml)) {
    return undefined;
  }

  return (
    readTag(xml, "faultstring") ??
    readTag(xml, "Text") ??
    "Errore SOAP non specificato."
  );
}

function readTag(
  xml: string,
  tag: string,
): string | undefined {
  return readTags(xml, tag)[0];
}

function readTags(
  xml: string,
  tag: string,
): string[] {
  const escapedTag =
    tag.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&",
    );

  const regex = new RegExp(
    `<(?:\\w+:)?${escapedTag}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:\\w+:)?${escapedTag}>`,
    "gi",
  );

  return Array.from(
    xml.matchAll(regex),
    (match) =>
      decodeXml(match[1].trim()),
  );
}

function decodeXml(value: string): string {
  return value
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&");
}

function isAbortError(
  error: unknown,
): boolean {
  return (
    error instanceof DOMException &&
    error.name === "AbortError"
  );
}