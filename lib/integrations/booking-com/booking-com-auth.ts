import { integrationConfig } from "@/lib/integrations/shared/integration-config";
import { httpRequest } from "@/lib/integrations/shared/http-client";
import type {
  ProviderAccessToken,
  ProviderAuth,
} from "@/lib/integrations/shared/provider-auth";

const TOKEN_REFRESH_BUFFER_MS =
  5 * 60 * 1000;

const TOKEN_FALLBACK_LIFETIME_MS =
  60 * 60 * 1000;

type BookingComTokenResponse = {
  jwt: string;
  ruid?: string;
};

type JwtPayload = {
  exp?: number;
};

export class BookingComAuth
  implements ProviderAuth
{
  private cachedToken:
    | ProviderAccessToken
    | null = null;

  async getAccessToken(): Promise<ProviderAccessToken> {
    if (integrationConfig.bookingCom.useMock) {
      return {
        accessToken: "mock-booking-token",
        expiresAt: new Date(
          Date.now() +
            TOKEN_FALLBACK_LIFETIME_MS,
        ),
      };
    }

    const cachedToken =
      this.getValidCachedToken();

    if (cachedToken) {
      return cachedToken;
    }

    const clientId =
      integrationConfig.bookingCom.clientId?.trim();

    const clientSecret =
      integrationConfig.bookingCom.clientSecret?.trim();

    if (!clientId || !clientSecret) {
      throw new Error(
        "Le credenziali Booking.com non sono configurate.",
      );
    }

    const response = await httpRequest({
      url: createTokenExchangeUrl(),
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!response.ok) {
      throw new Error(
        await createAuthenticationErrorMessage(
          response,
        ),
      );
    }

    const responseBody: unknown =
      await response.json();

    if (!isTokenResponse(responseBody)) {
      throw new Error(
        "Booking.com ha restituito una risposta di autenticazione non valida.",
      );
    }

    const token: ProviderAccessToken = {
      accessToken: responseBody.jwt,
      expiresAt:
        readTokenExpiration(
          responseBody.jwt,
        ) ??
        new Date(
          Date.now() +
            TOKEN_FALLBACK_LIFETIME_MS,
        ),
    };

    this.cachedToken = token;

    return token;
  }

  clearCachedToken(): void {
    this.cachedToken = null;
  }

  private getValidCachedToken():
    | ProviderAccessToken
    | null {
    if (!this.cachedToken) {
      return null;
    }

    const refreshAt =
      this.cachedToken.expiresAt.getTime() -
      TOKEN_REFRESH_BUFFER_MS;

    if (Date.now() >= refreshAt) {
      this.cachedToken = null;

      return null;
    }

    return this.cachedToken;
  }
}

function createTokenExchangeUrl(): string {
  const baseUrl =
    integrationConfig.bookingCom.authBaseUrl.replace(
      /\/+$/,
      "",
    );

  return `${baseUrl}/token-based-authentication/exchange`;
}

function isTokenResponse(
  value: unknown,
): value is BookingComTokenResponse {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return false;
  }

  const response =
    value as Record<string, unknown>;

  return (
    typeof response.jwt === "string" &&
    response.jwt.trim().length > 0 &&
    (
      response.ruid === undefined ||
      typeof response.ruid === "string"
    )
  );
}

function readTokenExpiration(
  token: string,
): Date | null {
  try {
    const parts = token.split(".");

    if (parts.length < 2) {
      return null;
    }

    const payload = JSON.parse(
      decodeBase64Url(parts[1]),
    ) as JwtPayload;

    if (
      typeof payload.exp !== "number" ||
      !Number.isFinite(payload.exp)
    ) {
      return null;
    }

    return new Date(
      payload.exp * 1000,
    );
  } catch {
    return null;
  }
}

function decodeBase64Url(
  value: string,
): string {
  return Buffer.from(
    value,
    "base64url",
  ).toString("utf8");
}

async function createAuthenticationErrorMessage(
  response: Response,
): Promise<string> {
  const fallbackMessage =
    `Autenticazione Booking.com fallita con HTTP ${response.status}.`;

  try {
    const body: unknown =
      await response.json();

    if (
      typeof body !== "object" ||
      body === null ||
      Array.isArray(body)
    ) {
      return fallbackMessage;
    }

    const value =
      body as Record<string, unknown>;

    if (
      typeof value.message === "string" &&
      value.message.trim()
    ) {
      return (
        `Autenticazione Booking.com fallita: ` +
        value.message.trim()
      );
    }

    return fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

export const bookingComAuth =
  new BookingComAuth();