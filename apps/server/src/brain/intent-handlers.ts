import type { SkillHandler } from "../skills/types";
import type { Intent } from "./intent-catalog";
import * as customerService from "../skills/customer-service.skill";
import * as cartOrder from "../skills/cart-order.skill";
import * as customerCare from "../skills/customer-care.skill";
import * as ownerOps from "../skills/owner-operations.skill";
import * as knowledgeAdmin from "../skills/knowledge-admin.skill";
import * as automation from "../skills/automation.skill";

export const INTENT_HANDLERS: Record<Intent, SkillHandler> = {
  // ===== Chat / Customer service =====
  "chat.greeting": customerService.tryGreeting,
  "chat.view_menu": customerService.tryMenuView,
  "chat.ask_price": customerService.tryProductPrice,
  "chat.ask_item_detail": customerService.tryDetailQuestion,
  "chat.recommend": customerService.tryRecommendation,
  "chat.compare": customerService.tryCompare,
  "chat.faq": customerService.tryFaq,
  "chat.unclear": customerService.tryUnclear,
  "chat.unknown": customerService.tryFallback,
  "chat.short_context": customerService.tryShortContext,

  // ===== Shop info =====
  "shop.address": customerService.tryAddress,
  "shop.opening_hours": customerService.tryOpeningHours,
  "shop.wifi": customerService.tryWifi,
  "shop.parking": customerService.tryParking,
  "shop.phone": customerService.tryPhone,
  "shop.name": customerService.tryBusinessName,

  // ===== Customer profile =====
  "customer.set_name": customerService.trySetName,
  "customer.recall_name": customerService.tryRecallName,
  "customer.history": customerCare.tryHistory,
  "customer.regular_query": customerCare.tryRegular,
  "membership.query_tier": customerCare.tryTierQuery,

  // ===== Promotion (customer) =====
  "promotion.query": customerService.tryPromotions,

  // ===== Cart =====
  "cart.add_item": cartOrder.tryQuantityMatch,
  "cart.remove_item": cartOrder.tryRemoveMatch,
  "cart.update_item": cartOrder.tryEditTarget,
  "cart.view": cartOrder.tryViewCart,
  "cart.clear": cartOrder.tryClearCart,
  "cart.total": cartOrder.tryCalculateTotal,

  // ===== Order =====
  "order.place": cartOrder.tryOrderIntent,
  "order.confirm": cartOrder.tryAwaitingConfirm,
  "order.set_fulfillment": cartOrder.tryPendingFulfillment,
  "order.enter_delivery_address": cartOrder.tryPendingFulfillment,
  "order.set_payment": cartOrder.tryPendingPayment,
  "order.status": cartOrder.tryOrderStatus,
  "order.cancel_intent": cartOrder.tryCancelIntent,
  "order.cancel_confirm": cartOrder.tryPendingCancel,
  "order.edit_address": cartOrder.tryEditAddressIntent,
  "order.edit_address_enter": cartOrder.tryPendingEditAddress,

  // ===== Customer care =====
  "complaint.intent": customerCare.tryComplaintIntent,
  "complaint.enter_content": customerCare.tryPendingComplaint,
  "refund.intent": customerCare.tryRefundIntent,
  "refund.enter_reason": customerCare.tryPendingRefund,
  "refund.policy_query": customerService.tryRefundPolicyQuery,
  "reservation.intent": customerCare.tryReservationIntent,
  "reservation.enter_details": customerCare.tryPendingReservation,
  "handoff.intent": customerCare.tryHandoffIntent,

  // ===== Owner operations =====
  "owner.view_all_orders": ownerOps.tryViewAllOrders,
  "owner.view_orders_by_status": ownerOps.tryOrderFilter,
  "owner.view_customers": ownerOps.tryCustomerList,
  "owner.view_customer_detail": ownerOps.tryCustomerDetail,
  "owner.revenue": ownerOps.tryRevenue,
  "owner.best_sellers": ownerOps.tryBestSeller,
  "owner.top_customers": ownerOps.tryTopCustomers,
  "owner.customer_classification": ownerOps.tryClassification,
  "owner.tier_distribution": ownerOps.tryTierDistribution,
  "owner.order_distribution": ownerOps.tryOrderDistribution,
  "owner.aov": ownerOps.tryAov,
  "owner.care_suggestions": ownerOps.tryCareSuggestions,
  "owner.tier_upgrade_candidates": ownerOps.tryTierUpgrade,
  "owner.view_conversation_logs": ownerOps.tryViewLogs,

  // ===== Knowledge admin =====
  "admin.update_shop_info": knowledgeAdmin.tryKnowledgeOverrideCommand,
  "admin.view_knowledge": knowledgeAdmin.tryViewKnowledge,
  "admin.update_price": knowledgeAdmin.trySetPrice,
  "admin.view_menu": knowledgeAdmin.tryViewMenu,
  "admin.update_promotion": knowledgeAdmin.trySetDiscount,
  "admin.view_promotions": knowledgeAdmin.tryViewPromotions,
  "admin.view_refund_policy": knowledgeAdmin.tryViewRefundPolicy,

  // ===== Automation =====
  "automation.run_remind_vip": automation.tryRunAutomation,
  "automation.view_logs": automation.tryViewAutomationLogs,

  // ===== Test tooling =====
  "test.set_tier": ownerOps.trySetTier,
  "test.set_points": ownerOps.trySetPoints,
  "test.set_role": ownerOps.tryRoleCommand,
};