export type Refund = {
  id: string;
  customerId: string;
  orderId?: string;
  reason: string;
  status: 'requested';
  createdAt: string;
};

const refunds = new Map<string, Refund>();

export function createRefund(
  customerId: string,
  reason: string,
  orderId?: string,
): Refund {
  const id = `RFD-${Date.now()}`;

  const refund: Refund = {
    id,
    customerId,
    orderId,
    reason,
    status: 'requested',
    createdAt: new Date().toISOString(),
  };

  refunds.set(id, refund);

  return refund;
}

export function getRefund(id: string): Refund | undefined {
  return refunds.get(id);
}