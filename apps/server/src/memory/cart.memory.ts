export type CartItem = {
  name: string;
  quantity: number;
  note?: string;
};

export type Cart = {
  items: CartItem[];
  awaitingConfirm?: boolean;
  pendingOrderId?: string;
  pendingPaymentOrderId?: string;
  pendingCancelOrderId?: string;
  pendingEditAddressOrderId?: string;
  pendingReservation?: {
    people?: number;
    time?: string;
  };
  pendingComplaint?: boolean;
  pendingRefund?: boolean;
  handoffRequested?: boolean;
  handoffId?: string;
};

const carts = new Map<string, Cart>();

// Key duy nhất cho từng khách hàng tại từng Business
function getKey(businessId: string, customerId: string) {
  return `${businessId}_${customerId}`;
}

export function getCart(businessId: string, customerId: string): Cart {
  return carts.get(getKey(businessId, customerId)) ?? { items: [] };
}

export function updateCart(businessId: string, customerId: string, cart: Cart) {
carts.set(getKey(businessId, customerId), cart);
}