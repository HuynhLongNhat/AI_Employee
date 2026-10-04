import { isYes, isNo, isNoOrCancel } from "../common/confirm";
import {
  formatPrice,
  formatLineItem,
  formatOrderStatus,
} from "../common/format";
import {
  findMenuPrice,
  summarizeCart,
  findMenuItemByName,
  findProductByName,
} from "../common/menu";
import {
  notFoundMenuReply,
  notInCartReply,
  NO_ORDER_REPLY,
} from "../common/messages";
import { coffeeRules } from "../knowledge/coffee.rules";
import { updateCart } from "../memory/cart.memory";
import {
  Order,
  getOrder,
  updateOrder,
  getLatestOrderByCustomer,
} from "../memory/order.memory";
import { safeCallTool } from "../tools/tool.registry";
import "../tools/create-order.tool";
import type { SkillContext, SkillResult, BrainEntities } from "./types";
import type { CreateOrderArgs } from "../tools/create-order.tool";
export function tryAwaitingConfirm(ctx: SkillContext): SkillResult | null {
  if (!ctx.cart.awaitingConfirm) return null;

  const yes = isYes(ctx.message);
  const no = isNoOrCancel(ctx.message);

  if (yes) {
    const { total } = summarizeCart(ctx.cart.items, ctx.menu, ctx.products);

    const args: CreateOrderArgs = {
      customerId: ctx.customerId,
      items: ctx.cart.items,
      total,
    };

    const result = safeCallTool<Order>("create_order", args);

    if (!result.ok) {
      ctx.cart.awaitingConfirm = false;
      updateCart(ctx.customerId, ctx.cart);

      return {
        reply:
          "Dạ, hệ thống đang gặp sự cố khi tạo đơn ạ. Mình thử lại sau ít phút, hoặc gõ 'gặp nhân viên' để được hỗ trợ ạ.",
      };
    }

    const order = result.result;

    ctx.cart.items = [];
    ctx.cart.awaitingConfirm = false;
    ctx.cart.pendingOrderId = order.id;
    updateCart(ctx.customerId, ctx.cart);

    return {
      reply: `Dạ, em đã tạo đơn ${order.id} ạ.\nTổng cộng: ${formatPrice(order.total)}.\nMình muốn nhận tại quán hay giao hàng ạ?`,
    };
  }

  if (no) {
    ctx.cart.awaitingConfirm = false;
    updateCart(ctx.customerId, ctx.cart);

    return { reply: "Dạ, em chưa đặt đơn ạ. Mình cần thêm gì cứ nói em nhé." };
  }

  return { reply: "Dạ, mình xác nhận đặt đơn này chứ ạ? (có / không)" };
}

export function tryPendingFulfillment(ctx: SkillContext): SkillResult | null {
  if (!ctx.cart.pendingOrderId) return null;

  const order = getOrder(ctx.cart.pendingOrderId);
  const message = ctx.message;

  if (order && !order.fulfillment) {
    const isDelivery = /giao hàng|giao|delivery|ship/i.test(message);
    const isDineIn = /tại quán|ở quán|tại đây|dine-?in|dùng tại quán/i.test(
      message,
    );

    if (isDelivery) {
      const minTotal = coffeeRules.minDeliveryOrderTotal;

      if (order.total < minTotal) {
        return {
          reply: `Dạ, đơn giao hàng cần tối thiểu ${minTotal.toLocaleString("vi-VN")}đ ạ. Đơn hiện tại của mình là ${order.total.toLocaleString("vi-VN")}đ. Mình có thể thêm món, hoặc chọn nhận tại quán ạ.`,
        };
      }

      updateOrder(order.id, { fulfillment: "delivery" });

      return {
        reply:
          "Dạ, em ghi nhận giao hàng. Mình cho em xin địa chỉ giao hàng ạ.",
      };
    }

    if (isDineIn) {
      updateOrder(order.id, { fulfillment: "dine-in" });

      ctx.cart.pendingOrderId = undefined;
      ctx.cart.pendingPaymentOrderId = order.id;
      updateCart(ctx.customerId, ctx.cart);

      return {
        reply: `Dạ, em đã ghi nhận đơn ${order.id} nhận tại quán ạ.\nMình muốn thanh toán tiền mặt hay chuyển khoản ạ?`,
      };
    }
  }

  if (order && order.fulfillment === "delivery" && !order.address) {
    const address = message.trim();
    updateOrder(order.id, { address });

    ctx.cart.pendingOrderId = undefined;
    ctx.cart.pendingPaymentOrderId = order.id;
    updateCart(ctx.customerId, ctx.cart);

    return {
      reply: `Dạ, em đã ghi nhận đơn ${order.id} giao tới ${address} ạ.\nMình muốn thanh toán tiền mặt hay chuyển khoản ạ?`,
    };
  }

  return null;
}

