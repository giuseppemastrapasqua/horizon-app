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

  const table = await adapter.getTable(
    "ListaAppartamenti",
  );

  return parseAlloggiatiApartmentList(
    table.csv,
  );
}