import { getRole } from "../memory/role.memory";

export function isOwner(customerId: string): boolean {
  return getRole(customerId) === "owner";
}

export function isOwnerOrStaff(customerId: string): boolean {
  const role = getRole(customerId);
  return role === "owner" || role === "staff";
}