export function tryOrderStatus(ctx: SkillContext): SkillResult | null {
  const m = ctx.message;

  if (
    !m.includes("đơn của mình") &&
    !m.includes("kiểm tra đơn") &&
    !m.includes("trạng thái đơn") &&
    !m.includes("đơn hàng của mình") &&
    !m.includes("xem đơn")
  ) {
    return null;
  }

  const order = getLatestOrderByCustomer(ctx.customerId);

  if (!order) return { reply: NO_ORDER_REPLY };

  const statusText = formatOrderStatus(order.status);

  let fulfillmentText = "chưa chọn";
  if (order.fulfillment === "dine-in") {
    fulfillmentText = "nhận tại quán";
  } else if (order.fulfillment === "delivery") {
    fulfillmentText = order.address
      ? `giao hàng tới ${order.address}`
      : "giao hàng (chưa có địa chỉ)";
  }

  let paymentText = "chưa chọn";
  if (order.paymentMethod === "cash") paymentText = "tiền mặt";
  else if (order.paymentMethod === "bank-transfer")
    paymentText = "chuyển khoản";

  const lines = order.items.map((item) => {
    const price = findMenuPrice(item.name, ctx.menu, ctx.products);
    return formatLineItem(item.name, item.quantity, item.note, price);
  });

  return {
    reply: `Dạ, đơn gần nhất của mình là ${order.id} ạ.\nTrạng thái: ${statusText}\nHình thức: ${fulfillmentText}\nThanh toán: ${paymentText}\nMón:\n${lines.join("\n")}\nTổng cộng: ${formatPrice(order.total)}.`,
  };
}

export function tryCancelIntent(ctx: SkillContext): SkillResult | null {
  const m = ctx.message;

  if (
    !m.includes("huỷ đơn") &&
    !m.includes("hủy đơn") &&
    !m.includes("cancel đơn")
  ) {
    return null;
  }

  const order = getLatestOrderByCustomer(ctx.customerId);

  if (!order) {
    return { reply: "Dạ, hiện tại mình chưa có đơn nào để huỷ ạ." };
  }

  if (order.status === "cancelled") {
    return { reply: `Dạ, đơn ${order.id} đã được huỷ trước đó rồi ạ.` };
  }

  ctx.cart.pendingCancelOrderId = order.id;
  updateCart(ctx.customerId, ctx.cart);

  return {
    reply: `Dạ, mình chắc chắn muốn huỷ đơn ${order.id} chứ ạ? (có / không)`,
  };
}

export function tryPendingEditAddress(ctx: SkillContext): SkillResult | null {
  if (!ctx.cart.pendingEditAddressOrderId) return null;

  const order = getOrder(ctx.cart.pendingEditAddressOrderId);

  if (order) {
    const address = ctx.message.trim();
    updateOrder(order.id, { address });

    ctx.cart.pendingEditAddressOrderId = undefined;
    updateCart(ctx.customerId, ctx.cart);

    return {
      reply: `Dạ, em đã cập nhật địa chỉ giao hàng của đơn ${order.id} thành ${address} ạ.`,
    };
  }

  return null;
}

