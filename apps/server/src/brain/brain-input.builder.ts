import type { BrainInput } from "./brain.contract";
import type { SkillContext } from "../skills/types";
import { getConversation } from "../memory/chat.memory";

export function buildBrainInput(ctx: SkillContext): BrainInput {
  return {
    message: ctx.message,
    conversationId: ctx.conversationId,
    customerId: ctx.customerId,
    // THAY ĐỔI 1: Lấy role trực tiếp từ ctx
    role: ctx.role, 
    // THAY ĐỔI 2: Lấy name từ ctx.customer
    customerName: ctx.customer.name ?? undefined, 
    // THAY ĐỔI 3: Lấy tier trực tiếp từ ctx.customer
    membershipTier: ctx.customer.tier, 
    
    hasAwaitingConfirm: !!ctx.cart.awaitingConfirm,
    hasPendingOrderId: !!ctx.cart.pendingOrderId,
    hasPendingPaymentOrderId: !!ctx.cart.pendingPaymentOrderId,
    hasPendingCancelOrderId: !!ctx.cart.pendingCancelOrderId,
    hasPendingEditAddressOrderId: !!ctx.cart.pendingEditAddressOrderId,
    hasPendingReservation: !!ctx.cart.pendingReservation,
    hasPendingComplaint: !!ctx.cart.pendingComplaint,
    hasPendingRefund: !!ctx.cart.pendingRefund,
    hasHandoffRequested: !!ctx.cart.handoffRequested,
    cartItemCount: ctx.cart.items.length,
    recentHistory: getConversation(ctx.conversationId),
    knownProducts: ctx.products.map((p) => p.name),
  };
}