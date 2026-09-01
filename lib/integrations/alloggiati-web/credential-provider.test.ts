import {
  describe,
  expect,
  it,
} from "vitest";

import {
  UnconfiguredAlloggiatiWebCredentialProvider,
} from "./credential-provider";

describe(
  "UnconfiguredAlloggiatiWebCredentialProvider",
  () => {
    it(
      "fallisce senza esporre o inventare credenziali",
      async () => {
        const provider =
          new UnconfiguredAlloggiatiWebCredentialProvider();

        await expect(
          provider.getCredentials({
            propertyId: "property-1",
          }),
        ).rejects.toThrow(
          "Credenziali Alloggiati Web non ancora configurate.",
        );
      },
    );
  },
);
