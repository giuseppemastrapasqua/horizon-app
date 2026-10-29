import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ accessible: vi.fn(), find: vi.fn() }));
vi.mock("@/lib/auth/guards", () => ({ getAccessiblePropertyIds: mocks.accessible }));
vi.mock("@/lib/prisma", () => ({ prisma: { property: { findMany: mocks.find } } }));
import { getPropertiesPageData } from "./get-properties-page-data";
beforeEach(() => { vi.clearAllMocks(); mocks.accessible.mockResolvedValue(["allowed"]); mocks.find.mockResolvedValue([]); });
it("hides archived properties by default without changing the access boundary", async () => {
  await getPropertiesPageData();
  expect(mocks.find.mock.calls[0][0].where).toEqual({ id: { in: ["allowed"] }, status: { not: "ARCHIVED" } });
});
it("exposes archived/all views explicitly and preserves search", async () => {
  await getPropertiesPageData({ view: "archived", search: "Bovisa" });
  expect(mocks.find.mock.calls[0][0].where).toMatchObject({ id: { in: ["allowed"] }, status: "ARCHIVED", OR: expect.any(Array) });
  await getPropertiesPageData({ view: "all" });
  expect(mocks.find.mock.calls[1][0].where).toEqual({ id: { in: ["allowed"] } });
});
it("sorts by the actual currentScore field", async () => {
  await getPropertiesPageData({ sort: "score-desc" });
  expect(mocks.find.mock.calls[0][0].orderBy).toEqual({ currentScore: "desc" });
});
