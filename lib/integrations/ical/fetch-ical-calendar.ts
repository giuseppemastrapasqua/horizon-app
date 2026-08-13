import dns from "node:dns/promises";
import http from "node:http";
import https from "node:https";
import net from "node:net";

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_BYTES =
  5 * 1024 * 1024;
const DEFAULT_MAX_REDIRECTS = 5;

export type FetchIcalCalendarOptions = {
  timeoutMs?: number;
  maxBytes?: number;
  maxRedirects?: number;
};

type ResolvedAddress = {
  address: string;
  family: 4 | 6;
};

type RequestResult = {
  statusCode: number;
  location?: string;
  body: string;
};

export async function fetchIcalCalendar(
  feedUrl: string,
  options: FetchIcalCalendarOptions = {},
): Promise<string> {
  const timeoutMs =
    options.timeoutMs ??
    DEFAULT_TIMEOUT_MS;

  const maxBytes =
    options.maxBytes ??
    DEFAULT_MAX_BYTES;

  const maxRedirects =
    options.maxRedirects ??
    DEFAULT_MAX_REDIRECTS;

  validatePositiveInteger(
    timeoutMs,
    "timeoutMs",
  );

  validatePositiveInteger(
    maxBytes,
    "maxBytes",
  );

  validateNonNegativeInteger(
    maxRedirects,
    "maxRedirects",
  );

  let currentUrl: URL;

  try {
    currentUrl =
      new URL(feedUrl);
  } catch {
    throw new Error(
      "L'URL del feed iCal non è valido.",
    );
  }

  for (
    let redirectCount = 0;
    ;
    redirectCount += 1
  ) {
    validateUrl(
      currentUrl,
    );

    const resolvedAddress =
      await resolvePublicAddress(
        currentUrl.hostname,
      );

    const response =
      await makeRequest(
        currentUrl,
        resolvedAddress,
        timeoutMs,
        maxBytes,
      );

    if (
      isRedirectStatus(
        response.statusCode,
      )
    ) {
      if (
        !response.location
      ) {
        throw new Error(
          `Il feed iCal ha restituito HTTP ${response.statusCode} senza un header Location valido.`,
        );
      }

      if (
        redirectCount >=
        maxRedirects
      ) {
        throw new Error(
          "Il feed iCal ha superato il numero massimo di redirect consentiti.",
        );
      }

      try {
        currentUrl =
          new URL(
            response.location,
            currentUrl,
          );
      } catch {
        throw new Error(
          "Il feed iCal ha restituito un redirect non valido.",
        );
      }

      continue;
    }

    if (
      response.statusCode < 200 ||
      response.statusCode >= 300
    ) {
      throw new Error(
        `Download del feed iCal fallito con HTTP ${response.statusCode}.`,
      );
    }

    if (
      !response.body.trim()
    ) {
      throw new Error(
        "Il feed iCal restituito è vuoto.",
      );
    }

    return response.body;
  }
}

function validateUrl(
  url: URL,
): void {
  if (
    url.protocol !== "http:" &&
    url.protocol !== "https:"
  ) {
    throw new Error(
      "Il feed iCal deve utilizzare HTTP o HTTPS.",
    );
  }

  if (
    url.username ||
    url.password
  ) {
    throw new Error(
      "L'URL del feed iCal non può contenere credenziali HTTP incorporate.",
    );
  }

  const hostname =
    normalizeHostname(
      url.hostname,
    );

  if (
    hostname ===
      "localhost" ||
    hostname.endsWith(
      ".localhost",
    )
  ) {
    throw new Error(
      "L'URL del feed iCal non può puntare a localhost.",
    );
  }
}

function isRedirectStatus(
  statusCode: number,
): boolean {
  return (
    statusCode === 301 ||
    statusCode === 302 ||
    statusCode === 303 ||
    statusCode === 307 ||
    statusCode === 308
  );
}

function normalizeHostname(
  hostname: string,
): string {
  const normalized =
    hostname
      .trim()
      .toLowerCase();

  if (
    normalized.startsWith(
      "[",
    ) &&
    normalized.endsWith(
      "]",
    )
  ) {
    return normalized.slice(
      1,
      -1,
    );
  }

  return normalized;
}

