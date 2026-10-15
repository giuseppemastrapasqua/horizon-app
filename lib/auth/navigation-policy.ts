export const ownerNavigationPaths = [
  "/dashboard",
  "/calendar",
  "/bookings",
  "/documents",
  "/tasks",
] as const;

export function navigationForRole<
  T extends { href: string; operatorVisible: boolean },
>(items: T[], role?: string): T[] {
  if (!role) return [];
  if (role === "OWNER") {
    return ownerNavigationPaths.flatMap((path) =>
      items.filter((item) => item.href === path),
    );
  }
  return items.filter((item) =>
    (role !== "OPERATOR" || item.operatorVisible) &&
    (item.href !== "/reports/cleaning" || ["SUPER_ADMIN", "MANAGER", "OPERATOR"].includes(role)),
  );
}
