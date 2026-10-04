// Brain contract — định nghĩa boundary giữa AI Brain và hệ thống.
//
// Nguyên tắc:
// - Brain chỉ hiểu ngôn ngữ, phân loại intent, extract entities.
// - Brain KHÔNG quyết định business rule, KHÔNG mutate state, KHÔNG gọi Tool.
// - Brain KHÔNG trả executable code.
// - BrainInput chứa context tối thiểu — không full menu/order/customer.
// - BrainOutput là structured intent result.

export type EntityValue = string | number | boolean | null;

export type BrainRole = "customer" | "staff" | "owner";

export type BrainMembershipTier = "bronze" | "silver" | "gold";

export type BrainInput = {
  // Raw user input (đã normalize lowercase + trim)
  message: string;

  // Identity
  conversationId: string;
  customerId: string;
  role: BrainRole;

  // Minimal customer context (KHÔNG full profile)
  customerName?: string;
  membershipTier: BrainMembershipTier;

  // State flags — chỉ boolean, KHÔNG data
  hasAwaitingConfirm: boolean;
  hasPendingOrderId: boolean;
  hasPendingPaymentOrderId: boolean;
  hasPendingCancelOrderId: boolean;
  hasPendingEditAddressOrderId: boolean;
  hasPendingReservation: boolean;
  hasPendingComplaint: boolean;
  hasPendingRefund: boolean;
  hasHandoffRequested: boolean;

  // Cart summary — chỉ count, KHÔNG items
  cartItemCount: number;

  // Short conversation history — chỉ vài message gần nhất
  recentHistory: string[];
  knownProducts: string[];
};

export type BrainOutput = {
  // Intent code (ví dụ "cart.add_item", "chat.greeting")
  intent: string;

  // Extracted entities — schema generic, đủ cho prototype
  entities: Record<string, EntityValue>;

  // 0..1
  confidence: number;
};

export interface Brain {
  interpret(input: BrainInput): Promise<BrainOutput>;
}