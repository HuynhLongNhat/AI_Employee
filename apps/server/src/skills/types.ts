import type { Cart } from "../memory/cart.memory";

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

export type PolicyBundle = {
  order: string | null;
  delivery: string | null;
  payment: string | null;
  cancel: string | null;
  refund: string | null;
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

export type SkillContext = {
  message: string;
  customerId: string;
  conversationId: string;
  customer: CustomerInfo;
  cart: Cart;
  menu: MenuItem[];
  products: ProductServiceItem[];
  promotions: PromotionItem[];
  policies: PolicyBundle;
  faqs: FaqItem[];
  aiConfig: AiConfig; 
};

export type SkillResult = { reply: string };

export type BrainEntities = Record<string, string | number | boolean | null>;

export type ProductServiceItem = {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  status: "active" | "inactive";
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
