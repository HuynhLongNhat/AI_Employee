import { formatPrice, formatTier } from "../common/format";
import {
  PROMPT_COMPLAINT_CONTENT,
  PROMPT_REFUND_REASON,
  PROMPT_RESERVATION_TIME,
} from "../common/messages";
import { isRegularCustomer } from "../knowledge/coffee.rules";
import { getMembership } from "../memory/membership.memory";
import { getOrdersByCustomer, getLatestOrderByCustomer, sumOrderTotals, isActiveOrder } from "../memory/order.memory";
import { createComplaint } from "../memory/complaint.memory";
import { createRefund } from "../memory/refund.memory";
import { createHandoff } from "../memory/handoff.memory";
import { createReservation } from "../memory/reservation.memory";
import { updateCart } from "../memory/cart.memory";
import type { SkillContext, SkillResult } from "./types";

export function tryPendingComplaint(ctx: SkillContext): SkillResult | null {
  if (!ctx.cart.pendingComplaint) return null;

  const content = ctx.message.replace(/\s+/g, " ").trim();

  if (!content) return { reply: PROMPT_COMPLAINT_CONTENT };

  const complaint = createComplaint(ctx.customerId, content);

  ctx.cart.pendingComplaint = false;
  updateCart(ctx.customerId, ctx.cart);

  return {
    reply: `Dạ, em đã ghi nhận khiếu nại ${complaint.id} ạ. Quán sẽ kiểm tra và phản hồi mình sớm ạ.`,
  };
}

export function tryPendingRefund(ctx: SkillContext): SkillResult | null {
  if (!ctx.cart.pendingRefund) return null;

  const reason = ctx.message.replace(/\s+/g, " ").trim();

  if (!reason) return { reply: PROMPT_REFUND_REASON };

  const latestOrder = getLatestOrderByCustomer(ctx.customerId);
  const refund = createRefund(ctx.customerId, reason, latestOrder?.id);

  ctx.cart.pendingRefund = false;
  updateCart(ctx.customerId, ctx.cart);

  const orderText = refund.orderId ? ` cho đơn ${refund.orderId}` : "";

  return {
    reply: `Dạ, em đã ghi nhận yêu cầu hoàn tiền ${refund.id}${orderText} ạ. Quán sẽ xác minh và phản hồi mình trong 1–2 ngày làm việc ạ.`,
  };
}

export function tryRefundIntent(ctx: SkillContext): SkillResult | null {
  const m = ctx.message;

  if (
    !m.includes("mình muốn hoàn tiền") &&
    !m.includes("cho mình hoàn tiền") &&
    !m.includes("yêu cầu hoàn tiền") &&
    !m.includes("hoàn tiền lại")
  ) {
    return null;
  }

  const latestOrder = getLatestOrderByCustomer(ctx.customerId);

  if (!latestOrder) {
    return { reply: "Dạ, hiện tại mình chưa có đơn nào để hoàn tiền ạ." };
  }

  ctx.cart.pendingRefund = true;
  updateCart(ctx.customerId, ctx.cart);

  return { reply: PROMPT_REFUND_REASON };
}

export function tryPendingReservation(ctx: SkillContext): SkillResult | null {
  if (!ctx.cart.pendingReservation) return null;

  const r = ctx.cart.pendingReservation;
  const message = ctx.message;

  if (r.people === undefined) {
    const peopleMatch = message.match(/(\d+)\s*(người|ng|khách|p)\b/i);

    if (!peopleMatch) return { reply: "Dạ, mình cho em xin số người ạ." };

    r.people = parseInt(peopleMatch[1], 10);

    const rest = message.replace(peopleMatch[0], "").replace(/\s+/g, " ").trim();
    if (rest) r.time = rest;

    ctx.cart.pendingReservation = r;
    updateCart(ctx.customerId, ctx.cart);

    if (r.time === undefined) return { reply: PROMPT_RESERVATION_TIME };
  }

  if (r.people !== undefined && r.time === undefined) {
    const timeRaw = message.replace(/\s+/g, " ").trim();
    if (!timeRaw) return { reply: PROMPT_RESERVATION_TIME };
    r.time = timeRaw;
  }

  const reservation = createReservation(ctx.customerId, r.people!, r.time!);

  ctx.cart.pendingReservation = undefined;
  updateCart(ctx.customerId, ctx.cart);

  return {
    reply: `Dạ, em đã ghi nhận đặt bàn ${reservation.id} cho ${r.people} người vào ${r.time} ạ.`,
  };
}

export function tryReservationIntent(ctx: SkillContext): SkillResult | null {
  const m = ctx.message;

  if (!m.includes("đặt bàn") && !m.includes("giữ bàn") && !m.includes("book bàn")) {
    return null;
  }

  ctx.cart.pendingReservation = {};
  updateCart(ctx.customerId, ctx.cart);

  return { reply: "Dạ, mình đặt bàn cho mấy người và vào lúc mấy giờ ạ?" };
}

