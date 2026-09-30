import { Body, Controller, Post } from "@nestjs/common";
import { coffeeFaq } from "../knowledge/coffee.faq";
import { addMessage, getConversation } from "../memory/chat.memory";
import {
  getCustomer,
  updateCustomer,
  getAllCustomers,
} from "../memory/customer.memory";
import { getCart, updateCart } from "../memory/cart.memory";
import {
  getOrder,
  updateOrder,
  getLatestOrderByCustomer,
  getOrdersByCustomer,
  Order,
  getAllOrders,
  isActiveOrder,
  sumOrderTotals,
} from "../memory/order.memory";
import { createReservation } from "../memory/reservation.memory";
import { getMembership, updateMembership } from "../memory/membership.memory";
import { createComplaint } from "../memory/complaint.memory";
import { coffeeRefundPolicy } from "../knowledge/coffee.refund";
import { createRefund } from "../memory/refund.memory";
import { createHandoff } from "../memory/handoff.memory";
import { safeCallTool } from "../tools/tool.registry";
import "../tools/create-order.tool";
import {
  coffeeRules,
  isVipCustomer,
  isRegularCustomer,
  TIER_UPGRADE_THRESHOLDS,
  getNextTier,
} from "../knowledge/coffee.rules";
import { setRole, ROLE_COMMANDS } from "../memory/role.memory";
import {
  getEffectiveOpeningHours,
  getEffectivePhone,
  getEffectiveAddress,
  getEffectiveWifiName,
  getEffectiveWifiPassword,
  getEffectiveParking,
  KNOWLEDGE_OVERRIDE_COMMANDS,
} from "../knowledge/knowledge.override.memory";
import { coffeeKnowledge } from "../knowledge/coffee.knowledge";
import {
  getEffectiveMenu,
  setMenuPrice,
} from "../knowledge/menu.override.memory";
import {
  getEffectivePromotions,
  setPromotionDiscount,
} from "../knowledge/promotion.override.memory";
import { logTurn, getRecentLogs } from "../memory/conversation.log.memory";
import {
  logAutomation,
  getRecentAutomationLogs,
} from "../automation/automation.log.memory";
import { runRemindVipAutomation } from "../automation/remind-vip.automation";
import {
  formatPrice,
  formatTier,
  formatOrderStatus,
  formatLineItem,
  formatNameSuffix,
  formatDateTime,
} from "../common/format";
import { isOwner, isOwnerOrStaff } from "../common/access";
import { isYes, isNo, isNoOrCancel } from "../common/confirm";
import {
  findMenuPrice,
  summarizeCart,
  findMenuItemByName,
  formatMenuText,
} from "../common/menu";
import {
  OWNER_ONLY_REPLY,
  OWNER_OR_STAFF_ONLY_REPLY,
  NO_ORDER_REPLY,
  PROMPT_COMPLAINT_CONTENT,
  PROMPT_REFUND_REASON,
  PROMPT_RESERVATION_TIME,
  notFoundMenuReply,
  notInCartReply
} from "../common/messages";
@Controller("chat")
export class ChatController {
  @Post()
  chat(
    @Body()
    body: {
      message: string;
      conversationId: string;
      customerId: string;
    },
  ) {
    const result = this.chatInternal(body);

    logTurn(body.conversationId, body.customerId, body.message, result.reply);

    return result;
  }

  private chatInternal(body: {
    message: string;
    conversationId: string;
    customerId: string;
  }) {
    const message = body.message.toLowerCase().trim();
    const conversationId = body.conversationId;
    const customerId = body.customerId;
    const customer = getCustomer(customerId);
    const cart = getCart(customerId);
    const menu = getEffectiveMenu();
    // UC17 - xử lý khi đang chờ xác nhận đơn
    if (cart.awaitingConfirm) {
      const yes = isYes(message);
      const no = isNoOrCancel(message);

      if (yes) {
        const { total } = summarizeCart(cart.items, menu);

        const result = safeCallTool<Order>("create_order", {
          customerId,
          items: cart.items,
          total,
        });

        if (!result.ok) {
          cart.awaitingConfirm = false;
          updateCart(customerId, cart);

          return {
            reply:
              "Dạ, hệ thống đang gặp sự cố khi tạo đơn ạ. Mình thử lại sau ít phút, hoặc gõ 'gặp nhân viên' để được hỗ trợ ạ.",
          };
        }

        const order = result.result;

        cart.items = [];
        cart.awaitingConfirm = false;
        cart.pendingOrderId = order.id;
        updateCart(customerId, cart);

        return {
          reply: `Dạ, em đã tạo đơn ${order.id} ạ.\nTổng cộng: ${formatPrice(order.total)}.\nMình muốn nhận tại quán hay giao hàng ạ?`,
        };
      }

      if (no) {
        cart.awaitingConfirm = false;
        updateCart(customerId, cart);

        return {
          reply: "Dạ, em chưa đặt đơn ạ. Mình cần thêm gì cứ nói em nhé.",
        };
      }

      return {
        reply: "Dạ, mình xác nhận đặt đơn này chứ ạ? (có / không)",
      };
    }

    // UC19 - xử lý chọn hình thức nhận hàng
    if (cart.pendingOrderId) {
      const order = getOrder(cart.pendingOrderId);

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

          cart.pendingOrderId = undefined;
          cart.pendingPaymentOrderId = order.id;
          updateCart(customerId, cart);

          return {
            reply: `Dạ, em đã ghi nhận đơn ${order.id} nhận tại quán ạ.\nMình muốn thanh toán tiền mặt hay chuyển khoản ạ?`,
          };
        }
      }