export function tryEditAddressIntent(ctx: SkillContext): SkillResult | null {
  const m = ctx.message;

  if (
    !(
      (m.includes("sửa địa chỉ") ||
        m.includes("đổi địa chỉ") ||
        m.includes("địa chỉ giao hàng")) &&
      !m.match(/^đổi địa chỉ thành /i)
    )
  ) {
    return null;
  }

  const order = getLatestOrderByCustomer(ctx.customerId);

  if (!order) return { reply: NO_ORDER_REPLY };

  if (order.status === "cancelled") {
    return { reply: `Dạ, đơn ${order.id} đã huỷ nên không sửa được ạ.` };
  }

  if (order.fulfillment !== "delivery") {
    return {
      reply: `Dạ, đơn ${order.id} nhận tại quán nên không có địa chỉ giao hàng để sửa ạ.`,
    };
  }

  ctx.cart.pendingEditAddressOrderId = order.id;
  updateCart(ctx.customerId, ctx.cart);

  return { reply: "Dạ, mình cho em xin địa chỉ mới ạ." };
}

export function tryPendingCancel(ctx: SkillContext): SkillResult | null {
  if (!ctx.cart.pendingCancelOrderId) return null;

  const order = getOrder(ctx.cart.pendingCancelOrderId);

  if (!order) return null;

  const yes = isYes(ctx.message);
  const no = isNo(ctx.message);

  if (yes) {
    updateOrder(order.id, { status: "cancelled" });

    ctx.cart.pendingCancelOrderId = undefined;
    updateCart(ctx.customerId, ctx.cart);

    return { reply: `Dạ, em đã huỷ đơn ${order.id} ạ.` };
  }

  if (no) {
    ctx.cart.pendingCancelOrderId = undefined;
    updateCart(ctx.customerId, ctx.cart);

    return { reply: `Dạ, em giữ nguyên đơn ${order.id} ạ.` };
  }

  return {
    reply: `Dạ, mình chắc chắn muốn huỷ đơn ${order.id} chứ ạ? (có / không)`,
  };
}

export function tryPendingPayment(ctx: SkillContext): SkillResult | null {
  if (!ctx.cart.pendingPaymentOrderId) return null;

  const order = getOrder(ctx.cart.pendingPaymentOrderId);

  if (!order) return null;

  const isCash = /tiền mặt|^cash$|^tm$/i.test(ctx.message.trim());
  const isTransfer = /chuyển khoản|^ck$|^bank$|transfer/i.test(
    ctx.message.trim(),
  );

  if (isCash) {
    updateOrder(order.id, { paymentMethod: "cash", status: "confirmed" });

    ctx.cart.pendingPaymentOrderId = undefined;
    updateCart(ctx.customerId, ctx.cart);

    return {
      reply: `Dạ, em đã ghi nhận đơn ${order.id} thanh toán tiền mặt ạ. Đơn của mình đã được xác nhận ạ.`,
    };
  }

  if (isTransfer) {
    updateOrder(order.id, {
      paymentMethod: "bank-transfer",
      status: "confirmed",
    });

    ctx.cart.pendingPaymentOrderId = undefined;
    updateCart(ctx.customerId, ctx.cart);

    return {
      reply: `Dạ, em đã ghi nhận đơn ${order.id} thanh toán chuyển khoản ạ. Đơn của mình đã được xác nhận ạ.`,
    };
  }

  return { reply: "Dạ, mình muốn thanh toán tiền mặt hay chuyển khoản ạ?" };
}

export function tryOrderIntent(ctx: SkillContext): SkillResult | null {
  const m = ctx.message;

  if (
    !m.includes("đặt hàng") &&
    !m.includes("mình muốn đặt") &&
    !m.includes("chốt đơn") &&
    !m.includes("xác nhận đặt")
  ) {
    return null;
  }

  if (ctx.cart.items.length === 0) {
    return { reply: "Dạ, giỏ hàng của mình đang trống nên chưa đặt được ạ." };
  }

  const { lines, total } = summarizeCart(
    ctx.cart.items,
    ctx.menu,
    ctx.products,
  );

  ctx.cart.awaitingConfirm = true;
  updateCart(ctx.customerId, ctx.cart);

  return {
    reply: `Dạ, đơn của mình hiện tại:\n\n${lines.join("\n")}\n\nTổng cộng: ${formatPrice(total)} ạ.\n\nMình xác nhận đặt đơn này chứ ạ?`,
  };
}

