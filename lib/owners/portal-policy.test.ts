import { describe, expect, it } from "vitest";
import { navigationForRole } from "@/lib/auth/navigation-policy";
import {
  isPublishedDocument,
  scopedPropertyFilter,
  ownerBookingLabel,
  ownerTaskTypes,
  ownerPropertyDocumentTypes,
} from "./portal-policy";

describe("OWNER portal policy", () => {
  it("keeps the five OWNER destinations in order, with no admin links", () => {
    const items = [
      "/invoices",
      "/tasks",
      "/bookings",
      "/settings",
      "/calendar",
      "/documents",
      "/dashboard",
    ].map((href) => ({ href, operatorVisible: href === "/tasks" }));
    expect(navigationForRole(items, "OWNER").map((item) => item.href)).toEqual([
      "/dashboard",
      "/calendar",
      "/bookings",
      "/documents",
      "/tasks",
    ]);
    expect(navigationForRole(items)).toEqual([]);
    expect(
      navigationForRole(items, "OPERATOR").map((item) => item.href),
    ).toEqual(["/tasks"]);
  });
  it("intersects selected property with the authorized portfolio", () => {
    expect(scopedPropertyFilter(["own"], "foreign")).toEqual({
      in: ["own"],
      equals: "foreign",
    });
    expect(scopedPropertyFilter([], "foreign")).toEqual({
      in: [],
      equals: "foreign",
    });
  });
  it("excludes drafts, archived invoices, operational tasks and identity documents", () => {
    expect(isPublishedDocument("DRAFT")).toBe(false);
    expect(isPublishedDocument("ARCHIVED")).toBe(false);
    expect(isPublishedDocument("FINAL")).toBe(true);
    expect(isPublishedDocument("ISSUED")).toBe(true);
    expect(ownerTaskTypes).toEqual(["MAINTENANCE", "ISSUE"]);
    expect(ownerPropertyDocumentTypes).not.toContain("IDENTITY_DOCUMENT");
    expect(ownerPropertyDocumentTypes).not.toContain("OTHER");
  });
  it("uses booking references without guest identities", () => {
    expect(ownerBookingLabel("booking-12345678")).toBe("Prenotazione 12345678");
  });
});