async function resolvePublicAddress(
  hostname: string,
): Promise<ResolvedAddress> {
  const normalizedHostname =
    normalizeHostname(
      hostname,
    );

  const literalFamily =
    net.isIP(
      normalizedHostname,
    );

  /*
   * Se l'hostname è già un
   * indirizzo IP esplicito,
   * non effettuiamo DNS.
   */
  if (
    literalFamily !== 0
  ) {
    assertPublicIp(
      normalizedHostname,
    );

    return {
      address:
        normalizedHostname,

      family:
        literalFamily === 6
          ? 6
          : 4,
    };
  }

  /*
   * Con all:true recuperiamo
   * tutti gli indirizzi associati
   * all'hostname.
   *
   * Questo permette di verificare
   * che nessuno di essi appartenga
   * a una rete privata o riservata.
   */
  let addresses: Array<{
    address: string;
    family: number;
  }>;

  try {
    addresses =
      await dns.lookup(
        normalizedHostname,
        {
          all: true,
          verbatim: true,
        },
      );
  } catch {
    throw new Error(
      "Impossibile risolvere l'hostname del feed iCal.",
    );
  }

  if (
    addresses.length === 0
  ) {
    throw new Error(
      "L'hostname del feed iCal non ha indirizzi IP disponibili.",
    );
  }

  /*
   * SSRF protection:
   *
   * se anche uno solo degli
   * indirizzi restituiti dal DNS
   * non è pubblico, rifiutiamo
   * completamente l'hostname.
   */
  for (
    const address
    of addresses
  ) {
    assertPublicIp(
      address.address,
    );
  }

  const selectedAddress =
    addresses[0];

  if (
    !selectedAddress
  ) {
    throw new Error(
      "Impossibile selezionare un indirizzo IP per il feed iCal.",
    );
  }

  return {
    address:
      selectedAddress.address,

    family:
      selectedAddress.family ===
      6
        ? 6
        : 4,
  };
}

function makeRequest(
  url: URL,
  resolvedAddress:
    ResolvedAddress,
  timeoutMs: number,
  maxBytes: number,
): Promise<RequestResult> {
  return new Promise(
    (
      resolve,
      reject,
    ) => {
      const requestModule =
        url.protocol ===
        "https:"
          ? https
          : http;

      const request =
        requestModule.request(
          url,
          {
            method:
              "GET",

            headers: {
              Accept:
                "text/calendar,text/plain;q=0.9,*/*;q=0.1",

              /*
               * Evitiamo la
               * compressione per
               * poter applicare
               * maxBytes ai byte
               * effettivamente
               * ricevuti.
               */
              "Accept-Encoding":
                "identity",

              "User-Agent":
                "Horizon-iCal/1.0",
            },

            /*
             * Abbiamo già risolto
             * e validato l'indirizzo.
             *
             * Impostando anche la
             * family impediamo a Node
             * di avviare una nuova
             * auto-selezione IPv4/IPv6.
             *
             * Questo evita il caso in
             * cui il runtime invochi
             * lookup con all:true.
             */
            family:
              resolvedAddress.family,

            /*
             * La connessione deve
             * utilizzare esattamente
             * l'IP già risolto e
             * validato.
             *
             * Evitiamo quindi una
             * seconda risoluzione DNS,
             * proteggendoci anche da
             * DNS rebinding.
             */
            lookup: (
              _hostname,
              _options,
              callback,
            ) => {
              callback(
                null,
                resolvedAddress.address,
                resolvedAddress.family,
              );
            },
          },
          (
            response,
          ) => {
            const statusCode =
              response.statusCode ??
              0;

            const location =
              Array.isArray(
                response.headers
                  .location,
              )
                ? response
                    .headers
                    .location[0]
                : response
                    .headers
                    .location;

            const chunks:
              Buffer[] = [];

            let receivedBytes =
              0;

            response.on(
              "data",
              (
                chunk:
                  | Buffer
                  | string,
              ) => {
                const buffer =
                  Buffer.isBuffer(
                    chunk,
                  )
                    ? chunk
                    : Buffer.from(
                        chunk,
                      );

                receivedBytes +=
                  buffer.byteLength;

                if (
                  receivedBytes >
                  maxBytes
                ) {
                  response.destroy(
                    new Error(
                      `Il feed iCal supera la dimensione massima consentita di ${maxBytes} byte.`,
                    ),
                  );

                  return;
                }

                chunks.push(
                  buffer,
                );
              },
            );

            response.on(
              "end",
              () => {
                resolve({
                  statusCode,

                  ...(location
                    ? {
                        location,
                      }
                    : {}),

                  body:
                    Buffer.concat(
                      chunks,
                    ).toString(
                      "utf8",
                    ),
                });
              },
            );

            response.on(
              "error",
              reject,
            );
          },
        );

      request.setTimeout(
        timeoutMs,
        () => {
          request.destroy(
            new Error(
              `Timeout durante il download del feed iCal dopo ${timeoutMs} ms.`,
            ),
          );
        },
      );

      request.on(
        "error",
        reject,
      );

      request.end();
    },
  );
}

