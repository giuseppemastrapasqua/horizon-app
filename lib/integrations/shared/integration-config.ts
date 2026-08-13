function requireEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}`,
    );
  }

  return value;
}

function optionalEnv(
  name: string,
  fallback: string,
): string {
  return process.env[name]?.trim() || fallback;
}

function optionalBoolean(
  name: string,
  fallback = false,
): boolean {
  const value = process.env[name];

  if (value === undefined) {
    return fallback;
  }

  return value === "true";
}

export const integrationConfig = {
  bookingCom: {
    enabled: optionalBoolean(
      "BOOKING_COM_ENABLED",
      false,
    ),

    useMock: optionalBoolean(
      "BOOKING_COM_USE_MOCK",
      true,
    ),

    clientId: process.env.BOOKING_COM_CLIENT_ID,

    clientSecret:
      process.env.BOOKING_COM_CLIENT_SECRET,

   authBaseUrl: optionalEnv(
  "BOOKING_COM_AUTH_BASE_URL",
  "https://connectivity-authentication.booking.com",
),

    apiBaseUrl: optionalEnv(
      "BOOKING_COM_API_BASE_URL",
      "https://distribution-xml.booking.com",
    ),
  },
} as const;

export { requireEnv };