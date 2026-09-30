import { getAllCustomers } from '../memory/customer.memory';
import { getOrdersByCustomer } from '../memory/order.memory';
import { getMembership } from '../memory/membership.memory';
import { isVipCustomer } from "../knowledge/coffee.rules";
export function runRemindVipAutomation(): string {
  const allCustomers = getAllCustomers();
  const today = new Date();
  const oneDayMs = 24 * 60 * 60 * 1000;

  type Candidate = {
    customerId: string;
    name?: string;
    orderCount: number;
    tier: string;
    daysSinceLastOrder: number;
  };

  const candidates: Candidate[] = [];

  for (const c of allCustomers) {
    const orders = getOrdersByCustomer(c.customerId).filter(
      (o) => o.status !== 'cancelled',
    );

    if (orders.length === 0) continue;

    const membership = getMembership(c.customerId);
    const isVip = isVipCustomer(orders.length, membership.tier);

    if (!isVip) continue;

    const lastOrderAt = new Date(orders[0].createdAt);
    const daysSinceLastOrder = Math.floor(
      (today.getTime() - lastOrderAt.getTime()) / oneDayMs,
    );

    candidates.push({
      customerId: c.customerId,
      name: c.name,
      orderCount: orders.length,
      tier: membership.tier,
      daysSinceLastOrder,
    });
  }

  if (candidates.length === 0) {
    return 'Không có khách VIP nào cần chăm sóc.';
  }

  candidates.sort(
    (a, b) => b.daysSinceLastOrder - a.daysSinceLastOrder,
  );

  const top = candidates.slice(0, 5);

  const lines = top.map((c) => {
    const nameText = c.name ? ` (${c.name})` : '';
    return `- ${c.customerId}${nameText} — ${c.daysSinceLastOrder} ngày trước`;
  });

  return `${top.length} khách VIP cần chăm sóc:\n${lines.join('\n')}`;
}