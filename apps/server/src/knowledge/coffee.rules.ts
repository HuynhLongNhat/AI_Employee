import type { MembershipTier } from "../memory/membership.memory";

export const coffeeRules = {
  openingHour: 7,
  closingHour: 22,
  maxQuantityPerItem: 20,
  minDeliveryOrderTotal: 50000,
};

export function isVipCustomer(
  orderCount: number,
  tier: MembershipTier,
): boolean {
  return orderCount >= 5 || tier === "gold";
}

export function isRegularCustomer(orderCount: number): boolean {
  return orderCount >= 2;
}

export const TIER_UPGRADE_THRESHOLDS: Record<string, number> = {
  bronze: 5,
  silver: 10,
};

export function getNextTier(tier: MembershipTier): "Silver" | "Gold" {
  if (tier === "bronze") return "Silver";
  return "Gold";
}