export function tryTierQuery(ctx: SkillContext): SkillResult | null {
  const m = ctx.message;

  const asksTier =
    m.includes("hạng thành viên") ||
    m.includes("hạng của mình") ||
    (m.includes("hạng") && (m.includes("của mình") || m.includes("membership")));

  const asksPoints =
    m.includes("bao nhiêu điểm") ||
    m.includes("điểm của mình") ||
    m.includes("điểm tích lũy") ||
    m.includes("điểm tích luỹ") ||
    (m.includes("điểm") && m.includes("mình"));

  if (!asksTier && !asksPoints) return null;

  const membership = getMembership(ctx.customerId);
  const tierText = formatTier(membership.tier);

  if (asksTier) {
    return { reply: `Dạ, hiện tại mình đang ở hạng ${tierText} với ${membership.points} điểm ạ.` };
  }

  return { reply: `Dạ, hiện tại mình có ${membership.points} điểm ạ.` };
}

export function tryHistory(ctx: SkillContext): SkillResult | null {
  const m = ctx.message;

  if (
    !m.includes("lịch sử mua hàng") &&
    !m.includes("lịch sử đơn") &&
    !m.includes("mình đã mua gì") &&
    !m.includes("đã mua những gì") &&
    !m.includes("đơn cũ")
  ) {
    return null;
  }

  const orders = getOrdersByCustomer(ctx.customerId);

  if (orders.length === 0) {
    return { reply: "Dạ, mình chưa có đơn nào tại Mộc Coffee ạ." };
  }

  const validOrders = orders.filter(isActiveOrder);
  const totalSpent = sumOrderTotals(validOrders);

  const latest = orders[0];
  const latestStatus =
    latest.status === "confirmed"
      ? "đã xác nhận"
      : latest.status === "cancelled"
        ? "đã huỷ"
        : "chưa xác nhận";

  return {
    reply: `Dạ, mình đã có ${orders.length} đơn tại Mộc Coffee ạ.\nTổng chi tiêu: ${formatPrice(totalSpent)}.\nĐơn gần nhất: ${latest.id} — ${formatPrice(latest.total)} — ${latestStatus}.\nMình muốn xem chi tiết đơn nào không ạ?`,
  };
}

export function tryRegular(ctx: SkillContext): SkillResult | null {
  const m = ctx.message;

  if (!m.includes("khách quen") && !m.includes("khách thân") && !m.includes("mình quen chưa") && !m.includes("quen chưa")) {
    return null;
  }

  const orders = getOrdersByCustomer(ctx.customerId).filter(isActiveOrder);
  const orderCount = orders.length;
  const membership = getMembership(ctx.customerId);
  const tierText = formatTier(membership.tier);

  if (isRegularCustomer(orderCount)) {
    const nameText = ctx.customer?.name ? ` ${ctx.customer.name}` : "";

    return {
      reply: `Dạ, mình${nameText} đã có ${orderCount} đơn tại Mộc Coffee, nên em xem mình là khách quen ạ. Mình đang ở hạng ${tierText} với ${membership.points} điểm.`,
    };
  }

  return {
    reply: `Dạ, mình mới có ${orderCount} đơn tại Mộc Coffee ạ. Mình ghé thêm vài lần nữa là thành khách quen của quán rồi ạ.`,
  };
}

export function tryComplaintIntent(ctx: SkillContext): SkillResult | null {
  const m = ctx.message;

  if (!m.includes("khiếu nại") && !m.includes("phàn nàn") && !m.includes("báo lỗi") && !m.includes("có vấn đề")) {
    return null;
  }

  ctx.cart.pendingComplaint = true;
  updateCart(ctx.customerId, ctx.cart);

  return { reply: PROMPT_COMPLAINT_CONTENT };
}

export function tryHandoffIntent(ctx: SkillContext): SkillResult | null {
  const m = ctx.message;

  if (
    !m.includes("gặp nhân viên") &&
    !m.includes("nói chuyện với người") &&
    !m.includes("cho mình gặp staff") &&
    !m.includes("gọi nhân viên") &&
    !m.includes("cần người thật")
  ) {
    return null;
  }

  const handoff = createHandoff(ctx.customerId, ctx.conversationId);

  ctx.cart.handoffRequested = true;
  ctx.cart.handoffId = handoff.id;
  updateCart(ctx.customerId, ctx.cart);

  return { reply: "Dạ, em đã ghi nhận và chuyển cho nhân viên ạ. Nhân viên sẽ tiếp nhận trong giây lát ạ." };
}

export function tryHandoffBlock(ctx: SkillContext): SkillResult | null {
  if (!ctx.cart.handoffRequested) return null;
  return { reply: "Dạ em đã chuyển cho nhân viên rồi ạ, mình chờ chút nhé." };
}