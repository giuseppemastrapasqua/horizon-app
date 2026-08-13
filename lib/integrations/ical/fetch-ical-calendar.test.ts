import { EventEmitter } from "node:events";

import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const dnsLookupMock = vi.hoisted(() =>
  vi.fn(),
);

const httpRequestMock = vi.hoisted(() =>
  vi.fn(),
);

const httpsRequestMock = vi.hoisted(() =>
  vi.fn(),
);

vi.mock("node:dns/promises", () => ({
  default: {
    lookup: dnsLookupMock,
  },
}));

vi.mock("node:http", () => ({
  default: {
    request: httpRequestMock,
  },
}));

vi.mock("node:https", () => ({
  default: {
    request: httpsRequestMock,
  },
}));

import { fetchIcalCalendar } from "./fetch-ical-calendar";

type FakeResponseInput = {
  statusCode?: number;
  body?: string;
  location?: string;
};

describe("fetchIcalCalendar", () => {
  beforeEach(() => {
    dnsLookupMock.mockReset();
    httpRequestMock.mockReset();
    httpsRequestMock.mockReset();

    dnsLookupMock.mockResolvedValue([
      {
        address: "93.184.216.34",
        family: 4,
      },
    ]);
  });

  it("scarica correttamente un feed HTTPS pubblico", async () => {
    installHttpsResponses([
      {
        statusCode: 200,
        body: [
          "BEGIN:VCALENDAR",
          "VERSION:2.0",
          "END:VCALENDAR",
        ].join("\r\n"),
      },
    ]);

    const result =
      await fetchIcalCalendar(
        "https://calendar.example.com/feed.ics",
      );

    expect(result).toContain(
      "BEGIN:VCALENDAR",
    );

    expect(
      dnsLookupMock,
    ).toHaveBeenCalledWith(
      "calendar.example.com",
      {
        all: true,
        verbatim: true,
      },
    );

    expect(
      httpsRequestMock,
    ).toHaveBeenCalledOnce();

    expect(
      httpRequestMock,
    ).not.toHaveBeenCalled();
  });

  it("rifiuta URL non validi", async () => {
    await expect(
      fetchIcalCalendar(
        "questo-non-e-un-url",
      ),
    ).rejects.toThrow(
      "L'URL del feed iCal non è valido.",
    );

    expect(
      dnsLookupMock,
    ).not.toHaveBeenCalled();
  });

  it("rifiuta protocolli diversi da HTTP e HTTPS", async () => {
    await expect(
      fetchIcalCalendar(
        "ftp://example.com/calendar.ics",
      ),
    ).rejects.toThrow(
      "Il feed iCal deve utilizzare HTTP o HTTPS.",
    );

    expect(
      dnsLookupMock,
    ).not.toHaveBeenCalled();
  });

  it("rifiuta localhost", async () => {
    await expect(
      fetchIcalCalendar(
        "http://localhost/calendar.ics",
      ),
    ).rejects.toThrow(
      "L'URL del feed iCal non può puntare a localhost.",
    );

    expect(
      dnsLookupMock,
    ).not.toHaveBeenCalled();
  });

  it("rifiuta indirizzi IPv4 privati espliciti", async () => {
    await expect(
      fetchIcalCalendar(
        "http://127.0.0.1/calendar.ics",
      ),
    ).rejects.toThrow(
      "L'URL del feed iCal risolve verso un indirizzo IP non pubblico.",
    );

    expect(
      httpRequestMock,
    ).not.toHaveBeenCalled();
  });

  it("rifiuta hostname DNS che risolvono verso reti private", async () => {
    dnsLookupMock.mockResolvedValueOnce([
      {
        address: "192.168.1.25",
        family: 4,
      },
    ]);

    await expect(
      fetchIcalCalendar(
        "https://calendar.example.com/feed.ics",
      ),
    ).rejects.toThrow(
      "L'URL del feed iCal risolve verso un indirizzo IP non pubblico.",
    );

    expect(
      httpsRequestMock,
    ).not.toHaveBeenCalled();
  });

  it("segue redirect verso un altro URL pubblico", async () => {
    installHttpsResponses([
      {
        statusCode: 302,
        location:
          "https://cdn.example.com/calendar.ics",
      },
      {
        statusCode: 200,
        body: [
          "BEGIN:VCALENDAR",
          "VERSION:2.0",
          "END:VCALENDAR",
        ].join("\r\n"),
      },
    ]);

    dnsLookupMock
      .mockResolvedValueOnce([
        {
          address: "93.184.216.34",
          family: 4,
        },
      ])
      .mockResolvedValueOnce([
        {
          address: "93.184.216.35",
          family: 4,
        },
      ]);

    const result =
      await fetchIcalCalendar(
        "https://calendar.example.com/feed.ics",
      );

    expect(result).toContain(
      "END:VCALENDAR",
    );

    expect(
      httpsRequestMock,
    ).toHaveBeenCalledTimes(2);

    expect(
      dnsLookupMock,
    ).toHaveBeenNthCalledWith(
      2,
      "cdn.example.com",
      {
        all: true,
        verbatim: true,
      },
    );
  });

  it("rifiuta redirect verso una rete privata", async () => {
    installHttpsResponses([
      {
        statusCode: 302,
        location:
          "http://127.0.0.1/private.ics",
      },
    ]);

    await expect(
      fetchIcalCalendar(
        "https://calendar.example.com/feed.ics",
      ),
    ).rejects.toThrow(
      "L'URL del feed iCal risolve verso un indirizzo IP non pubblico.",
    );
  });

  it("rifiuta troppi redirect", async () => {
    installHttpsResponses([
      {
        statusCode: 302,
        location:
          "https://calendar.example.com/second.ics",
      },
    ]);

    await expect(
      fetchIcalCalendar(
        "https://calendar.example.com/feed.ics",
        {
          maxRedirects: 0,
        },
      ),
    ).rejects.toThrow(
      "Il feed iCal ha superato il numero massimo di redirect consentiti.",
    );
  });

  it("rifiuta risposte HTTP non riuscite", async () => {
    installHttpsResponses([
      {
        statusCode: 404,
        body: "Not found",
      },
    ]);

    await expect(
      fetchIcalCalendar(
        "https://calendar.example.com/feed.ics",
      ),
    ).rejects.toThrow(
      "Download del feed iCal fallito con HTTP 404.",
    );
  });

  it("rifiuta feed vuoti", async () => {
    installHttpsResponses([
      {
        statusCode: 200,
        body: "   ",
      },
    ]);

    await expect(
      fetchIcalCalendar(
        "https://calendar.example.com/feed.ics",
      ),
    ).rejects.toThrow(
      "Il feed iCal restituito è vuoto.",
    );
  });

  it("rifiuta feed oltre la dimensione massima", async () => {
    installHttpsResponses([
      {
        statusCode: 200,
        body: "1234567890",
      },
    ]);

    await expect(
      fetchIcalCalendar(
        "https://calendar.example.com/feed.ics",
        {
          maxBytes: 5,
        },
      ),
    ).rejects.toThrow(
      "Il feed iCal supera la dimensione massima consentita di 5 byte.",
    );
  });

  it("rifiuta credenziali incorporate nell'URL", async () => {
    await expect(
      fetchIcalCalendar(
        "https://user:password@example.com/feed.ics",
      ),
    ).rejects.toThrow(
      "L'URL del feed iCal non può contenere credenziali HTTP incorporate.",
    );

    expect(
      dnsLookupMock,
    ).not.toHaveBeenCalled();
  });

  it("valida le opzioni numeriche", async () => {
    await expect(
      fetchIcalCalendar(
        "https://example.com/feed.ics",
        {
          timeoutMs: 0,
        },
      ),
    ).rejects.toThrow(
      "timeoutMs deve essere un numero intero maggiore di zero.",
    );

    await expect(
      fetchIcalCalendar(
        "https://example.com/feed.ics",
        {
          maxBytes: -1,
        },
      ),
    ).rejects.toThrow(
      "maxBytes deve essere un numero intero maggiore di zero.",
    );

    await expect(
      fetchIcalCalendar(
        "https://example.com/feed.ics",
        {
          maxRedirects: -1,
        },
      ),
    ).rejects.toThrow(
      "maxRedirects deve essere un numero intero maggiore o uguale a zero.",
    );
  });
});

