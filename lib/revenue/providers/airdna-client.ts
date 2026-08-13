export type AirDnaFetch =
  typeof fetch;

type AirDnaClientOptions = {
  apiKey: string;
  baseUrl?: string;
  fetchImpl?: AirDnaFetch;
};

export class AirDnaClient {
  private readonly apiKey:
    string;

  private readonly baseUrl:
    string;

  private readonly fetchImpl:
    AirDnaFetch;

  constructor(
    options: AirDnaClientOptions,
  ) {
    if (
      !options.apiKey.trim()
    ) {
      throw new Error(
        "AIRDNA_API_KEY non configurata.",
      );
    }

    this.apiKey =
      options.apiKey.trim();

    this.baseUrl =
      (
        options.baseUrl ??
        "https://api.airdna.co/api/enterprise/v2"
      ).replace(
        /\/+$/,
        "",
      );

    this.fetchImpl =
      options.fetchImpl ??
      fetch;
  }

  async post<TResponse>(
    path: string,
    body: unknown,
  ): Promise<TResponse> {
    const response =
      await this.fetchImpl(
        `${this.baseUrl}${path}`,
        {
          method:
            "POST",

          headers: {
            Authorization:
              `Bearer ${this.apiKey}`,

            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify(
              body,
            ),
        },
      );

    if (!response.ok) {
      const responseText =
        await response.text();

      throw new Error(
        `AirDNA API ${response.status}: ${responseText || response.statusText}`,
      );
    }

    return (
      await response.json()
    ) as TResponse;
  }
}

export function createAirDnaClientFromEnv() {
  return new AirDnaClient({
    apiKey:
      process.env
        .AIRDNA_API_KEY ??
      "",

    baseUrl:
      process.env
        .AIRDNA_API_BASE_URL,
  });
}
