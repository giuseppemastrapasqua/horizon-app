import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const requireUserMock = vi.hoisted(() =>
  vi.fn(),
);

const requirePropertyRoleMock = vi.hoisted(() =>
  vi.fn(),
);

const propertyFindUniqueMock = vi.hoisted(() =>
  vi.fn(),
);

vi.mock("@/lib/auth/guards", () => ({
  requireUser: requireUserMock,
  requirePropertyRole: requirePropertyRoleMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    property: {
      findUnique: propertyFindUniqueMock,
    },
  },
}));

vi.mock("@/lib/tasks/resolve-task-assignee", () => ({
  resolveTaskAssignee: vi.fn(),
}));

vi.mock("@/services/audit/AuditService", () => ({
  AuditService: {
    log: vi.fn(),
  },
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

import { createTask } from "./actions-create";

describe("createTask", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    requireUserMock.mockResolvedValue({
      id: "user-1",
    });

    requirePropertyRoleMock.mockResolvedValue({
      id: "user-1",
    });

    propertyFindUniqueMock.mockResolvedValue(null);
  });

  it("richiede OWNER o MANAGER per creare un task", async () => {
    const formData = new FormData();

    formData.set(
      "propertyId",
      "property-1",
    );

    await expect(
      createTask(formData),
    ).rejects.toThrow(
      "Immobile non trovato.",
    );

    expect(
      requirePropertyRoleMock,
    ).toHaveBeenCalledWith(
      "property-1",
      ["OWNER", "MANAGER"],
    );
  });

  it("si ferma se il ruolo sulla struttura non è autorizzato", async () => {
    requirePropertyRoleMock.mockRejectedValue(
      new Error(
        "Permessi insufficienti per modificare la struttura.",
      ),
    );

    const formData = new FormData();

    formData.set(
      "propertyId",
      "property-1",
    );

    await expect(
      createTask(formData),
    ).rejects.toThrow(
      "Permessi insufficienti",
    );

    expect(
      propertyFindUniqueMock,
    ).not.toHaveBeenCalled();
  });
});