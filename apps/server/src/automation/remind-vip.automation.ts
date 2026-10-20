import { isVipCustomer } from "../knowledge/coffee.rules";
import { CustomerEntity } from "../customer/customer.entity";
import { OrderEntity } from "../order/order.entity";

export function runRemindVipAutomation(
  allCustomers: CustomerEntity[],
  allOrders: OrderEntity[],
): string {
  const today = new Date();
  const oneDayMs = 24 * 60 * 60 * 1000;

  type Candidate = {
    customerId: string;
    name?: string | null;
    orderCount: number;
    tier: string;
    daysSinceLastOrder: number;
  };

  const candidates: Candidate[] = [];

  for (const c of allCustomers) {
    // Lấy orders từ tham số truyền vào
    const orders = allOrders
      .filter((o) => o.customerId === c.customerId && o.status !== "cancelled");

    if (orders.length === 0) continue;

    const isVip = isVipCustomer(orders.length, c.tier);

    if (!isVip) continue;

    const lastOrderAt = new Date(orders[0].createdAt);
    const daysSinceLastOrder = Math.floor(
      (today.getTime() - lastOrderAt.getTime()) / oneDayMs,
    );

    candidates.push({
      customerId: c.customerId,
      name: c.name,
      orderCount: orders.length,
      tier: c.tier,
      daysSinceLastOrder,
    });
  }

  if (candidates.length === 0) {
    return "Không có khách VIP nào cần chăm sóc.";
  }

  candidates.sort((a, b) => b.daysSinceLastOrder - a.daysSinceLastOrder);
  const top = candidates.slice(0, 5);

  const lines = top.map((c) => {
    const nameText = c.name ? ` (${c.name})` : "";
    return `- ${c.customerId}${nameText} — ${c.daysSinceLastOrder} ngày trước`;
  });

  return `${top.length} khách VIP cần chăm sóc:\n${lines.join("\n")}`;
}