import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const mocks = vi.hoisted(() => ({
  requirePropertyRole: vi.fn(),
  findUnique: vi.fn(),
  findFirst: vi.fn(),
  update: vi.fn(),
  enqueueBackgroundJob: vi.fn(),
  auditLog: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth/guards", () => ({
  requirePropertyRole:
    mocks.requirePropertyRole,
}));

vi.mock("@/lib/job/enqueue-background-job", () => ({
  enqueueBackgroundJob:
    mocks.enqueueBackgroundJob,
}));

vi.mock("@/services/audit/AuditService", () => ({
  AuditService: {
    log: mocks.auditLog,
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath:
    mocks.revalidatePath,
}));

vi.mock("@/lib/prisma", () => {
  const transaction = {
    property: {
      findUnique:
        mocks.findUnique,
      findFirst:
        mocks.findFirst,
      update:
        mocks.update,
    },
  };

  return {
    prisma: {
      $transaction: vi.fn(
        async (
          callback: (
            tx: typeof transaction,
          ) => unknown,
        ) => callback(transaction),
      ),
    },
  };
});

import {
  updatePropertyCodesAction,
} from "./property-code-actions";

function buildFormData(
  cin = "IT123ABC",
  cir = "CIR456",
) {
  const formData = new FormData();

  formData.set(
    "propertyId",
    "property-1",
  );

  formData.set(
    "cin",
    cin,
  );

  formData.set(
    "cir",
    cir,
  );

  return formData;
}

describe(
  "updatePropertyCodesAction",
  () => {
    beforeEach(() => {
      vi.clearAllMocks();

      mocks.requirePropertyRole.mockResolvedValue({
        id: "user-1",
      });

      mocks.findUnique.mockResolvedValue({
        cin: "OLD-CIN",
        cir: "OLD-CIR",
      });

      mocks.findFirst.mockResolvedValue(
        null,
      );

      mocks.update.mockResolvedValue({
        id: "property-1",
      });

      mocks.enqueueBackgroundJob.mockResolvedValue(
        undefined,
      );

      mocks.auditLog.mockResolvedValue(
        undefined,
      );
    });

    it(
      "normalizza e salva CIN e CIR avviando la verifica",
      async () => {
        await updatePropertyCodesAction(
          buildFormData(
            " it 123 abc ",
            " cir 456 ",
          ),
        );

        expect(
          mocks.update,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              id: "property-1",
            },
            data: expect.objectContaining({
              cin: "IT123ABC",
              cir: "CIR456",
              codeVerificationStatus:
                "PENDING",
            }),
          }),
        );

        expect(
          mocks.enqueueBackgroundJob,
        ).toHaveBeenCalledOnce();
      },
    );

    it(
      "esclude la struttura corrente dal controllo duplicati",
      async () => {
        await updatePropertyCodesAction(
          buildFormData(),
        );

        expect(
          mocks.findFirst,
        ).toHaveBeenNthCalledWith(
          1,
          {
            where: {
              id: {
                not: "property-1",
              },
              cin: {
                equals: "IT123ABC",
                mode: "insensitive",
              },
            },
            select: {
              id: true,
            },
          },
        );

        expect(
          mocks.findFirst,
        ).toHaveBeenNthCalledWith(
          2,
          {
            where: {
              id: {
                not: "property-1",
              },
              cir: {
                equals: "CIR456",
                mode: "insensitive",
              },
            },
            select: {
              id: true,
            },
          },
        );
      },
    );

    it(
      "blocca un CIN già registrato",
      async () => {
        mocks.findFirst.mockResolvedValueOnce({
          id: "property-2",
        });

        await expect(
          updatePropertyCodesAction(
            buildFormData(),
          ),
        ).rejects.toThrow(
          "CIN già registrato su Horizon",
        );

        expect(
          mocks.update,
        ).not.toHaveBeenCalled();

        expect(
          mocks.enqueueBackgroundJob,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "blocca un CIR già registrato",
      async () => {
        mocks.findFirst
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({
            id: "property-2",
          });

        await expect(
          updatePropertyCodesAction(
            buildFormData(),
          ),
        ).rejects.toThrow(
          "CIR già registrato su Horizon",
        );

        expect(
          mocks.update,
        ).not.toHaveBeenCalled();

        expect(
          mocks.enqueueBackgroundJob,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "non riavvia la verifica se i codici non cambiano",
      async () => {
        mocks.findUnique.mockResolvedValue({
          cin: "IT123ABC",
          cir: "CIR456",
        });

        await updatePropertyCodesAction(
          buildFormData(),
        );

        expect(
          mocks.update,
        ).toHaveBeenCalledWith({
          where: {
            id: "property-1",
          },
          data: {
            cin: "IT123ABC",
            cir: "CIR456",
          },
        });

        expect(
          mocks.enqueueBackgroundJob,
        ).not.toHaveBeenCalled();

        expect(
          mocks.auditLog,
        ).not.toHaveBeenCalled();
      },
    );
  },
);
