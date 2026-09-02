import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const requirePropertyRoleMock = vi.hoisted(() =>
  vi.fn(),
);

const upsertMappingMock = vi.hoisted(() =>
  vi.fn(),
);

const revalidatePathMock = vi.hoisted(() =>
  vi.fn(),
);

vi.mock("@/lib/auth/guards", () => ({
  requirePropertyRole: requirePropertyRoleMock,
}));

vi.mock(
  "@/lib/integrations/shared/upsert-integration-property-mapping",
  () => ({
    upsertIntegrationPropertyMapping:
      upsertMappingMock,
  }),
);

vi.mock("@/lib/prisma", () => ({
  prisma: {
    integrationPropertyMapping: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("@/lib/job/enqueue-background-job", () => ({
  enqueueBackgroundJob: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

import {
  updatePropertyIntegrationAction,
} from "./integration-actions";

function createFormData(
  externalPropertyId: string,
) {
  const formData = new FormData();

  formData.set(
    "propertyId",
    "property-1",
  );

  formData.set(
    "provider",
    "ALLOGGIATI_WEB",
  );

  formData.set(
    "externalPropertyId",
    externalPropertyId,
  );

  return formData;
}

describe(
  "Alloggiati Web integration mapping",
  () => {
    beforeEach(() => {
      vi.clearAllMocks();

      requirePropertyRoleMock.mockResolvedValue({
        id: "user-1",
      });

      upsertMappingMock.mockResolvedValue({
        id: "mapping-1",
      });
    });

    it(
      "accetta un IdAppartamento numerico",
      async () => {
        await updatePropertyIntegrationAction(
          createFormData("123"),
        );

        expect(
          requirePropertyRoleMock,
        ).toHaveBeenCalledWith(
          "property-1",
          ["OWNER", "MANAGER"],
        );

        expect(
          upsertMappingMock,
        ).toHaveBeenCalledWith({
          provider: "ALLOGGIATI_WEB",
          propertyId: "property-1",
          externalPropertyId: "123",
        });
      },
    );

    it(
      "rifiuta un IdAppartamento non numerico",
      async () => {
        await expect(
          updatePropertyIntegrationAction(
            createFormData("APT-123"),
          ),
        ).rejects.toThrow(
          "IdAppartamento Alloggiati Web non valido.",
        );

        expect(
          upsertMappingMock,
        ).not.toHaveBeenCalled();
      },
    );
  },
);
