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

function createFormData() {
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
    "123",
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
    });

    it(
      "richiede i permessi sulla struttura",
      async () => {
        await expect(
          updatePropertyIntegrationAction(
            createFormData(),
          ),
        ).rejects.toThrow(
          "Alloggiati Web deve essere configurato nella sezione Compliance.",
        );

        expect(
          requirePropertyRoleMock,
        ).toHaveBeenCalledWith(
          "property-1",
          ["OWNER", "MANAGER"],
        );
      },
    );

    it(
      "rifiuta sempre il mapping generico Alloggiati Web",
      async () => {
        await expect(
          updatePropertyIntegrationAction(
            createFormData(),
          ),
        ).rejects.toThrow(
          "Alloggiati Web deve essere configurato nella sezione Compliance.",
        );

        expect(
          upsertMappingMock,
        ).not.toHaveBeenCalled();

        expect(
          revalidatePathMock,
        ).not.toHaveBeenCalled();
      },
    );
  },
);