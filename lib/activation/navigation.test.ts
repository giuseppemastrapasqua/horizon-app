import { expect, it } from "vitest";
import { navigationForRole } from "@/lib/auth/navigation-policy";
it("exposes activation only to admin and managers, preserving the owner menu", () => {
  const items = ["/dashboard", "/calendar", "/bookings", "/documents", "/tasks", "/activation"].map((href) => ({ href, operatorVisible: true }));
  for (const role of ["SUPER_ADMIN", "MANAGER"]) expect(navigationForRole(items, role).some((item) => item.href === "/activation")).toBe(true);
  for (const role of ["OWNER", "OPERATOR", "FINANCE_ADMIN", "SYSTEM_AI"]) expect(navigationForRole(items, role).some((item) => item.href === "/activation")).toBe(false);
  expect(navigationForRole(items, "OWNER").map((item) => item.href)).toEqual(["/dashboard", "/calendar", "/bookings", "/documents", "/tasks"]);
});
