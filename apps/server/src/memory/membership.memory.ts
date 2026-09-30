export type MembershipTier = 'bronze' | 'silver' | 'gold';

export type Membership = {
  tier: MembershipTier;
  points: number;
};

const memberships = new Map<string, Membership>();

const DEFAULT_MEMBERSHIP: Membership = {
  tier: 'bronze',
  points: 0,
};

export function getMembership(customerId: string): Membership {
  return memberships.get(customerId) ?? DEFAULT_MEMBERSHIP;
}

export function updateMembership(
  customerId: string,
  patch: Partial<Membership>,
): Membership {
  const current = memberships.get(customerId) ?? DEFAULT_MEMBERSHIP;

  const updated = { ...current, ...patch };

  memberships.set(customerId, updated);

  return updated;
}