      // UC19 - nhận địa chỉ giao hàng
      if (order && order.fulfillment === "delivery" && !order.address) {
        const address = message.trim();

        updateOrder(order.id, { address });

        cart.pendingOrderId = undefined;
        cart.pendingPaymentOrderId = order.id;
        updateCart(customerId, cart);

        return {
          reply: `Dạ, em đã ghi nhận đơn ${order.id} giao tới ${address} ạ.\nMình muốn thanh toán tiền mặt hay chuyển khoản ạ?`,
        };
      }
    }

    // UC21 - khách kiểm tra trạng thái đơn
    if (
      message.includes("đơn của mình") ||
      message.includes("kiểm tra đơn") ||
      message.includes("trạng thái đơn") ||
      message.includes("đơn hàng của mình") ||
      message.includes("xem đơn")
    ) {
      const order = getLatestOrderByCustomer(customerId);

      if (!order) {
        return {
          reply: NO_ORDER_REPLY,
        };
      }

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
      if (order.paymentMethod === "cash") {
        paymentText = "tiền mặt";
      } else if (order.paymentMethod === "bank-transfer") {
        paymentText = "chuyển khoản";
      }

      const lines = order.items.map((item) => {
        const price = findMenuPrice(item.name, menu);

        return formatLineItem(item.name, item.quantity, item.note, price);
      });

      return {
        reply: `Dạ, đơn gần nhất của mình là ${order.id} ạ.\nTrạng thái: ${statusText}\nHình thức: ${fulfillmentText}\nThanh toán: ${paymentText}\nMón:\n${lines.join("\n")}\nTổng cộng: ${formatPrice(order.total)}.`,
      };
    }

    // UC22 - khách muốn huỷ đơn
    if (
      message.includes("huỷ đơn") ||
      message.includes("hủy đơn") ||
      message.includes("cancel đơn")
    ) {
      const order = getLatestOrderByCustomer(customerId);

      if (!order) {
        return {
          reply: "Dạ, hiện tại mình chưa có đơn nào để huỷ ạ.",
        };
      }

      if (order.status === "cancelled") {
        return {
          reply: `Dạ, đơn ${order.id} đã được huỷ trước đó rồi ạ.`,
        };
      }

      cart.pendingCancelOrderId = order.id;
      updateCart(customerId, cart);

      return {
        reply: `Dạ, mình chắc chắn muốn huỷ đơn ${order.id} chứ ạ? (có / không)`,
      };
    }

    // UC22 - xử lý nhập địa chỉ mới
    if (cart.pendingEditAddressOrderId) {
      const order = getOrder(cart.pendingEditAddressOrderId);

      if (order) {
        const address = message.trim();

        updateOrder(order.id, { address });

        cart.pendingEditAddressOrderId = undefined;
        updateCart(customerId, cart);

        return {
          reply: `Dạ, em đã cập nhật địa chỉ giao hàng của đơn ${order.id} thành ${address} ạ.`,
        };
      }
    }

    // UC27 - xử lý nhập nội dung khiếu nại
    if (cart.pendingComplaint) {
      const content = message.replace(/\s+/g, " ").trim();

      if (!content) {
        return {
          reply: PROMPT_COMPLAINT_CONTENT,
        };
      }

      const complaint = createComplaint(customerId, content);

      cart.pendingComplaint = false;
      updateCart(customerId, cart);

      return {
        reply: `Dạ, em đã ghi nhận khiếu nại ${complaint.id} ạ. Quán sẽ kiểm tra và phản hồi mình sớm ạ.`,
      };
    }

    // UC28 - xử lý nhập lý do hoàn tiền
    if (cart.pendingRefund) {
      const reason = message.replace(/\s+/g, " ").trim();

      if (!reason) {
        return {
          reply: PROMPT_REFUND_REASON,
        };
      }

      const latestOrder = getLatestOrderByCustomer(customerId);

      const refund = createRefund(customerId, reason, latestOrder?.id);

      cart.pendingRefund = false;
      updateCart(customerId, cart);

      const orderText = refund.orderId ? ` cho đơn ${refund.orderId}` : "";

      return {
        reply: `Dạ, em đã ghi nhận yêu cầu hoàn tiền ${refund.id}${orderText} ạ. Quán sẽ xác minh và phản hồi mình trong 1–2 ngày làm việc ạ.`,
      };
    }

    // UC28 - khách yêu cầu hoàn tiền
    if (
      message.includes("mình muốn hoàn tiền") ||
      message.includes("cho mình hoàn tiền") ||
      message.includes("yêu cầu hoàn tiền") ||
      message.includes("hoàn tiền lại")
    ) {
      const latestOrder = getLatestOrderByCustomer(customerId);

      if (!latestOrder) {
        return {
          reply: "Dạ, hiện tại mình chưa có đơn nào để hoàn tiền ạ.",
        };
      }

      cart.pendingRefund = true;
      updateCart(customerId, cart);

      return {
        reply: PROMPT_REFUND_REASON,
      };
    }

    // UC23 - xử lý nhập số người + thời gian đặt bàn
    if (cart.pendingReservation) {
      const r = cart.pendingReservation;

      // Giai đoạn 1: chưa có số người
      if (r.people === undefined) {
        const peopleMatch = message.match(/(\d+)\s*(người|ng|khách|p)\b/i);

        if (!peopleMatch) {
          return { reply: "Dạ, mình cho em xin số người ạ." };
        }

        r.people = parseInt(peopleMatch[1], 10);

        // Xoá phần "X người" khỏi message, phần còn lại có thể là thời gian luôn
        const rest = message
          .replace(peopleMatch[0], "")
          .replace(/\s+/g, " ")
          .trim();

        if (rest) {
          r.time = rest;
        }

        cart.pendingReservation = r;
        updateCart(customerId, cart);

        if (r.time === undefined) {
          return { reply: PROMPT_RESERVATION_TIME };
        }
      }

      // Giai đoạn 2: đã có số người, đang chờ thời gian
      if (r.people !== undefined && r.time === undefined) {
        const timeRaw = message.replace(/\s+/g, " ").trim();

        if (!timeRaw) {
          return { reply: PROMPT_RESERVATION_TIME };
        }

        r.time = timeRaw;
      }

      // Đủ cả 2 → tạo RES
      const reservation = createReservation(customerId, r.people!, r.time!);

      cart.pendingReservation = undefined;
      updateCart(customerId, cart);

      return {
        reply: `Dạ, em đã ghi nhận đặt bàn ${reservation.id} cho ${r.people} người vào ${r.time} ạ.`,
      };
    }

    // UC24 - khách hỏi về khuyến mãi
    const promotions = getEffectivePromotions();

    if (
      message.includes("khuyến mãi") ||
      message.includes("khuyến mại") ||
      message.includes("giảm giá") ||
      message.includes("ưu đãi") ||
      message.includes("promo") ||
      promotions.some((p) => p.keywords.some((kw) => message.includes(kw)))
    ) {
      const matchedPromos = promotions.filter((p) =>
        p.keywords.some((kw) => message.includes(kw)),
      );

      // Nếu khớp đúng 1 promo cụ thể → trả về promo đó
      if (matchedPromos.length === 1) {
        const p = matchedPromos[0];

        return {
          reply: `Dạ, Mộc Coffee có chương trình: ${p.name}\n${p.description}\nĐiều kiện: ${p.condition}\nMức giảm: ${p.discount}.`,
        };
      }

      // Còn lại → liệt kê hết
      const promoText = promotions
        .map(
          (p, i) =>
            `${i + 1}. ${p.name}\n   ${p.description}\n   Điều kiện: ${p.condition}`,
        )
        .join("\n\n");

      return {
        reply: `Dạ, Mộc Coffee đang có các chương trình khuyến mãi sau:\n\n${promoText}`,
      };
    }

    // UC39 - owner xem đơn theo status
    const orderFilter =
      message.includes("xem đơn đã huỷ") || message.includes("xem đơn hủy")
        ? "cancelled"
        : message.includes("xem đơn chưa xác nhận")
          ? "pending"
          : message.includes("xem đơn đã xác nhận")
            ? "confirmed"
            : null;

    if (orderFilter) {
      if (!isOwnerOrStaff(customerId)) {
        return {
          reply: OWNER_OR_STAFF_ONLY_REPLY,
        };
      }

      const orders = getAllOrders().filter((o) => o.status === orderFilter);

      const label = formatOrderStatus(orderFilter);

      if (orders.length === 0) {
        return {
          reply: `Dạ, không có đơn ${label} ạ.`,
        };
      }

      const lines = orders.map(
        (o, i) =>
          `${i + 1}. ${o.id} — ${formatPrice(o.total)} — khách ${o.customerId}`,
      );

      return {
        reply: `Dạ, có ${orders.length} đơn ${label}:\n${lines.join("\n")}`,
      };
    }

    // UC39 - owner xem danh sách khách hàng
    if (
      message.includes("xem khách hàng") ||
      message.includes("danh sách khách")
    ) {
      if (!isOwnerOrStaff(customerId)) {
        return {
          reply: OWNER_OR_STAFF_ONLY_REPLY,
        };
      }

      const allCustomers = getAllCustomers();

      if (allCustomers.length === 0) {
        return {
          reply: "Dạ, hiện tại chưa có khách hàng nào ạ.",
        };
      }

      const lines = allCustomers.map((c, i) => {
        return `${i + 1}. ${c.customerId}${formatNameSuffix(c.name)}`;
      });

      return {
        reply: `Dạ, hiện có ${allCustomers.length} khách hàng:\n${lines.join("\n")}`,
      };
    }

    // UC39 - owner xem chi tiết 1 khách
    const viewCustomerMatch = message.match(/^xem khách (\S+)$/i);

    if (viewCustomerMatch) {
      if (!isOwnerOrStaff(customerId)) {
        return {
          reply: OWNER_OR_STAFF_ONLY_REPLY,
        };
      }

      const targetId = viewCustomerMatch[1].trim();

      const allCustomers = getAllCustomers();
      const exists = allCustomers.some((c) => c.customerId === targetId);

      if (!exists) {
        return {
          reply: `Dạ, em không tìm thấy khách "${targetId}" ạ.`,
        };
      }

      const target = getCustomer(targetId);
      const membership = getMembership(targetId);

      const orders = getOrdersByCustomer(targetId).filter(isActiveOrder);

      const totalSpent = sumOrderTotals(orders);

      const nameText = target.name ? target.name : "(chưa đặt tên)";

      return {
        reply: `Dạ, thông tin khách ${targetId}:\nTên: ${nameText}\nHạng: ${formatTier}\nĐiểm: ${membership.points}\nSố đơn: ${orders.length}\nTổng chi tiêu: ${formatPrice(totalSpent)}`,
      };
    }

    // UC40 - owner hỏi doanh thu / số đơn hôm nay
    const asksTodayRevenue = message.includes("doanh thu");
    const asksTodayOrderCount =
      message.includes("bao nhiêu đơn") || message.includes("số đơn hôm nay");

    if (asksTodayRevenue || asksTodayOrderCount) {
      if (!isOwner(customerId)) {
        return {
          reply: OWNER_ONLY_REPLY,
        };
      }

      const today = new Date().toDateString();

      const todayOrders = getAllOrders().filter(
        (o) => new Date(o.createdAt).toDateString() === today,
      );

      const confirmed = todayOrders.filter((o) => o.status === "confirmed");
      const cancelled = todayOrders.filter((o) => o.status === "cancelled");

      if (asksTodayRevenue) {
        const revenue = sumOrderTotals(confirmed);

        return {
          reply: `Dạ, hôm nay Mộc Coffee có ${todayOrders.length} đơn (${confirmed.length} đã xác nhận, ${cancelled.length} đã huỷ).\nDoanh thu: ${formatPrice(revenue)} (chỉ tính đơn đã xác nhận).`,
        };
      }

      return {
        reply: `Dạ, hôm nay có ${todayOrders.length} đơn: ${confirmed.length} đã xác nhận, ${cancelled.length} đã huỷ.`,
      };
    }

    // UC40 - owner hỏi món bán chạy
    if (
      message.includes("món bán chạy") ||
      message.includes("món nào bán chạy") ||
      message.includes("bán chạy nhất") ||
      message.includes("top món")
    ) {
      if (!isOwner(customerId)) {
        return {
          reply: OWNER_ONLY_REPLY,
        };
      }

      const orders = getAllOrders().filter(isActiveOrder);

      const counts = new Map<string, number>();

      for (const order of orders) {
        for (const item of order.items) {
          counts.set(item.name, (counts.get(item.name) ?? 0) + item.quantity);
        }
      }

      if (counts.size === 0) {
        return {
          reply: "Dạ, hiện tại chưa có dữ liệu món bán chạy ạ.",
        };
      }

      const ranked = Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

      const lines = ranked.map(
        ([name, qty], i) => `${i + 1}. ${name} — ${qty} phần`,
      );

      return {
        reply: `Dạ, top ${ranked.length} món bán chạy nhất tại Mộc Coffee:\n\n${lines.join("\n")}`,
      };
    }

    // UC40 - owner hỏi khách mua nhiều nhất
    if (
      message.includes("khách nào mua nhiều") ||
      message.includes("khách mua nhiều nhất") ||
      message.includes("top khách") ||
      message.includes("khách vip")
    ) {
      if (!isOwner(customerId)) {
        return {
          reply: OWNER_ONLY_REPLY,
        };
      }

      const orders = getAllOrders().filter(isActiveOrder);

      const stats = new Map<
        string,
        { orderCount: number; totalSpent: number }
      >();

      for (const order of orders) {
        const current = stats.get(order.customerId) ?? {
          orderCount: 0,
          totalSpent: 0,
        };

        current.orderCount += 1;
        current.totalSpent += order.total;

        stats.set(order.customerId, current);
      }

      if (stats.size === 0) {
        return {
          reply: "Dạ, hiện tại chưa có dữ liệu khách mua hàng ạ.",
        };
      }

      const ranked = Array.from(stats.entries())
        .sort((a, b) => b[1].totalSpent - a[1].totalSpent)
        .slice(0, 3);

      const lines = ranked.map(([cid, s], i) => {
        const name = getCustomer(cid).name;

        return `${i + 1}. ${cid}${formatNameSuffix(name)} — ${s.orderCount} đơn — ${formatPrice(s.totalSpent)}`;
      });

      return {
        reply: `Dạ, top ${ranked.length} khách mua nhiều nhất tại Mộc Coffee:\n\n${lines.join("\n")}`,
      };
    }

    // UC41 - owner phân loại khách hàng
    if (
      message.includes("phân loại khách hàng") ||
      message.includes("phân tích khách hàng") ||
      message.includes("khách hàng có đặc điểm gì")
    ) {
      if (!isOwner(customerId)) {
        return {
          reply: OWNER_ONLY_REPLY,
        };
      }

      const orders = getAllOrders().filter(isActiveOrder);

      const orderCountByCustomer = new Map<string, number>();

      for (const order of orders) {
        orderCountByCustomer.set(
          order.customerId,
          (orderCountByCustomer.get(order.customerId) ?? 0) + 1,
        );
      }

      let newCount = 0;
      let regularCount = 0;
      let vipCount = 0;

      for (const count of orderCountByCustomer.values()) {
        if (count === 1) newCount += 1;
        else if (count >= 2 && count <= 4) regularCount += 1;
        else if (count >= 5) vipCount += 1;
      }

      const totalCustomers = getAllCustomers().length;

      return {
        reply: `Dạ, phân loại khách hàng của Mộc Coffee:\n\n- Khách mới (1 đơn): ${newCount} khách\n- Khách quen (2–4 đơn): ${regularCount} khách\n- Khách VIP (≥ 5 đơn): ${vipCount} khách\n\nTổng: ${totalCustomers} khách hàng.`,
      };
    }

    // UC41 - owner xem phân bố hạng thành viên
    if (
      message.includes("phân bố hạng") ||
      message.includes("thống kê hạng") ||
      message.includes("bao nhiêu khách bronze") ||
      message.includes("bao nhiêu khách silver") ||
      message.includes("bao nhiêu khách gold")
    ) {
      if (!isOwner(customerId)) {
        return {
          reply: OWNER_ONLY_REPLY,
        };
      }

      const allCustomers = getAllCustomers();

      let bronze = 0;
      let silver = 0;
      let gold = 0;

      for (const c of allCustomers) {
        const tier = getMembership(c.customerId).tier;

        if (tier === "bronze") bronze += 1;
        else if (tier === "silver") silver += 1;
        else if (tier === "gold") gold += 1;
      }

      return {
        reply: `Dạ, phân bố hạng thành viên tại Mộc Coffee:\n\n- Bronze: ${bronze} khách\n- Silver: ${silver} khách\n- Gold: ${gold} khách\n\nTổng: ${allCustomers.length} khách hàng.`,
      };
    }

    // UC42 - owner xem phân bố trạng thái đơn
    if (
      message.includes("phân bố đơn hàng") ||
      message.includes("phân bố đơn") ||
      message.includes("thống kê đơn")
    ) {
      if (!isOwner(customerId)) {
        return {
          reply: OWNER_ONLY_REPLY,
        };
      }

      const orders = getAllOrders();

      const pending = orders.filter((o) => o.status === "pending").length;
      const confirmed = orders.filter((o) => o.status === "confirmed").length;
      const cancelled = orders.filter((o) => o.status === "cancelled").length;

      return {
        reply: `Dạ, phân bố đơn hàng tại Mộc Coffee:\n\n- Chưa xác nhận: ${pending} đơn\n- Đã xác nhận: ${confirmed} đơn\n- Đã huỷ: ${cancelled} đơn\n\nTổng: ${orders.length} đơn.`,
      };
    }

    // UC42 - owner xem giá trị đơn trung bình
    if (
      message.includes("giá trị đơn trung bình") ||
      message.includes("đơn trung bình") ||
      message.includes("trung bình đơn") ||
      message.includes("aov")
    ) {
      if (!isOwner(customerId)) {
        return {
          reply: OWNER_ONLY_REPLY,
        };
      }

      const confirmedOrders = getAllOrders().filter(
        (o) => o.status === "confirmed",
      );

      if (confirmedOrders.length === 0) {
        return {
          reply: "Dạ, hiện tại chưa có đơn đã xác nhận nào để tính ạ.",
        };
      }

      const totalRevenue = confirmedOrders.reduce((sum, o) => sum + o.total, 0);

      const avgValue = Math.round(totalRevenue / confirmedOrders.length);

      return {
        reply: `Dạ, giá trị đơn trung bình tại Mộc Coffee:\n\nTổng doanh thu: ${formatPrice(totalRevenue)} (từ ${confirmedOrders.length} đơn đã xác nhận)\nGiá trị đơn trung bình: ${formatPrice(avgValue)}.`,
      };
    }

    // UC43 - owner xem gợi ý chăm sóc khách
    if (
      message.includes("gợi ý chăm sóc khách") ||
      message.includes("chăm sóc khách") ||
      message.includes("khách nào cần chăm sóc")
    ) {
      if (!isOwner(customerId)) {
        return {
          reply: OWNER_ONLY_REPLY,
        };
      }

      const allCustomers = getAllCustomers();
      const today = new Date();
      const oneDayMs = 24 * 60 * 60 * 1000;

      type Candidate = {
        customerId: string;
        name?: string;
        orderCount: number;
        tier: string;
        daysSinceLastOrder: number;
      };

      const candidates: Candidate[] = [];

      for (const c of allCustomers) {
        const orders = getOrdersByCustomer(c.customerId).filter(isActiveOrder);

        if (orders.length === 0) continue;

        const membership = getMembership(c.customerId);

        const isVip = isVipCustomer(orders.length, membership.tier);

        if (!isVip) continue;

        const lastOrderAt = new Date(orders[0].createdAt);
        const daysSinceLastOrder = Math.floor(
          (today.getTime() - lastOrderAt.getTime()) / oneDayMs,
        );

        candidates.push({
          customerId: c.customerId,
          name: c.name,
          orderCount: orders.length,
          tier: membership.tier,
          daysSinceLastOrder,
        });
      }

      if (candidates.length === 0) {
        return {
          reply: "Dạ, hiện tại chưa có khách nào cần chăm sóc đặc biệt ạ.",
        };
      }

      candidates.sort((a, b) => b.daysSinceLastOrder - a.daysSinceLastOrder);

      const top = candidates.slice(0, 5);

      const lines = top.map((c, i) => {
        return `${i + 1}. ${c.customerId}${formatNameSuffix(c.name)}— ${c.orderCount} đơn — ${formatTier} — lần cuối ${c.daysSinceLastOrder} ngày trước`;
      });

      return {
        reply: `Dạ, gợi ý chăm sóc khách hàng:\n\n${lines.join("\n")}\n\nMình có thể gửi ưu đãi hoặc nhắc nhở cho các khách này ạ.`,
      };
    }
    // UC43 - owner xem khách sắp lên hạng
    if (
      message.includes("khách sắp lên hạng") ||
      message.includes("sắp lên hạng") ||
      message.includes("khách gần lên hạng")
    ) {
      if (!isOwner(customerId)) {
        return {
          reply: OWNER_ONLY_REPLY,
        };
      }

      const allCustomers = getAllCustomers();

      type Candidate = {
        customerId: string;
        name?: string;
        tier: string;
        orderCount: number;
        needed: number;
        nextTier: string;
      };

      const candidates: Candidate[] = [];

      for (const c of allCustomers) {
        const membership = getMembership(c.customerId);

        if (membership.tier === "gold") continue;

        const threshold = TIER_UPGRADE_THRESHOLDS[membership.tier];
        if (threshold === undefined) continue;

        const orderCount = getOrdersByCustomer(c.customerId).filter(
          isActiveOrder,
        ).length;

        const needed = threshold - orderCount;

        if (needed === 1) {
          candidates.push({
            customerId: c.customerId,
            name: c.name,
            tier: membership.tier,
            orderCount,
            needed,
            nextTier: getNextTier(membership.tier),
          });
        }
      }

      if (candidates.length === 0) {
        return {
          reply: "Dạ, hiện tại chưa có khách nào sắp lên hạng ạ.",
        };
      }

      candidates.sort((a, b) => b.orderCount - a.orderCount);

      const lines = candidates.map((c, i) => {
        return `${i + 1}. ${c.customerId}${formatNameSuffix(c.name)} — ${formatTier} — ${c.orderCount} đơn — cần ${c.needed} đơn nữa để lên ${c.nextTier}`;
      });

      return {
        reply: `Dạ, khách sắp lên hạng tại Mộc Coffee:\n\n${lines.join("\n")}\n\nMình có thể gửi tin nhắn khích lệ để khách hoàn tất ạ.`,
      };
    }

    // UC44 - owner chạy automation nhắc VIP
    if (
      message.includes("chạy automation nhắc vip") ||
      message.includes("chạy automation remind vip")
    ) {
      if (!isOwner(customerId)) {
        return {
          reply: OWNER_ONLY_REPLY,
        };
      }

      const result = runRemindVipAutomation();

      logAutomation("nhắc VIP", customerId, result);

      return {
        reply: `Dạ, em đã chạy automation 'nhắc VIP' ạ.\n\nKết quả: ${result}`,
      };
    }

    // UC44 - owner xem log automation
    if (
      message.includes("xem log automation") ||
      message.includes("log automation") ||
      message.includes("lịch sử automation")
    ) {
      if (!isOwner(customerId)) {
        return {
          reply: OWNER_ONLY_REPLY,
        };
      }

      const logs = getRecentAutomationLogs(10);

      if (logs.length === 0) {
        return {
          reply: "Dạ, hiện tại chưa có log automation nào ạ.",
        };
      }

      const lines = logs.map((log, i) => {
        const time = formatDateTime(log.createdAt);

        return `${i + 1}. [${time}] ${log.name} — bởi ${log.triggeredBy}\n   Kết quả: ${log.result}`;
      });

      return {
        reply: `Dạ, ${logs.length} lần chạy automation gần nhất:\n\n${lines.join("\n\n")}`,
      };
    }

    // UC25 - set hạng thành viên (dùng cho test)
    const setTierMatch = message.match(
      /^mình hạng (đồng|bạc|vàng|bronze|silver|gold)$/i,
    );

    if (setTierMatch) {
      const raw = setTierMatch[1].toLowerCase();

      const tier =
        raw === "đồng" || raw === "bronze"
          ? "bronze"
          : raw === "bạc" || raw === "silver"
            ? "silver"
            : "gold";

      updateMembership(customerId, { tier });

      return {
        reply: `Dạ, em đã cập nhật hạng của mình thành ${formatTier(tier)} ạ.`,
      };
    }

    // UC25 - set điểm (dùng cho test)
    const setPointsMatch = message.match(/^mình có (\d+) điểm$/i);

    if (setPointsMatch) {
      const points = parseInt(setPointsMatch[1], 10);

      updateMembership(customerId, { points });

      return {
        reply: `Dạ, em đã cập nhật điểm của mình thành ${points} ạ.`,
      };
    }

    // UC33 / UC48 - set role (dùng cho test)
    for (const cmd of ROLE_COMMANDS) {
      if (cmd.regex.test(message)) {
        setRole(customerId, cmd.role);

        return {
          reply: `Dạ, em đã cập nhật vai trò của mình thành ${cmd.label} ạ.`,
        };
      }
    }

    // UC33 - owner hoặc staff xem được tất cả đơn
    if (
      message.includes("xem tất cả đơn") ||
      message.includes("tất cả đơn") ||
      message.includes("danh sách đơn")
    ) {
      if (!isOwnerOrStaff(customerId)) {
        return {
          reply: OWNER_OR_STAFF_ONLY_REPLY,
        };
      }

      const orders = getAllOrders();

      if (orders.length === 0) {
        return {
          reply: "Dạ, hiện tại chưa có đơn nào ạ.",
        };
      }

      const lines = orders.map((o, i) => {
        const statusText = formatOrderStatus(o.status);

        return `${i + 1}. ${o.id} — ${formatPrice(o.total)} — ${statusText} — khách ${o.customerId}`;
      });

      return {
        reply: `Dạ, hiện có ${orders.length} đơn tại Mộc Coffee:\n${lines.join("\n")}`,
      };
    }

    // UC34 / UC35 - owner đổi knowledge
    for (const cmd of KNOWLEDGE_OVERRIDE_COMMANDS) {
      const match = message.match(cmd.regex);

      if (!match) continue;

      if (!isOwner(customerId)) {
        return {
          reply: OWNER_ONLY_REPLY,
        };
      }

      const value = match[1].trim();

      cmd.apply(value);

      return {
        reply: `Dạ, em đã cập nhật ${cmd.label} thành ${value} ạ.`,
      };
    }

    // UC35 - owner xem knowledge hiện tại
    if (
      message.includes("xem knowledge") ||
      message.includes("xem cấu hình") ||
      message.includes("knowledge hiện tại")
    ) {
      if (!isOwner(customerId)) {
        return {
          reply: OWNER_ONLY_REPLY,
        };
      }

      return {
        reply: `Dạ, knowledge hiện tại của Mộc Coffee:

Tên quán: ${coffeeKnowledge.name}
Địa chỉ: ${getEffectiveAddress()}
Giờ mở cửa: ${getEffectiveOpeningHours()}
Số điện thoại: ${getEffectivePhone()}
Wifi: ${getEffectiveWifiName()} / ${getEffectiveWifiPassword()}
Gửi xe: ${getEffectiveParking()}`,
      };
    }

    // UC36 - owner đổi giá món
    const setPriceMatch = message.match(/^đổi giá (.+?) thành (\d+)$/i);

    if (setPriceMatch) {
      if (!isOwner(customerId)) {
        return {
          reply: OWNER_ONLY_REPLY,
        };
      }

      const nameRaw = setPriceMatch[1].trim();
      const price = parseInt(setPriceMatch[2], 10);

      const item = findMenuItemByName(nameRaw, menu);

      if (!item) {
        return {
          reply: notFoundMenuReply(nameRaw),
        };
      }

      setMenuPrice(item.name, price);

      return {
        reply: `Dạ, em đã cập nhật giá ${item.name} thành ${price.toLocaleString("vi-VN")}đ ạ.`,
      };
    }

    // UC36 - owner xem menu đầy đủ
    if (
      message.includes("xem menu") ||
      message.includes("menu hiện tại") ||
      message.includes("menu đầy đủ")
    ) {
      if (!isOwner(customerId)) {
        return {
          reply: OWNER_ONLY_REPLY,
        };
      }
      const menuText = formatMenuText(getEffectiveMenu());

      return {
        reply: `Dạ, menu hiện tại của Mộc Coffee:\n${menuText}`,
      };
    }

    // UC37 - owner đổi discount khuyến mãi
    const setDiscountMatch = message.match(/^đổi giảm giá (.+?) thành (.+)$/i);

    if (setDiscountMatch) {
      if (!isOwner(customerId)) {
        return {
          reply: OWNER_ONLY_REPLY,
        };
      }

      const keyword = setDiscountMatch[1].trim().toLowerCase();
      const newDiscount = setDiscountMatch[2].trim();

      const promo = getEffectivePromotions().find((p) =>
        p.keywords.some(
          (kw) =>
            kw.toLowerCase() === keyword || kw.toLowerCase().includes(keyword),
        ),
      );

      if (!promo) {
        return {
          reply: `Dạ, em không tìm thấy chương trình khuyến mãi "${setDiscountMatch[1].trim()}" ạ.`,
        };
      }

      setPromotionDiscount(promo.id, newDiscount);

      return {
        reply: `Dạ, em đã cập nhật giảm giá ${promo.name} thành ${newDiscount} ạ.`,
      };
    }

    // UC37 - owner xem khuyến mãi
    if (
      message.includes("xem khuyến mãi") ||
      message.includes("xem promo") ||
      message.includes("xem ưu đãi")
    ) {
      if (!isOwner(customerId)) {
        return {
          reply: OWNER_ONLY_REPLY,
        };
      }

      const promotions = getEffectivePromotions();

      const lines = promotions.map(
        (p, i) => `${i + 1}. ${p.name} — Mức giảm: ${p.discount}`,
      );

      return {
        reply: `Dạ, hiện có ${promotions.length} chương trình khuyến mãi:\n${lines.join("\n")}`,
      };
    }

    // UC37 - owner xem chính sách hoàn tiền
    if (
      message.includes("xem chính sách hoàn tiền") ||
      message.includes("xem policy hoàn tiền")
    ) {
      if (!isOwner(customerId)) {
        return {
          reply: OWNER_ONLY_REPLY,
        };
      }

      const conditionsText = coffeeRefundPolicy.conditions
        .map((c) => `- ${c}`)
        .join("\n");

      return {
        reply: `Dạ, chính sách hoàn tiền hiện tại:\n\n${coffeeRefundPolicy.summary}\n\nĐiều kiện:\n${conditionsText}\n\nQuy trình: ${coffeeRefundPolicy.process}\n\nLưu ý: ${coffeeRefundPolicy.note}`,
      };
    }

    // UC38 - owner xem conversation logs
    if (
      message.includes("xem logs") ||
      message.includes("xem log") ||
      message.includes("lịch sử chat") ||
      message.includes("xem conversation")
    ) {
      if (!isOwner(customerId)) {
        return {
          reply: OWNER_ONLY_REPLY,
        };
      }

      const logs = getRecentLogs(10);

      if (logs.length === 0) {
        return {
          reply: "Dạ, hiện tại chưa có log cuộc trò chuyện nào ạ.",
        };
      }

      const lines = logs.map((log, i) => {
        const time = formatDateTime(log.createdAt);

        return `${i + 1}. [${time}] ${log.customerId} (${log.conversationId})\n   Khách: ${log.message}\n   AI: ${log.reply}`;
      });

      return {
        reply: `Dạ, ${logs.length} lượt chat gần nhất:\n\n${lines.join("\n\n")}`,
      };
    }

    // UC25 - khách hỏi hạng / điểm thành viên
    const asksTier =
      message.includes("hạng thành viên") ||
      message.includes("hạng của mình") ||
      (message.includes("hạng") &&
        (message.includes("của mình") || message.includes("membership")));

    const asksPoints =
      message.includes("bao nhiêu điểm") ||
      message.includes("điểm của mình") ||
      message.includes("điểm tích lũy") ||
      message.includes("điểm tích luỹ") ||
      (message.includes("điểm") && message.includes("mình"));

    if (asksTier || asksPoints) {
      const membership = getMembership(customerId);

      if (asksTier) {
        return {
          reply: `Dạ, hiện tại mình đang ở hạng ${formatTier} với ${membership.points} điểm ạ.`,
        };
      }

      return {
        reply: `Dạ, hiện tại mình có ${membership.points} điểm ạ.`,
      };
    }

    // UC26 - khách xem lịch sử mua hàng
    if (
      message.includes("lịch sử mua hàng") ||
      message.includes("lịch sử đơn") ||
      message.includes("mình đã mua gì") ||
      message.includes("đã mua những gì") ||
      message.includes("đơn cũ")
    ) {
      const orders = getOrdersByCustomer(customerId);

      if (orders.length === 0) {
        return {
          reply: "Dạ, mình chưa có đơn nào tại Mộc Coffee ạ.",
        };
      }

      const validOrders = getAllOrders().filter(isActiveOrder);
      const totalSpent = sumOrderTotals(validOrders);

      const latest = orders[0];
      const latestStatus = formatOrderStatus(latest.status);

      return {
        reply: `Dạ, mình đã có ${orders.length} đơn tại Mộc Coffee ạ.\nTổng chi tiêu: ${formatPrice(totalSpent)}.\nĐơn gần nhất: ${latest.id} — ${formatPrice(latest.total)} — ${latestStatus}.\nMình muốn xem chi tiết đơn nào không ạ?`,
      };
    }

    // UC26 - khách hỏi mình là khách quen chưa
    if (
      message.includes("khách quen") ||
      message.includes("khách thân") ||
      message.includes("mình quen chưa") ||
      message.includes("quen chưa")
    ) {
      const orders = getOrdersByCustomer(customerId).filter(isActiveOrder);

      const orderCount = orders.length;

      const membership = getMembership(customerId);

      if (isRegularCustomer(orderCount)) {
        const nameText = customer?.name ? ` ${customer.name}` : "";

        return {
          reply: `Dạ, mình${nameText} đã có ${orderCount} đơn tại Mộc Coffee, nên em xem mình là khách quen ạ. Mình đang ở hạng ${formatTier} với ${membership.points} điểm.`,
        };
      }

      return {
        reply: `Dạ, mình mới có ${orderCount} đơn tại Mộc Coffee ạ. Mình ghé thêm vài lần nữa là thành khách quen của quán rồi ạ.`,
      };
    }

    // UC27 - khách muốn khiếu nại
    if (
      message.includes("khiếu nại") ||
      message.includes("phàn nàn") ||
      message.includes("báo lỗi") ||
      message.includes("có vấn đề")
    ) {
      cart.pendingComplaint = true;
      updateCart(customerId, cart);

      return {
        reply: PROMPT_COMPLAINT_CONTENT,
      };
    }

    // UC28 - khách hỏi chính sách hoàn tiền
    if (
      message.includes("chính sách hoàn tiền") ||
      message.includes("hoàn tiền như thế nào") ||
      message.includes("điều kiện hoàn tiền") ||
      message.includes("quy trình hoàn tiền") ||
      message.includes("hoàn tiền được không")
    ) {
      const conditionsText = coffeeRefundPolicy.conditions
        .map((c) => `- ${c}`)
        .join("\n");

      return {
        reply: `Dạ, ${coffeeRefundPolicy.summary}\n\nĐiều kiện:\n${conditionsText}\n\nQuy trình: ${coffeeRefundPolicy.process}\n\nLưu ý: ${coffeeRefundPolicy.note}`,
      };
    }

    // UC29 - khách muốn gặp nhân viên
    if (
      message.includes("gặp nhân viên") ||
      message.includes("nói chuyện với người") ||
      message.includes("cho mình gặp staff") ||
      message.includes("gọi nhân viên") ||
      message.includes("cần người thật")
    ) {
      const handoff = createHandoff(customerId, conversationId);

      cart.handoffRequested = true;
      cart.handoffId = handoff.id;
      updateCart(customerId, cart);

      return {
        reply:
          "Dạ, em đã ghi nhận và chuyển cho nhân viên ạ. Nhân viên sẽ tiếp nhận trong giây lát ạ.",
      };
    }

    // UC29 - chặn hội thoại khi đã handoff cho nhân viên
    if (cart.handoffRequested) {
      return {
        reply: "Dạ em đã chuyển cho nhân viên rồi ạ, mình chờ chút nhé.",
      };
    }

    // UC22 - khách muốn sửa địa chỉ giao hàng
    if (
      (message.includes("sửa địa chỉ") ||
        message.includes("đổi địa chỉ") ||
        message.includes("địa chỉ giao hàng")) &&
      !message.match(/^đổi địa chỉ thành /i)
    ) {
      const order = getLatestOrderByCustomer(customerId);

      if (!order) {
        return {
          reply: NO_ORDER_REPLY,
        };
      }

      if (order.status === "cancelled") {
        return {
          reply: `Dạ, đơn ${order.id} đã huỷ nên không sửa được ạ.`,
        };
      }

      if (order.fulfillment !== "delivery") {
        return {
          reply: `Dạ, đơn ${order.id} nhận tại quán nên không có địa chỉ giao hàng để sửa ạ.`,
        };
      }

      cart.pendingEditAddressOrderId = order.id;
      updateCart(customerId, cart);

      return {
        reply: "Dạ, mình cho em xin địa chỉ mới ạ.",
      };
    }

    // UC22 - xử lý xác nhận huỷ đơn
    if (cart.pendingCancelOrderId) {
      const order = getOrder(cart.pendingCancelOrderId);

      if (order) {
        const yes = isYes(message);
        const no = isNo(message);
        if (yes) {
          updateOrder(order.id, { status: "cancelled" });

          cart.pendingCancelOrderId = undefined;
          updateCart(customerId, cart);

          return {
            reply: `Dạ, em đã huỷ đơn ${order.id} ạ.`,
          };
        }

        if (no) {
          cart.pendingCancelOrderId = undefined;
          updateCart(customerId, cart);

          return {
            reply: `Dạ, em giữ nguyên đơn ${order.id} ạ.`,
          };
        }

        return {
          reply: `Dạ, mình chắc chắn muốn huỷ đơn ${order.id} chứ ạ? (có / không)`,
        };
      }
    }

    // UC23 - khách muốn đặt bàn
    if (
      message.includes("đặt bàn") ||
      message.includes("giữ bàn") ||
      message.includes("book bàn")
    ) {
      cart.pendingReservation = {};
      updateCart(customerId, cart);

      return {
        reply: "Dạ, mình đặt bàn cho mấy người và vào lúc mấy giờ ạ?",
      };
    }

    // UC20 - xử lý chọn hình thức thanh toán
    if (cart.pendingPaymentOrderId) {
      const order = getOrder(cart.pendingPaymentOrderId);

      if (order) {
        const isCash = /tiền mặt|^cash$|^tm$/i.test(message.trim());
        const isTransfer = /chuyển khoản|^ck$|^bank$|transfer/i.test(
          message.trim(),
        );

        if (isCash) {
          updateOrder(order.id, {
            paymentMethod: "cash",
            status: "confirmed",
          });

          cart.pendingPaymentOrderId = undefined;
          updateCart(customerId, cart);

          return {
            reply: `Dạ, em đã ghi nhận đơn ${order.id} thanh toán tiền mặt ạ. Đơn của mình đã được xác nhận ạ.`,
          };
        }

        if (isTransfer) {
          updateOrder(order.id, {
            paymentMethod: "bank-transfer",
            status: "confirmed",
          });

          cart.pendingPaymentOrderId = undefined;
          updateCart(customerId, cart);

          return {
            reply: `Dạ, em đã ghi nhận đơn ${order.id} thanh toán chuyển khoản ạ. Đơn của mình đã được xác nhận ạ.`,
          };
        }

        return {
          reply: "Dạ, mình muốn thanh toán tiền mặt hay chuyển khoản ạ?",
        };
      }
    }

    // UC17 - khách muốn đặt hàng, in tóm tắt + hỏi xác nhận
    if (
      message.includes("đặt hàng") ||
      message.includes("mình muốn đặt") ||
      message.includes("chốt đơn") ||
      message.includes("xác nhận đặt")
    ) {
      if (cart.items.length === 0) {
        return {
          reply: "Dạ, giỏ hàng của mình đang trống nên chưa đặt được ạ.",
        };
      }

      const { lines, total } = summarizeCart(cart.items, menu);

      cart.awaitingConfirm = true;
      updateCart(customerId, cart);

      return {
        reply: `Dạ, đơn của mình hiện tại:\n\n${lines.join("\n")}\n\nTổng cộng: ${formatPrice(total)} ạ.\n\nMình xác nhận đặt đơn này chứ ạ?`,
      };
    }

    if (
      message.includes("giỏ hàng") &&
      (message.includes("có gì") ||
        message.includes("gồm gì") ||
        message.includes("xem"))
    ) {
      if (cart.items.length === 0) {
        return {
          reply: "Dạ, hiện tại giỏ hàng của mình đang trống ạ.",
        };
      }

      const cartText = cart.items
        .map((item) =>
          item.note
            ? `${item.quantity} × ${item.name} (${item.note})`
            : `${item.quantity} × ${item.name}`,
        )
        .join("\n");

      return {
        reply: `Dạ, giỏ hàng của mình hiện có:\n${cartText}`,
      };
    }

    if (
      (message.includes("xoá") ||
        message.includes("xóa") ||
        message.includes("clear")) &&
      (message.includes("hết") ||
        message.includes("tất cả") ||
        message.includes("sạch"))
    ) {
      if (cart.items.length === 0) {
        return {
          reply: "Dạ, giỏ hàng của mình đang trống sẵn rồi ạ.",
        };
      }

      cart.items = [];
      updateCart(customerId, cart);

      return {
        reply: "Dạ, em đã xoá sạch giỏ hàng ạ.",
      };
    }
    if (
      message.includes("tính tiền") ||
      message.includes("tổng tiền") ||
      message.includes("hoá đơn") ||
      message.includes("hóa đơn") ||
      message.includes("bao nhiêu tiền") ||
      message.includes("đơn mình")
    ) {
      if (cart.items.length === 0) {
        return {
          reply: "Dạ, giỏ hàng của mình đang trống nên chưa có gì để tính ạ.",
        };
      }

      const { lines, total } = summarizeCart(cart.items, menu);

      const summary = lines.join("\n");

      return {
        reply: `Dạ, đơn của mình hiện tại:\n\n${summary}\n\nTổng cộng: ${formatPrice(total)} ạ.`,
      };
    }

    const removeMatch = message.match(/^(xoá|xóa|bỏ|remove)\s+(.+)$/i);

    if (removeMatch) {
      const item = findMenuItemByName(removeMatch[2].trim(), menu);

      if (!item) {
        return {
         reply: notFoundMenuReply(removeMatch[2].trim()),
        };
      }

      const existingIndex = cart.items.findIndex((i) => i.name === item.name);

      if (existingIndex === -1) {
        return {
          reply: notInCartReply(item.name),
        };
      }

      cart.items.splice(existingIndex, 1);
      updateCart(customerId, cart);

      return {
        reply: `Dạ, em đã xoá ${item.name} khỏi giỏ hàng ạ.`,
      };
    }

    const updateMatch = message.match(/^(sửa|đổi)\s+(.+?)\s+thành\s+(\d+)$/i);

    const setMatch = message.match(/^(.+?)\s+còn\s+(\d+)$/i);

    const editTarget = updateMatch
      ? {
          nameRaw: updateMatch[2].trim(),
          quantity: parseInt(updateMatch[3], 10),
        }
      : setMatch
        ? { nameRaw: setMatch[1].trim(), quantity: parseInt(setMatch[2], 10) }
        : null;

    if (editTarget) {
      const item = findMenuItemByName(editTarget.nameRaw, menu);

      if (!item) {
        return {
          reply: notFoundMenuReply(editTarget.nameRaw),
        };
      }

      const existingIndex = cart.items.findIndex((i) => i.name === item.name);

      if (existingIndex === -1) {
        return {
          reply: notInCartReply(item.name),
        };
      }

      if (editTarget.quantity <= 0) {
        cart.items.splice(existingIndex, 1);
        updateCart(customerId, cart);

        return {
          reply: `Dạ, em đã xoá ${item.name} khỏi giỏ hàng ạ.`,
        };
      }

      cart.items[existingIndex].quantity = editTarget.quantity;
      updateCart(customerId, cart);

      return {
        reply: `Dạ, em đã cập nhật ${item.name} thành ${editTarget.quantity} ạ.`,
      };
    }

    let rawMessage = message;
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
    if (quantityMatch) {
      const quantity = parseInt(quantityMatch[1], 10);
      const item = findMenuItemByName(quantityMatch[2].trim(), menu);

      if (item) {
        const existingItem = cart.items.find(
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
          cart.items.push({
            name: item.name,
            quantity,
            note,
          });
        }

        updateCart(customerId, cart);
        return {
          reply: `Dạ, em đã thêm ${quantity} ${item.name} vào giỏ hàng ạ.`,
        };
      }
    }

    if (message.startsWith("mình tên ")) {
      const name = message.replace("mình tên ", "").trim();

      updateCustomer(customerId, {
        name,
      });

      return {
        reply: `Dạ, em nhớ rồi ạ. Em chào ${name}!`,
      };
    }

    if (
      message.includes("nhớ tên mình") ||
      message.includes("tên mình là gì") ||
      message.includes("tên tôi là gì")
    ) {
      if (customer?.name) {
        return {
          reply: `Dạ nhớ chứ ạ, mình tên ${customer.name}.`,
        };
      }

      return {
        reply: "Dạ, hiện tại em chưa biết tên của mình ạ.",
      };
    }
    const history = getConversation(conversationId);
    if (message === "nhẹ thôi" && history.length > 0) {
      const previousMessage = history[history.length - 1];

      if (previousMessage.includes("trà")) {
        return {
          reply: "Dạ, nếu mình muốn trà nhẹ thì em gợi ý Trà đào ạ.",
        };
      }

      return {
        reply: "Dạ, nếu mình muốn cà phê nhẹ thì em gợi ý Bạc xỉu ạ.",
      };
    }
    addMessage(conversationId, message);

    if (
      message.includes("xin chào") ||
      message === "chào" ||
      message === "hello" ||
      message === "hi"
    ) {
      return {
        reply: "Dạ em chào anh/chị ạ! Em có thể giúp gì cho mình?",
      };
    }

    if (
      message.includes("menu") ||
      message.includes("thực đơn") ||
      message.includes("đồ uống") ||
      message.includes("có những món gì")
    ) {
      return {
        reply: `Dạ, menu của Mộc Coffee hiện có:\n${formatMenuText(menu)}`,
      };
    }

    if (message.includes("ở đâu") || message.includes("địa chỉ")) {
      return {
        reply: `Dạ, Mộc Coffee ở ${getEffectiveAddress()} ạ.`,
      };
    }

    if (
      message.includes("mở cửa") ||
      message.includes("giờ mở cửa") ||
      message.includes("mấy giờ")
    ) {
      return {
        reply: `Dạ, Mộc Coffee mở cửa ${getEffectiveOpeningHours()} ạ.`,
      };
    }

    if (message.includes("wifi")) {
      return {
        reply: `Dạ, WiFi của quán là ${getEffectiveWifiName()}, mật khẩu là ${getEffectiveWifiPassword()} ạ.`,
      };
    }

    if (
      message.includes("đậu xe") ||
      message.includes("đỗ xe") ||
      message.includes("gửi xe")
    ) {
      return {
        reply: `Dạ, ${getEffectiveParking()}`,
      };
    }

    if (message.includes("số điện thoại") || message.includes("số điện")) {
      return {
        reply: `Dạ, số điện thoại của Mộc Coffee là ${getEffectivePhone()} ạ.`,
      };
    }

    const priceQuestion =
      message.includes("bao nhiêu") ||
      message.includes("giá") ||
      message.includes("bao tiền");

    if (priceQuestion) {
      const item = menu.find((item) =>
        message.includes(item.name.toLowerCase()),
      );

      if (item) {
        return {
          reply: `Dạ, ${item.name} giá ${item.price.toLocaleString("vi-VN")}đ ạ.`,
        };
      }

      return {
        reply: "Dạ, em chưa tìm thấy món này trong menu ạ.",
      };
    }

    const detailQuestion =
      message.includes("có gì") ||
      message.includes("thành phần") ||
      message.includes("gồm gì") ||
      message.includes("vị gì") ||
      message.includes("như thế nào");

    if (detailQuestion) {
      const item = menu.find((item) =>
        message.includes(item.name.toLowerCase()),
      );

      if (item) {
        return {
          reply: `Dạ, ${item.name}: ${item.description}`,
        };
      }

      return {
        reply: "Dạ, em chưa tìm thấy món này trong menu ạ.",
      };
    }

    const recommendationKeywords = [
      "thích cà phê",
      "không thích cà phê đắng",
      "không thích đắng",
      "thích sữa",
      "thích ngọt",
      "thích trà",
      "thích trái cây",
      "thích thanh mát",
      "thích matcha",
    ];

    const matchedNeeds = recommendationKeywords.filter((keyword) =>
      message.includes(keyword),
    );

    if (matchedNeeds.length > 0) {
      const recommendations = menu.filter((item) =>
        matchedNeeds.some((need) => item.suitableFor.includes(need)),
      );

      if (recommendations.length > 0) {
        const recommendationText = recommendations
          .map((item) => `${item.name}: ${item.description}`)
          .join("\n");

        return {
          reply: `Dạ, dựa theo nhu cầu của mình, em gợi ý:\n${recommendationText}`,
        };
      }
    }
    const compareQuestion =
      message.includes("khác nhau") ||
      message.includes("so sánh") ||
      message.includes("khác gì") ||
      message.includes("nên chọn");

    if (compareQuestion) {
      const mentionedItems = menu.filter((item) =>
        message.includes(item.name.toLowerCase()),
      );

      if (mentionedItems.length >= 2) {
        const [first, second] = mentionedItems;

        return {
          reply:
            `Dạ, ${first.name} có vị cà phê ${first.profile.coffeeLevel}, ` +
            `độ ngọt ${first.profile.sweetness}, lượng sữa ${first.profile.milkLevel}. ` +
            `${second.name} có vị cà phê ${second.profile.coffeeLevel}, ` +
            `độ ngọt ${second.profile.sweetness}, lượng sữa ${second.profile.milkLevel}.`,
        };
      }

      return {
        reply: "Dạ, anh/chị cho em biết 2 món mình muốn so sánh ạ.",
      };
    }

    const unclearQuestion =
      message === "uống gì" ||
      message === "ăn gì" ||
      message === "chọn gì" ||
      message.includes("gợi ý") ||
      message.includes("tư vấn") ||
      message.includes("muốn uống gì đó") ||
      message.includes("muốn uống gì");

    if (unclearQuestion) {
      return {
        reply:
          "Dạ, anh/chị thích cà phê, trà hay đồ uống ngọt ạ? Em có thể tư vấn món phù hợp cho mình.",
      };
    }
    const faq = coffeeFaq
      .map((item) => {
        const stopWords = ["quán", "có", "không"];

        const questionWords = item.question
          .toLowerCase()
          .split(/\s+/)
          .filter((word) => word.length > 2 && !stopWords.includes(word));
        const matchedWords = questionWords.filter((word) =>
          message.includes(word),
        );

        return {
          item,
          score: matchedWords.length,
        };
      })
      .filter((result) => result.score >= 2)
      .sort((a, b) => b.score - a.score)[0];

    if (faq) {
      return {
        reply: faq.item.answer,
      };
    }
    return {
      reply: "Dạ, em chưa có thông tin này ạ.",
    };
  }
}
