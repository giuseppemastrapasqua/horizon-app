import crypto from "node:crypto";

import {
  BookingChannel,
} from "@prisma/client";

export const ICAL_EXPORT_DESTINATIONS = [
  BookingChannel.BOOKING,
  BookingChannel.AIRBNB,
  BookingChannel.VRBO,
] as const;

export type IcalExportDestination =
  (typeof ICAL_EXPORT_DESTINATIONS)[number];

export function isIcalExportDestination(
  value: string,
): value is IcalExportDestination {
  return (
    value === BookingChannel.BOOKING ||
    value === BookingChannel.AIRBNB ||
    value === BookingChannel.VRBO
  );
}

export function createIcalExportToken(input: {
  propertyId: string;
  destination: IcalExportDestination;
}): string {
  const secret = getIcalExportSecret();

  return crypto
    .createHmac("sha256", secret)
    .update(
      `${input.propertyId}:${input.destination}`,
      "utf8",
    )
    .digest("hex");
}

export function verifyIcalExportToken(input: {
  propertyId: string;
  destination: IcalExportDestination;
  token: string;
}): boolean {
  const expected =
    createIcalExportToken(input);

  const received =
    input.token.trim().toLowerCase();

  if (
    expected.length !==
    received.length
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(expected, "utf8"),
    Buffer.from(received, "utf8"),
  );
}

export function buildIcalExportPath(input: {
  propertyId: string;
  destination: IcalExportDestination;
}): string {
  const token =
    createIcalExportToken(input);

  return (
    `/calendar-feed/${encodeURIComponent(input.propertyId)}` +
    `/${input.destination.toLowerCase()}` +
    `/${token}/calendar.ics`
  );
}

export function buildIcalExportUrl(input: {
  propertyId: string;
  destination: IcalExportDestination;
}): string {
  const baseUrl =
    getPublicAppUrl();

  return new URL(
    buildIcalExportPath(input),
    baseUrl,
  ).toString();
}

function getIcalExportSecret(): string {
  const secret =
    process.env.ICAL_EXPORT_SECRET?.trim();

  if (!secret) {
    throw new Error(
      "ICAL_EXPORT_SECRET non configurato.",
    );
  }

  return secret;
}

function getPublicAppUrl(): string {
  const configured =
    process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (configured) {
    return configured.endsWith("/")
      ? configured
      : `${configured}/`;
  }

  if (
    process.env.NODE_ENV ===
    "production"
  ) {
    throw new Error(
      "NEXT_PUBLIC_APP_URL non configurato.",
    );
  }

  return "http://localhost:3000/";
}
