
import type { BrainInput } from "./brain.contract";
import type { SkillContext } from "../skills/types";
import { getRole } from "../memory/role.memory";
import { getMembership } from "../memory/membership.memory";
import { getConversation } from "../memory/chat.memory";

export function buildBrainInput(ctx: SkillContext): BrainInput {
  return {
    message: ctx.message,
    conversationId: ctx.conversationId,
    customerId: ctx.customerId,
    role: getRole(ctx.customerId),
    customerName: ctx.customer.name,
    membershipTier: getMembership(ctx.customerId).tier,
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