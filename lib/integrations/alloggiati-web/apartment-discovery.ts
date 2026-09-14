import {
  AlloggiatiWebAdapter,
} from "./adapter";
import {
  parseAlloggiatiApartmentList,
  type AlloggiatiApartment,
} from "./apartment-list-parser";
import {
  SoapPreflightAlloggiatiWebTransport,
} from "./soap-preflight-transport";
import type {
  AlloggiatiWebCredentials,
} from "./types";

export async function discoverAlloggiatiApartments(
  credentials: AlloggiatiWebCredentials,
): Promise<AlloggiatiApartment[]> {
  const adapter = new AlloggiatiWebAdapter(
    new SoapPreflightAlloggiatiWebTransport(),
    credentials,
  );

  try {
    const table = await adapter.getTable(
      "ListaAppartamenti",
    );

    return parseAlloggiatiApartmentList(
      table.csv,
    );
  } catch (error) {
    if (isEmptyApartmentTableError(error)) {
      return [];
    }

    throw error;
  }
}

function isEmptyApartmentTableError(
  error: unknown,
): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const normalized = error.message
    .trim()
    .toLowerCase();

  return (
    normalized.endsWith("tabella vuota") ||
    normalized.endsWith("tebella vuota")
  );
}