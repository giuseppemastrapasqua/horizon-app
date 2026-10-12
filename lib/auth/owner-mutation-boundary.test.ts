import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  property: vi.fn(),
  report: vi.fn(),
  task: vi.fn(),
  adjustment: vi.fn(),
  transaction: vi.fn(),
}));
vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("login");
  }),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    property: { findFirst: mocks.property },
    financeReport: { findUnique: mocks.report },
    task: { findUnique: mocks.task },
    financeReportAdjustment: {
      create: mocks.adjustment,
      delete: mocks.adjustment,
    },
    $transaction: mocks.transaction,
  },
}));
vi.mock("@/services/audit/AuditService", () => ({
  AuditService: { log: vi.fn() },
}));
import {
  addFinanceReportAdjustmentAction,
  deleteFinanceReportAdjustmentAction,
} from "@/app/reports/monthly/[reportId]/actions";
import { markTaskDone, reopenTask } from "@/app/tasks/actions";
import { requireFinanceProperty } from "./management";

describe("server mutation boundaries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it.each(["OWNER", "OPERATOR", "SYSTEM_AI"])(
    "rejects %s finance writes before loading the target",
    async (role) => {
      mocks.auth.mockResolvedValue({ user: { id: "user-1", role } });
      const form = new FormData();
      form.set("reportId", "foreign-report");
      form.set("adjustmentId", "adjustment");
      form.set("type", "CREDIT");
      form.set("description", "test");
      form.set("amount", "500");
      await expect(addFinanceReportAdjustmentAction(form)).rejects.toThrow(
        "non autorizzata",
      );
      await expect(deleteFinanceReportAdjustmentAction(form)).rejects.toThrow(
        "non autorizzata",
      );
      expect(mocks.report).not.toHaveBeenCalled();
      expect(mocks.adjustment).not.toHaveBeenCalled();
    },
  );
  it("keeps OWNER tasks read-only even when an action is called directly", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "owner-1", role: "OWNER" } });
    await expect(markTaskDone("task-1")).rejects.toThrow("non autorizzata");
    await expect(reopenTask("task-1")).rejects.toThrow("non autorizzata");
    expect(mocks.task).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it("requires a finance or manager assignment after the global role check", async () => {
    mocks.auth.mockResolvedValue({
      user: { id: "manager-1", role: "MANAGER" },
    });
    mocks.property.mockResolvedValue(null);
    await expect(requireFinanceProperty("foreign-property")).rejects.toThrow(
      "Permessi insufficienti",
    );
    expect(mocks.property).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: "foreign-property" }),
      }),
    );
  });
});
