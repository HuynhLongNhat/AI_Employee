export type Role = 'customer' | 'staff' | 'owner';

const roles = new Map<string, Role>();

export function getRole(customerId: string): Role {
  return roles.get(customerId) ?? 'customer';
}

export function setRole(customerId: string, role: Role): void {
  roles.set(customerId, role);
}