export function tryViewCart(ctx: SkillContext): SkillResult | null {
  const m = ctx.message;

  if (
    !(
      m.includes("giỏ hàng") &&
      (m.includes("có gì") || m.includes("gồm gì") || m.includes("xem"))
    )
  ) {
    return null;
  }

  if (ctx.cart.items.length === 0) {
    return { reply: "Dạ, hiện tại giỏ hàng của mình đang trống ạ." };
  }

  const cartText = ctx.cart.items
    .map((item) =>
      item.note
        ? `${item.quantity} × ${item.name} (${item.note})`
        : `${item.quantity} × ${item.name}`,
    )
    .join("\n");

  return { reply: `Dạ, giỏ hàng của mình hiện có:\n${cartText}` };
}

export function tryClearCart(ctx: SkillContext): SkillResult | null {
  const m = ctx.message;

  if (
    !(
      (m.includes("xoá") || m.includes("xóa") || m.includes("clear")) &&
      (m.includes("hết") || m.includes("tất cả") || m.includes("sạch"))
    )
  ) {
    return null;
  }

  if (ctx.cart.items.length === 0) {
    return { reply: "Dạ, giỏ hàng của mình đang trống sẵn rồi ạ." };
  }

  ctx.cart.items = [];
  updateCart(ctx.customerId, ctx.cart);

  return { reply: "Dạ, em đã xoá sạch giỏ hàng ạ." };
}

export function tryCalculateTotal(ctx: SkillContext): SkillResult | null {
  const m = ctx.message;

  if (
    !m.includes("tính tiền") &&
    !m.includes("tổng tiền") &&
    !m.includes("hoá đơn") &&
    !m.includes("hóa đơn") &&
    !m.includes("đơn mình")
  ) {
    return null;
  }

  if (ctx.cart.items.length === 0) {
    return {
      reply: "Dạ, giỏ hàng của mình đang trống nên chưa có gì để tính ạ.",
    };
  }

  const { lines, total } = summarizeCart(ctx.cart.items, ctx.menu);

  return {
    reply: `Dạ, đơn của mình hiện tại:\n\n${lines.join("\n")}\n\nTổng cộng: ${formatPrice(total)} ạ.`,
  };
}

export function tryRemoveMatch(ctx: SkillContext): SkillResult | null {
  const removeMatch = ctx.message.match(/^(xoá|xóa|bỏ|remove)\s+(.+)$/i);
  if (!removeMatch) return null;

  const item = findMenuItemByName(removeMatch[2].trim(), ctx.menu);

  if (!item) return { reply: notFoundMenuReply(removeMatch[2].trim()) };

  const existingIndex = ctx.cart.items.findIndex((i) => i.name === item.name);

  if (existingIndex === -1) return { reply: notInCartReply(item.name) };

  ctx.cart.items.splice(existingIndex, 1);
  updateCart(ctx.customerId, ctx.cart);

  return { reply: `Dạ, em đã xoá ${item.name} khỏi giỏ hàng ạ.` };
}

