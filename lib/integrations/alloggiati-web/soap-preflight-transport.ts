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

type FetchLike = typeof fetch;

export class SoapPreflightAlloggiatiWebTransport
  implements AlloggiatiWebTransport
{
  private readonly usernamesByToken =
    new Map<string, string>();

  constructor(
    private readonly fetchImpl: FetchLike = fetch,
  ) {}

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
      this.usernamesByToken.get(session.token);

    if (!username) {
      throw new Error(
        "Sessione Alloggiati Web non riconosciuta.",
      );
    }

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
      validRecords === submission.records.length &&
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
    _session: AlloggiatiWebSession,
    _table: AlloggiatiWebTableType,
  ): Promise<AlloggiatiWebTableResult> {
    throw new Error(
      "Tabella SOAP Alloggiati Web non ancora abilitata.",
    );
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

    const response = await this.fetchImpl(
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
      },
    );

    const xml = await response.text();

    if (!response.ok) {
      throw new Error(
        `Alloggiati Web HTTP ${response.status}.`,
      );
    }

    return xml;
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
    tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const regex = new RegExp(
    `<(?:\\w+:)?${escapedTag}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:\\w+:)?${escapedTag}>`,
    "gi",
  );

  return Array.from(
    xml.matchAll(regex),
    (match) => decodeXml(match[1].trim()),
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
