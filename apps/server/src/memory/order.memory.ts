export type OrderItem = {
  name: string;
  quantity: number;
  note?: string;
};

export type Order = {
  id: string;
  customerId: string;
  items: OrderItem[];
  total: number;
  status: "pending" | "confirmed" | "cancelled";
  createdAt: string;
  fulfillment?: "dine-in" | "delivery";
  address?: string;
  paymentMethod?: "cash" | "bank-transfer";
};

const orders = new Map<string, Order>();

export function createOrder(
  customerId: string,
  items: OrderItem[],
  total: number,
): Order {
  const id = `ORD-${Date.now()}`;

  const order: Order = {
    id,
    customerId,
    items,
    total,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  orders.set(id, order);

  return order;
}

export function getOrder(orderId: string): Order | undefined {
  return orders.get(orderId);
}

export function updateOrder(
  orderId: string,
  patch: Partial<Order>,
): Order | undefined {
  const order = orders.get(orderId);

  if (!order) return undefined;

  const updated = { ...order, ...patch };

  orders.set(orderId, updated);

  return updated;
}

export function getLatestOrderByCustomer(
  customerId: string,
): Order | undefined {
  let latest: Order | undefined;

  for (const order of orders.values()) {
    if (order.customerId !== customerId) continue;

    if (!latest || order.createdAt > latest.createdAt) {
      latest = order;
    }
  }

  return latest;
}

export function getOrdersByCustomer(customerId: string): Order[] {
  const result: Order[] = [];

  for (const order of orders.values()) {
    if (order.customerId === customerId) {
      result.push(order);
    }
  }

  result.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  return result;
}

export function
  getAllOrders(): Order[] {
  const result = Array.from(orders.values());

  result.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  return result;
}

export function isActiveOrder(order: Order): boolean {
  return order.status !== "cancelled";
}

export function sumOrderTotals(orders: Order[]): number {
  return orders.reduce((sum, o) => sum + o.total, 0);
}

export function notInCartReply(name: string): string {
  return `Dạ, trong giỏ hàng không có ${name} ạ.`;
}