export function tryEditTarget(ctx: SkillContext): SkillResult | null {
  const updateMatch = ctx.message.match(/^(sửa|đổi)\s+(.+?)\s+thành\s+(\d+)$/i);
  const setMatch = ctx.message.match(/^(.+?)\s+còn\s+(\d+)$/i);

  const editTarget = updateMatch
    ? { nameRaw: updateMatch[2].trim(), quantity: parseInt(updateMatch[3], 10) }
    : setMatch
      ? { nameRaw: setMatch[1].trim(), quantity: parseInt(setMatch[2], 10) }
      : null;

  if (!editTarget) return null;

  const item = findMenuItemByName(editTarget.nameRaw, ctx.menu);

  if (!item) return { reply: notFoundMenuReply(editTarget.nameRaw) };

  const existingIndex = ctx.cart.items.findIndex((i) => i.name === item.name);

  if (existingIndex === -1) return { reply: notInCartReply(item.name) };

  if (editTarget.quantity <= 0) {
    ctx.cart.items.splice(existingIndex, 1);
    updateCart(ctx.customerId, ctx.cart);

    return { reply: `Dạ, em đã xoá ${item.name} khỏi giỏ hàng ạ.` };
  }

  ctx.cart.items[existingIndex].quantity = editTarget.quantity;
  updateCart(ctx.customerId, ctx.cart);

  return {
    reply: `Dạ, em đã cập nhật ${item.name} thành ${editTarget.quantity} ạ.`,
  };
}

export function tryQuantityMatch(
  ctx: SkillContext,
  entities?: BrainEntities,
): SkillResult | null {
  // ===== Brain path =====
  if (
    entities &&
    typeof entities.item === "string" &&
    typeof entities.quantity === "number"
  ) {
    const note = typeof entities.note === "string" ? entities.note : undefined;

    // Try products DB first
    const product = findProductByName(ctx.products, entities.item.trim());
    if (product) {
      return applyAddItem(
        ctx,
        { name: product.name, price: product.price },
        entities.quantity,
        note,
      );
    }

    // Fallback to legacy menu
    const menuItem = findMenuItemByName(entities.item.trim(), ctx.menu);
    if (!menuItem) return null;

    return applyAddItem(ctx, menuItem, entities.quantity, note);
  }

  // ===== Regex path (legacy) =====
  let rawMessage = ctx.message;
  const notes: string[] = [];

  if (/không đá|ko đá/i.test(rawMessage)) {
    notes.push("không đá");
    rawMessage = rawMessage.replace(/không đá|ko đá/gi, "").trim();
  } else if (/ít đá/i.test(rawMessage)) {
    notes.push("ít đá");
    rawMessage = rawMessage.replace(/ít đá/gi, "").trim();
  }

  if (/không đường|ko đường/i.test(rawMessage)) {
    notes.push("không đường");
    rawMessage = rawMessage.replace(/không đường|ko đường/gi, "").trim();
  } else if (/ít đường/i.test(rawMessage)) {
    notes.push("ít đường");
    rawMessage = rawMessage.replace(/ít đường/gi, "").trim();
  }

  const note = notes.length > 0 ? notes.join(", ") : undefined;

  const quantityMatch = rawMessage.match(/^(\d+)\s+(.+)$/);
  if (!quantityMatch) return null;

  const quantity = parseInt(quantityMatch[1], 10);
  const item = findMenuItemByName(quantityMatch[2].trim(), ctx.menu);

  if (!item) return null;

  return applyAddItem(ctx, item, quantity, note);
}

function applyAddItem(
  ctx: SkillContext,
  item: { name: string; price: number },
  quantity: number,
  note: string | undefined,
): SkillResult {
  const existingItem = ctx.cart.items.find(
    (i) => i.name === item.name && i.note === note,
  );
  const currentQty = existingItem?.quantity ?? 0;
  const max = coffeeRules.maxQuantityPerItem;

  if (currentQty + quantity > max) {
    const allowed = max - currentQty;

    if (allowed <= 0) {
      return {
        reply: `Dạ, mỗi món mình chỉ đặt tối đa ${max} phần ạ. Giỏ hàng hiện có ${currentQty} ${item.name} rồi ạ.`,
      };
    }

    return {
      reply: `Dạ, mỗi món mình chỉ đặt tối đa ${max} phần ạ. Giỏ hàng hiện có ${currentQty} ${item.name}, mình chỉ thêm được ${allowed} phần nữa ạ.`,
    };
  }

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    ctx.cart.items.push({ name: item.name, quantity, note });
  }

  updateCart(ctx.customerId, ctx.cart);

  return { reply: `Dạ, em đã thêm ${quantity} ${item.name} vào giỏ hàng ạ.` };
}
