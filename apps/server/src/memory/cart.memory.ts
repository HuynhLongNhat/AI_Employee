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

export function getCart(customerId: string): Cart {
  return carts.get(customerId) ?? { items: [] };
}

export function updateCart(customerId: string, cart: Cart) {
  carts.set(customerId, cart);
}