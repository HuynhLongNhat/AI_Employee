/**
 * Intent catalog — danh sách intent mà Brain có thể trả về.
 *
 * - Intent name = string literal.
 * - Mỗi intent tương ứng một ý định của user.
 * - Nhiều intent có thể map tới cùng 1 SkillHandler.
 * - Derived từ 71 handler thực tế của 6 skill.
 */

export const INTENTS = [
  // ===== Chat / Customer service =====
  "chat.greeting",
  "chat.view_menu",
  "chat.ask_price",
  "chat.ask_item_detail",
  "chat.recommend",
  "chat.compare",
  "chat.faq",
  "chat.unclear",
  "chat.unknown",
  "chat.short_context",

  // ===== Shop info =====
  "shop.address",
  "shop.opening_hours",
  "shop.wifi",
  "shop.parking",
  "shop.phone",
  "shop.name",

  // ===== Customer profile =====
  "customer.set_name",
  "customer.recall_name",
  "customer.history",
  "customer.regular_query",
  "membership.query_tier",

  // ===== Promotion (customer) =====
  "promotion.query",

  // ===== Cart =====
  "cart.add_item",
  "cart.remove_item",
  "cart.update_item",
  "cart.view",
  "cart.clear",
  "cart.total",

  // ===== Order =====
  "order.place",
  "order.confirm",
  "order.set_fulfillment",
  "order.enter_delivery_address",
  "order.set_payment",
  "order.status",
  "order.cancel_intent",
  "order.cancel_confirm",
  "order.edit_address",
  "order.edit_address_enter",

  // ===== Customer care =====
  "complaint.intent",
  "complaint.enter_content",
  "refund.intent",
  "refund.enter_reason",
  "refund.policy_query",
  "reservation.intent",
  "reservation.enter_details",
  "handoff.intent",

  // ===== Owner operations =====
  "owner.view_all_orders",
  "owner.view_orders_by_status",
  "owner.view_customers",
  "owner.view_customer_detail",
  "owner.revenue",
  "owner.best_sellers",
  "owner.top_customers",
  "owner.customer_classification",
  "owner.tier_distribution",
  "owner.order_distribution",
  "owner.aov",
  "owner.care_suggestions",
  "owner.tier_upgrade_candidates",
  "owner.view_conversation_logs",

  // ===== Knowledge admin =====
  "admin.update_shop_info",
  "admin.view_knowledge",
  "admin.update_price",
  "admin.view_menu",
  "admin.update_promotion",
  "admin.view_promotions",
  "admin.view_refund_policy",

  // ===== Automation =====
  "automation.run_remind_vip",
  "automation.view_logs",

  // ===== Test tooling =====
  "test.set_tier",
  "test.set_points",
  "test.set_role",
] as const;

export type Intent = (typeof INTENTS)[number];