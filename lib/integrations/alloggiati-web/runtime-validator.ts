import {
  AlloggiatiWebAdapter,
} from "./adapter";
import {
  SoapPreflightAlloggiatiWebTransport,
} from "./soap-preflight-transport";
import type {
  AlloggiatiWebCredentials,
} from "./types";

export function createRuntimeAlloggiatiWebValidator(
  credentials: AlloggiatiWebCredentials,
) {
  return new AlloggiatiWebAdapter(
    new SoapPreflightAlloggiatiWebTransport(),
    credentials,
  );
}
