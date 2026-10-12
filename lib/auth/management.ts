import { requirePropertyRole, requireRoles } from "@/lib/auth/guards";

export async function requireFinanceManager() {
  return requireRoles(["SUPER_ADMIN", "MANAGER", "FINANCE_ADMIN"]);
}

export async function requireFinanceProperty(propertyId: string) {
  await requireFinanceManager();
  return requirePropertyRole(propertyId, ["MANAGER", "FINANCE"]);
}

export async function requireTaskOperator() {
  return requireRoles(["SUPER_ADMIN", "MANAGER", "OPERATOR"]);
}
