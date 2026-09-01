import {
  parsePublicAlloggiatiReferenceData,
} from "./public-reference-data-parser";
import {
  TableAlloggiatiReferenceResolver,
} from "./table-reference-resolver";

const BASE_URL =
  "https://alloggiatiweb.poliziadistato.it/portalealloggiati/ashx/Download.ashx";

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;
const DEFAULT_TIMEOUT_MS = 10_000;

type FetchResponse = {
  ok: boolean;
  status: number;
  text(): Promise<string>;
};

export type AlloggiatiPublicFetch = (
  url: string,
  init: {
    signal: AbortSignal;
  },
) => Promise<FetchResponse>;

export type PublicAlloggiatiReferenceProviderOptions = {
  fetch?: AlloggiatiPublicFetch;
  ttlMs?: number;
  timeoutMs?: number;
  now?: () => number;
};

export class PublicAlloggiatiReferenceProvider {
  private readonly fetchFn: AlloggiatiPublicFetch;
  private readonly ttlMs: number;
  private readonly timeoutMs: number;
  private readonly now: () => number;

  private cached:
    | {
        expiresAt: number;
        resolver: TableAlloggiatiReferenceResolver;
      }
    | undefined;

  constructor(
    options: PublicAlloggiatiReferenceProviderOptions = {},
  ) {
    this.fetchFn =
      options.fetch ??
      ((url, init) => fetch(url, init));

    this.ttlMs =
      options.ttlMs ?? DEFAULT_TTL_MS;

    this.timeoutMs =
      options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

    this.now = options.now ?? Date.now;
  }

  async getResolver():
    Promise<TableAlloggiatiReferenceResolver> {
    if (
      this.cached &&
      this.cached.expiresAt > this.now()
    ) {
      return this.cached.resolver;
    }

    const [
      municipalitiesCsv,
      countriesCsv,
      documentTypesCsv,
    ] = await Promise.all([
      this.download("0", "COMUNI"),
      this.download("1", "STATI"),
      this.download("2", "DOCUMENTI"),
    ]);

    const data =
      parsePublicAlloggiatiReferenceData(
        municipalitiesCsv,
        countriesCsv,
        documentTypesCsv,
      );

    const resolver =
      new TableAlloggiatiReferenceResolver(data);

    this.cached = {
      resolver,
      expiresAt: this.now() + this.ttlMs,
    };

    return resolver;
  }

  private async download(
    id: string,
    name: string,
  ): Promise<string> {
    const controller = new AbortController();

    const timer = setTimeout(
      () => controller.abort(),
      this.timeoutMs,
    );

    try {
      const url =
        `${BASE_URL}?ID=${id}&N=${name}`;

      const response = await this.fetchFn(
        url,
        {
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        throw new Error(
          `Download tabella Alloggiati ${name} fallito: HTTP ${response.status}.`,
        );
      }

      return await response.text();
    } finally {
      clearTimeout(timer);
    }
  }
}
