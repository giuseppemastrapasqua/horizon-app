import type {
  Ross1000Credentials,
} from "./types";

const LOMBARDIA_SERVICE_URL =
  "https://www.flussituristici.servizirl.it/Turismo5/app/ws/checkinV2";

const DEFAULT_TIMEOUT_MS = 10_000;

type FetchLike = typeof fetch;

export type Ross1000SoapResponse = {
  httpStatus: number;
  xml: string;
};

export class Ross1000SoapTransport {
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
        "Timeout ROSS1000 non valido.",
      );
    }
  }

  async sendMovements(
    credentials: Ross1000Credentials,
    payloadXml: string,
  ): Promise<Ross1000SoapResponse> {
    if (!credentials.username.trim()) {
      throw new Error(
        "ROSS1000: username mancante.",
      );
    }

    if (!credentials.password) {
      throw new Error(
        "ROSS1000: password mancante.",
      );
    }

    if (!payloadXml.trim()) {
      throw new Error(
        "ROSS1000: payload XML vuoto.",
      );
    }

    const envelope =
      buildSoapEnvelope(payloadXml);

    const basicToken =
      Buffer.from(
        `${credentials.username}:${credentials.password}`,
        "utf8",
      ).toString("base64");

    const controller =
      new AbortController();

    const timeout = setTimeout(
      () => controller.abort(),
      this.timeoutMs,
    );

    try {
      const response =
        await this.fetchImpl(
          LOMBARDIA_SERVICE_URL,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "text/xml; charset=utf-8",
              SOAPAction: '""',
              Authorization:
                `Basic ${basicToken}`,
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
          `ROSS1000 SOAP Fault: ${soapFault}`,
        );
      }

      if (!response.ok) {
        throw new Error(
          `ROSS1000 HTTP ${response.status}.`,
        );
      }

      return {
        httpStatus: response.status,
        xml,
      };
    } catch (error) {
      if (
        controller.signal.aborted &&
        isAbortError(error)
      ) {
        throw new Error(
          `Timeout ROSS1000 dopo ${this.timeoutMs} ms.`,
        );
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}

function buildSoapEnvelope(
  payloadXml: string,
): string {
  const declarationStripped =
    payloadXml
      .replace(
        /^\s*<\?xml[^?]*\?>\s*/i,
        "",
      )
      .trim();

  const rootMatch =
    declarationStripped.match(
      /^<movimenti(?:\s[^>]*)?>([\s\S]*)<\/movimenti>\s*$/i,
    );

  if (!rootMatch) {
    throw new Error(
      "ROSS1000: payload XML privo della radice movimenti.",
    );
  }

  return (
    `<?xml version="1.0" encoding="utf-8"?>` +
    `<soap:Envelope ` +
    `xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">` +
    `<soap:Body>` +
    `<ns2:inviaMovimentazione ` +
    `xmlns:ns2="http://checkin.ws.service.turismo5.gies.it/">` +
    `<movimentazione>` +
    rootMatch[1] +
    `</movimentazione>` +
    `</ns2:inviaMovimentazione>` +
    `</soap:Body>` +
    `</soap:Envelope>`
  );
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
  const escapedTag =
    tag.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&",
    );

  const regex = new RegExp(
    `<(?:\\w+:)?${escapedTag}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:\\w+:)?${escapedTag}>`,
    "i",
  );

  const match = xml.match(regex);

  return match
    ? decodeXml(match[1].trim())
    : undefined;
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