function assertPublicIp(
  ip: string,
): void {
  const family =
    net.isIP(ip);

  if (
    family === 4
  ) {
    if (
      isBlockedIpv4(
        ip,
      )
    ) {
      throw new Error(
        "L'URL del feed iCal risolve verso un indirizzo IP non pubblico.",
      );
    }

    return;
  }

  if (
    family === 6
  ) {
    if (
      isBlockedIpv6(
        ip,
      )
    ) {
      throw new Error(
        "L'URL del feed iCal risolve verso un indirizzo IP non pubblico.",
      );
    }

    return;
  }

  throw new Error(
    "Il feed iCal ha restituito un indirizzo IP non valido.",
  );
}

function isBlockedIpv4(
  ip: string,
): boolean {
  const parts =
    ip
      .split(".")
      .map(Number);

  if (
    parts.length !== 4
  ) {
    return true;
  }

  const [
    first = 0,
    second = 0,
  ] = parts;

  /*
   * 0.0.0.0/8
   * e loopback.
   */
  if (
    first === 0 ||
    first === 127
  ) {
    return true;
  }

  /*
   * RFC1918:
   * 10.0.0.0/8
   */
  if (
    first === 10
  ) {
    return true;
  }

  /*
   * RFC1918:
   * 172.16.0.0/12
   */
  if (
    first === 172 &&
    second >= 16 &&
    second <= 31
  ) {
    return true;
  }

  /*
   * RFC1918:
   * 192.168.0.0/16
   */
  if (
    first === 192 &&
    second === 168
  ) {
    return true;
  }

  /*
   * Link-local:
   * 169.254.0.0/16
   */
  if (
    first === 169 &&
    second === 254
  ) {
    return true;
  }

  /*
   * Carrier-grade NAT:
   * 100.64.0.0/10
   */
  if (
    first === 100 &&
    second >= 64 &&
    second <= 127
  ) {
    return true;
  }

  /*
   * Benchmarking:
   * 198.18.0.0/15
   */
  if (
    first === 198 &&
    (
      second === 18 ||
      second === 19
    )
  ) {
    return true;
  }

  /*
   * Multicast e reti
   * riservate.
   */
  if (
    first >= 224
  ) {
    return true;
  }

  return false;
}

function isBlockedIpv6(
  ip: string,
): boolean {
  const normalized =
    ip.toLowerCase();

  /*
   * Unspecified
   * e loopback.
   */
  if (
    normalized === "::" ||
    normalized === "::1"
  ) {
    return true;
  }

  /*
   * IPv4 mapped IPv6.
   */
  if (
    normalized.startsWith(
      "::ffff:",
    )
  ) {
    const mappedIpv4 =
      normalized.slice(
        "::ffff:".length,
      );

    if (
      net.isIP(
        mappedIpv4,
      ) === 4
    ) {
      return isBlockedIpv4(
        mappedIpv4,
      );
    }

    return true;
  }

  /*
   * Unique local:
   * fc00::/7.
   */
  if (
    normalized.startsWith(
      "fc",
    ) ||
    normalized.startsWith(
      "fd",
    )
  ) {
    return true;
  }

  /*
   * Link-local:
   * fe80::/10.
   */
  if (
    /^fe[89ab]/.test(
      normalized,
    )
  ) {
    return true;
  }

  /*
   * Multicast:
   * ff00::/8.
   */
  if (
    normalized.startsWith(
      "ff",
    )
  ) {
    return true;
  }

  /*
   * Documentation:
   * 2001:db8::/32.
   */
  if (
    normalized.startsWith(
      "2001:db8:",
    )
  ) {
    return true;
  }

  return false;
}

function validatePositiveInteger(
  value: number,
  name: string,
): void {
  if (
    !Number.isInteger(
      value,
    ) ||
    value <= 0
  ) {
    throw new Error(
      `${name} deve essere un numero intero maggiore di zero.`,
    );
  }
}

function validateNonNegativeInteger(
  value: number,
  name: string,
): void {
  if (
    !Number.isInteger(
      value,
    ) ||
    value < 0
  ) {
    throw new Error(
      `${name} deve essere un numero intero maggiore o uguale a zero.`,
    );
  }
}