function installHttpsResponses(
  responses: FakeResponseInput[],
): void {
  let responseIndex = 0;

  httpsRequestMock.mockImplementation(
    (
      _url: URL,
      _options: unknown,
      callback: (
        response: EventEmitter & {
          statusCode?: number;
          headers: {
            location?: string;
          };
          destroy: (
            error?: Error,
          ) => void;
        },
      ) => void,
    ) => {
      const request =
        createFakeRequest();

      request.end.mockImplementation(
        () => {
          const input =
            responses[
              responseIndex
            ];

          responseIndex += 1;

          if (!input) {
            request.emit(
              "error",
              new Error(
                "Nessuna risposta HTTP simulata disponibile.",
              ),
            );

            return;
          }

          const response =
            new EventEmitter() as EventEmitter & {
              statusCode?: number;
              headers: {
                location?: string;
              };
              destroy: (
                error?: Error,
              ) => void;
            };

          response.statusCode =
            input.statusCode ?? 200;

          response.headers =
            input.location
              ? {
                  location:
                    input.location,
                }
              : {};

          response.destroy = (
            error?: Error,
          ) => {
            if (error) {
              response.emit(
                "error",
                error,
              );
            }
          };

          callback(response);

          if (input.body) {
            response.emit(
              "data",
              Buffer.from(
                input.body,
                "utf8",
              ),
            );
          }

          response.emit("end");
        },
      );

      return request;
    },
  );
}

function createFakeRequest() {
  const request =
    new EventEmitter() as EventEmitter & {
      setTimeout: ReturnType<typeof vi.fn>;
      destroy: (
        error?: Error,
      ) => void;
      end: ReturnType<typeof vi.fn>;
    };

  request.setTimeout = vi.fn();

  request.end = vi.fn();

  request.destroy = (
    error?: Error,
  ) => {
    if (error) {
      request.emit(
        "error",
        error,
      );
    }
  };

  return request;
}