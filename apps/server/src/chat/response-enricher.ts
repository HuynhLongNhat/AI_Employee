import type { SkillContext, SkillResult } from "../skills/types";

export type EnrichedResult = SkillResult & {
  suggestions?: string[];
};

/**
 * Enricher — đọc state + reply, sinh ra `suggestions` cho UI.
 *
 * Tách biệt hoàn toàn khỏi skill. Skill chỉ trả `reply`.
 * Channel adapter (Web/Zalo/Messenger) tự quyết định render `suggestions`.
 */
export function enrich(
  result: SkillResult,
  ctx: SkillContext,
): EnrichedResult {
  // Đã có suggestions sẵn → giữ nguyên (nếu skill muốn override)
  if (result.suggestions && result.suggestions.length > 0) {
    return result;
  }

  // ===== Priority 1: state-based (pending flow) =====
  if (ctx.cart.awaitingConfirm) {
    return { ...result, suggestions: ["Có", "Không"] };
  }
  if (ctx.cart.pendingCancelOrderId) {
    return { ...result, suggestions: ["Có", "Không"] };
  }
  if (ctx.cart.pendingOrderId) {
    return { ...result, suggestions: ["Tại quán", "Giao hàng"] };
  }
  if (ctx.cart.pendingPaymentOrderId) {
    return { ...result, suggestions: ["Tiền mặt", "Chuyển khoản"] };
  }
  // Các pending state không nên gợi ý (đang chờ input free text)
  if (
    ctx.cart.pendingEditAddressOrderId ||
    ctx.cart.pendingComplaint ||
    ctx.cart.pendingRefund ||
    ctx.cart.pendingReservation ||
    ctx.cart.handoffRequested
  ) {
    return result;
  }

  // ===== Priority 2: reply pattern =====
  const reply = result.reply.toLowerCase();

  // Menu / product list
  if (
    reply.includes("hiện có:") &&
    (reply.includes("-") || reply.includes("•"))
  ) {
    return { ...result, suggestions: ["Đặt hàng", "Hỏi giá"] };
  }

  // Giỏ hàng
  if (reply.includes("giỏ hàng")) {
    return { ...result, suggestions: ["Đặt hàng", "Tính tiền"] };
  }

  // Tổng tiền / hoá đơn
  if (reply.includes("tổng cộng") || reply.includes("tổng tiền")) {
    return { ...result, suggestions: ["Đặt hàng", "Thêm món"] };
  }

  // Recommend
  if (reply.includes("gợi ý")) {
    return { ...result, suggestions: ["Đặt hàng", "Xem menu"] };
  }

  // Khuyến mãi
  if (reply.includes("khuyến mãi")) {
    return { ...result, suggestions: ["Xem menu", "Đặt hàng"] };
  }

  // Greeting
  if (
    reply.includes("chào") ||
    reply.includes("hello") ||
    reply.includes("giúp gì")
  ) {
    return { ...result, suggestions: ["Xem menu", "Giờ mở cửa", "Địa chỉ"] };
  }

  // Địa chỉ
  if (reply.includes(" ở ") && reply.length < 200) {
    return { ...result, suggestions: ["Giờ mở cửa", "Xem menu"] };
  }

  // Fallback → không gợi ý
  return result;
}