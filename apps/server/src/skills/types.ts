import { CustomerEntity } from "../customer/customer.entity";
import { OrderEntity } from "../order/order.entity";

// Định nghĩa lại cấu trúc Cart (vì đã chuyển sang lưu DB dạng JSON)
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

export type MenuItem = {
  name: string;
  price: number;
  description: string;
  suitableFor: string[];
  profile: {
    coffeeLevel: string;
    sweetness: string;
    milkLevel: string;
  };
};

export type CustomerInfo = {
  name?: string;
};

export type PromotionItem = {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  condition: string;
  discount: string;
  scope: "all" | "product";
  productIds: string[];
  status: "active" | "inactive";
};

export type PolicyItem = {
  id: string;
  title: string;
  content: string;
  status: "active" | "inactive";
};

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
  status: "active" | "inactive";
};

export type AiConfig = {
  name: string | null;
  role: string | null;
  style: string | null;
  permissions: {
    canAdvise: boolean;
    canPlaceOrder: boolean;
    canHandleIssue: boolean;
  } | null;
};

export type BusinessTerminology = {
  businessTerm: string;
  customerTerm: string;
  productTerm: string;
};

export type BusinessContext = {
  id: string;
  name: string;
  industry: string;
  terminology: BusinessTerminology;
  address: string;
  phone: string;
  openingHours: string;
  wifiName: string;
  wifiPassword: string;
};

export type SkillContext = {
  message: string;
  customerId: string;
  conversationId: string;
  customer: CustomerEntity;
  allCustomers: CustomerEntity[];
  cart: Cart;
  products: ProductServiceItem[];
  promotions: PromotionItem[];
  policies: PolicyItem[];
  faqs: FaqItem[];
  aiConfig: AiConfig;
  business: BusinessContext;
  role: "customer" | "staff" | "owner";
  isAuthenticated: boolean;
  recentLogs: Array<{
    id: string;
    customerId: string;
    conversationId: string;
    message: string;
    reply: string;
    createdAt: Date;
  }>;
  latestOrder: OrderEntity | null;
  customerOrders: OrderEntity[];
  allOrders: OrderEntity[];
};

export type SkillResult = {
  reply: string;
  suggestions?: string[];
};

export type BrainEntities = Record<string, string | number | boolean | null>;

export type ProductAiAttributes = {
  characteristics?: Record<string, string>;
  suitableFor?: string[];
  notSuitableFor?: string[];
};

export type ProductAttributes = Record<string, unknown>;

export type ProductServiceItem = {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  status: "active" | "inactive";
  attributes: ProductAttributes | null;
};

export type SkillHandler = (
  ctx: SkillContext,
  entities?: BrainEntities,
) => SkillResult | null;

export function runHandlers(
  handlers: SkillHandler[],
  ctx: SkillContext,
): SkillResult | null {
  for (const handler of handlers) {
    const r = handler(ctx);
    if (r) return r;
  }
  return null;
}
