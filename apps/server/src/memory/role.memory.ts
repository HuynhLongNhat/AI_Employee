export type Role = 'customer' | 'staff' | 'owner';

const roles = new Map<string, Role>();

export function getRole(customerId: string): Role {
  return roles.get(customerId) ?? 'customer';
}

export function setRole(customerId: string, role: Role): void {
  roles.set(customerId, role);
}

export const ROLE_COMMANDS: {
  regex: RegExp;
  role: Role;
  label: string;
}[] = [
  { regex: /^mình là chủ quán$/i, role: "owner", label: "Owner" },
  { regex: /^mình là nhân viên$/i, role: "staff", label: "Staff" },
  { regex: /^mình là khách$/i, role: "customer", label: "Customer" },
];