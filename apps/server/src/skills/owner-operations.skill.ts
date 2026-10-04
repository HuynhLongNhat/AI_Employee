import { isOwner, isOwnerOrStaff } from "../common/access";
import {
  formatPrice,
  formatTier,
  formatOrderStatus,
  formatNameSuffix,
  formatDateTime,
} from "../common/format";
import {
  OWNER_ONLY_REPLY,
  OWNER_OR_STAFF_ONLY_REPLY,
} from "../common/messages";
import {
  isVipCustomer,
  TIER_UPGRADE_THRESHOLDS,
  getNextTier,
} from "../knowledge/coffee.rules";
import { getAllCustomers, getCustomer } from "../memory/customer.memory";
import { getMembership, updateMembership } from "../memory/membership.memory";
import {
  getAllOrders,
  getOrdersByCustomer,
  sumOrderTotals,
  isActiveOrder,
} from "../memory/order.memory";
import { setRole, ROLE_COMMANDS } from "../memory/role.memory";
import { getRecentLogs } from "../memory/conversation.log.memory";
import type { SkillContext, SkillResult } from "./types";

export function tryViewAllOrders(ctx: SkillContext): SkillResult | null {
  const m = ctx.message;

  if (!m.includes("xem tất cả đơn") && !m.includes("tất cả đơn") && !m.includes("danh sách đơn")) {
    return null;
  }

  if (!isOwnerOrStaff(ctx.customerId)) return { reply: OWNER_OR_STAFF_ONLY_REPLY };

  const orders = getAllOrders();

  if (orders.length === 0) return { reply: "Dạ, hiện tại chưa có đơn nào ạ." };

  const lines = orders.map((o, i) => {
    const statusText = formatOrderStatus(o.status);
    return `${i + 1}. ${o.id} — ${formatPrice(o.total)} — ${statusText} — khách ${o.customerId}`;
  });

  return { reply: `Dạ, hiện có ${orders.length} đơn tại Mộc Coffee:\n${lines.join("\n")}` };
}

export function tryOrderFilter(ctx: SkillContext): SkillResult | null {
  const m = ctx.message;

  const orderFilter =
    m.includes("xem đơn đã huỷ") || m.includes("xem đơn hủy")
      ? "cancelled"
      : m.includes("xem đơn chưa xác nhận")
        ? "pending"
        : m.includes("xem đơn đã xác nhận")
          ? "confirmed"
          : null;

  if (!orderFilter) return null;

  if (!isOwnerOrStaff(ctx.customerId)) return { reply: OWNER_OR_STAFF_ONLY_REPLY };

  const orders = getAllOrders().filter((o) => o.status === orderFilter);
  const label = formatOrderStatus(orderFilter);

  if (orders.length === 0) {
    return { reply: `Dạ, không có đơn ${label} ạ.` };
  }

  const lines = orders.map((o, i) => `${i + 1}. ${o.id} — ${formatPrice(o.total)} — khách ${o.customerId}`);

  return { reply: `Dạ, có ${orders.length} đơn ${label}:\n${lines.join("\n")}` };
}

export function tryCustomerList(ctx: SkillContext): SkillResult | null {
  const m = ctx.message;

  if (!m.includes("xem khách hàng") && !m.includes("danh sách khách")) return null;

  if (!isOwnerOrStaff(ctx.customerId)) return { reply: OWNER_OR_STAFF_ONLY_REPLY };

  const allCustomers = getAllCustomers();

  if (allCustomers.length === 0) return { reply: "Dạ, hiện tại chưa có khách hàng nào ạ." };

  const lines = allCustomers.map((c, i) => `${i + 1}. ${c.customerId}${formatNameSuffix(c.name)}`);

  return { reply: `Dạ, hiện có ${allCustomers.length} khách hàng:\n${lines.join("\n")}` };
}

export function tryCustomerDetail(ctx: SkillContext): SkillResult | null {
  const viewCustomerMatch = ctx.message.match(/^xem khách (\S+)$/i);
  if (!viewCustomerMatch) return null;

  if (!isOwnerOrStaff(ctx.customerId)) return { reply: OWNER_OR_STAFF_ONLY_REPLY };

  const targetId = viewCustomerMatch[1].trim();
  const allCustomers = getAllCustomers();
  const exists = allCustomers.some((c) => c.customerId === targetId);

  if (!exists) {
    return { reply: `Dạ, em không tìm thấy khách "${targetId}" ạ.` };
  }

  const target = getCustomer(targetId);
  const membership = getMembership(targetId);
  const orders = getOrdersByCustomer(targetId).filter(isActiveOrder);

  const totalSpent = sumOrderTotals(orders);
  const tierText = formatTier(membership.tier);
  const nameText = target.name ? target.name : "(chưa đặt tên)";

  return {
    reply: `Dạ, thông tin khách ${targetId}:\nTên: ${nameText}\nHạng: ${tierText}\nĐiểm: ${membership.points}\nSố đơn: ${orders.length}\nTổng chi tiêu: ${formatPrice(totalSpent)}`,
  };
}

export function tryRevenue(ctx: SkillContext): SkillResult | null {
  const m = ctx.message;

  const asksTodayRevenue = m.includes("doanh thu");
  const asksTodayOrderCount = m.includes("bao nhiêu đơn") || m.includes("số đơn hôm nay");

  if (!asksTodayRevenue && !asksTodayOrderCount) return null;

  if (!isOwner(ctx.customerId)) return { reply: OWNER_ONLY_REPLY };

  const today = new Date().toDateString();
  const todayOrders = getAllOrders().filter((o) => new Date(o.createdAt).toDateString() === today);
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

export function tryBestSeller(ctx: SkillContext): SkillResult | null {
  const m = ctx.message;

  if (!m.includes("món bán chạy") && !m.includes("món nào bán chạy") && !m.includes("bán chạy nhất") && !m.includes("top món")) {
    return null;
  }

  if (!isOwner(ctx.customerId)) return { reply: OWNER_ONLY_REPLY };

  const orders = getAllOrders().filter(isActiveOrder);
  const counts = new Map<string, number>();

  for (const order of orders) {
    for (const item of order.items) {
      counts.set(item.name, (counts.get(item.name) ?? 0) + item.quantity);
    }
  }

  if (counts.size === 0) return { reply: "Dạ, hiện tại chưa có dữ liệu món bán chạy ạ." };

  const ranked = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const lines = ranked.map(([name, qty], i) => `${i + 1}. ${name} — ${qty} phần`);

  return { reply: `Dạ, top ${ranked.length} món bán chạy nhất tại Mộc Coffee:\n\n${lines.join("\n")}` };
}

export function tryTopCustomers(ctx: SkillContext): SkillResult | null {
  const m = ctx.message;

  if (!m.includes("khách nào mua nhiều") && !m.includes("khách mua nhiều nhất") && !m.includes("top khách") && !m.includes("khách vip")) {
    return null;
  }

  if (!isOwner(ctx.customerId)) return { reply: OWNER_ONLY_REPLY };

  const orders = getAllOrders().filter(isActiveOrder);
  const stats = new Map<string, { orderCount: number; totalSpent: number }>();

  for (const order of orders) {
    const current = stats.get(order.customerId) ?? { orderCount: 0, totalSpent: 0 };
    current.orderCount += 1;
    current.totalSpent += order.total;
    stats.set(order.customerId, current);
  }

  if (stats.size === 0) return { reply: "Dạ, hiện tại chưa có dữ liệu khách mua hàng ạ." };

  const ranked = Array.from(stats.entries()).sort((a, b) => b[1].totalSpent - a[1].totalSpent).slice(0, 3);

  const lines = ranked.map(([cid, s], i) => {
    const name = getCustomer(cid).name;
    return `${i + 1}. ${cid}${formatNameSuffix(name)} — ${s.orderCount} đơn — ${formatPrice(s.totalSpent)}`;
  });

  return { reply: `Dạ, top ${ranked.length} khách mua nhiều nhất tại Mộc Coffee:\n\n${lines.join("\n")}` };
}

export function tryClassification(ctx: SkillContext): SkillResult | null {
  const m = ctx.message;

  if (!m.includes("phân loại khách hàng") && !m.includes("phân tích khách hàng") && !m.includes("khách hàng có đặc điểm gì")) {
    return null;
  }

  if (!isOwner(ctx.customerId)) return { reply: OWNER_ONLY_REPLY };

  const orders = getAllOrders().filter(isActiveOrder);
  const orderCountByCustomer = new Map<string, number>();

  for (const order of orders) {
    orderCountByCustomer.set(order.customerId, (orderCountByCustomer.get(order.customerId) ?? 0) + 1);
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

export function tryTierDistribution(ctx: SkillContext): SkillResult | null {
  const m = ctx.message;

  if (
    !m.includes("phân bố hạng") &&
    !m.includes("thống kê hạng") &&
    !m.includes("bao nhiêu khách bronze") &&
    !m.includes("bao nhiêu khách silver") &&
    !m.includes("bao nhiêu khách gold")
  ) {
    return null;
  }

  if (!isOwner(ctx.customerId)) return { reply: OWNER_ONLY_REPLY };

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

export function tryOrderDistribution(ctx: SkillContext): SkillResult | null {
  const m = ctx.message;

  if (!m.includes("phân bố đơn hàng") && !m.includes("phân bố đơn") && !m.includes("thống kê đơn")) {
    return null;
  }

  if (!isOwner(ctx.customerId)) return { reply: OWNER_ONLY_REPLY };

  const orders = getAllOrders();
  const pending = orders.filter((o) => o.status === "pending").length;
  const confirmed = orders.filter((o) => o.status === "confirmed").length;
  const cancelled = orders.filter((o) => o.status === "cancelled").length;

  return {
    reply: `Dạ, phân bố đơn hàng tại Mộc Coffee:\n\n- Chưa xác nhận: ${pending} đơn\n- Đã xác nhận: ${confirmed} đơn\n- Đã huỷ: ${cancelled} đơn\n\nTổng: ${orders.length} đơn.`,
  };
}

export function tryAov(ctx: SkillContext): SkillResult | null {
  const m = ctx.message;

  if (!m.includes("giá trị đơn trung bình") && !m.includes("đơn trung bình") && !m.includes("trung bình đơn") && !m.includes("aov")) {
    return null;
  }

  if (!isOwner(ctx.customerId)) return { reply: OWNER_ONLY_REPLY };

  const confirmedOrders = getAllOrders().filter((o) => o.status === "confirmed");

  if (confirmedOrders.length === 0) {
    return { reply: "Dạ, hiện tại chưa có đơn đã xác nhận nào để tính ạ." };
  }

  const totalRevenue = sumOrderTotals(confirmedOrders);
  const avgValue = Math.round(totalRevenue / confirmedOrders.length);

  return {
    reply: `Dạ, giá trị đơn trung bình tại Mộc Coffee:\n\nTổng doanh thu: ${formatPrice(totalRevenue)} (từ ${confirmedOrders.length} đơn đã xác nhận)\nGiá trị đơn trung bình: ${formatPrice(avgValue)}.`,
  };
}

export function tryCareSuggestions(ctx: SkillContext): SkillResult | null {
  const m = ctx.message;

  if (!m.includes("gợi ý chăm sóc khách") && !m.includes("chăm sóc khách") && !m.includes("khách nào cần chăm sóc")) {
    return null;
  }

  if (!isOwner(ctx.customerId)) return { reply: OWNER_ONLY_REPLY };

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
    if (!isVipCustomer(orders.length, membership.tier)) continue;

    const lastOrderAt = new Date(orders[0].createdAt);
    const daysSinceLastOrder = Math.floor((today.getTime() - lastOrderAt.getTime()) / oneDayMs);

    candidates.push({
      customerId: c.customerId,
      name: c.name,
      orderCount: orders.length,
      tier: membership.tier,
      daysSinceLastOrder,
    });
  }

  if (candidates.length === 0) {
    return { reply: "Dạ, hiện tại chưa có khách nào cần chăm sóc đặc biệt ạ." };
  }

  candidates.sort((a, b) => b.daysSinceLastOrder - a.daysSinceLastOrder);
  const top = candidates.slice(0, 5);

  const lines = top.map((c, i) => {
    const tierText = formatTier(c.tier as "bronze" | "silver" | "gold");
    return `${i + 1}. ${c.customerId}${formatNameSuffix(c.name)} — ${c.orderCount} đơn — ${tierText} — lần cuối ${c.daysSinceLastOrder} ngày trước`;
  });

  return {
    reply: `Dạ, gợi ý chăm sóc khách hàng:\n\n${lines.join("\n")}\n\nMình có thể gửi ưu đãi hoặc nhắc nhở cho các khách này ạ.`,
  };
}

export function tryTierUpgrade(ctx: SkillContext): SkillResult | null {
  const m = ctx.message;

  if (!m.includes("khách sắp lên hạng") && !m.includes("sắp lên hạng") && !m.includes("khách gần lên hạng")) {
    return null;
  }

  if (!isOwner(ctx.customerId)) return { reply: OWNER_ONLY_REPLY };

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

    const orderCount = getOrdersByCustomer(c.customerId).filter(isActiveOrder).length;
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
    return { reply: "Dạ, hiện tại chưa có khách nào sắp lên hạng ạ." };
  }

  candidates.sort((a, b) => b.orderCount - a.orderCount);

  const lines = candidates.map((c, i) => {
    const tierText = formatTier(c.tier as "bronze" | "silver" | "gold");
    return `${i + 1}. ${c.customerId}${formatNameSuffix(c.name)} — ${tierText} — ${c.orderCount} đơn — cần ${c.needed} đơn nữa để lên ${c.nextTier}`;
  });

  return {
    reply: `Dạ, khách sắp lên hạng tại Mộc Coffee:\n\n${lines.join("\n")}\n\nMình có thể gửi tin nhắn khích lệ để khách hoàn tất ạ.`,
  };
}

export function tryViewLogs(ctx: SkillContext): SkillResult | null {
  const m = ctx.message;

  if (!m.includes("xem logs") && !m.includes("xem log") && !m.includes("lịch sử chat") && !m.includes("xem conversation")) {
    return null;
  }

  if (!isOwner(ctx.customerId)) return { reply: OWNER_ONLY_REPLY };

  const logs = getRecentLogs(10);

  if (logs.length === 0) return { reply: "Dạ, hiện tại chưa có log cuộc trò chuyện nào ạ." };

  const lines = logs.map((log, i) => {
    const time = formatDateTime(log.createdAt);
    return `${i + 1}. [${time}] ${log.customerId} (${log.conversationId})\n   Khách: ${log.message}\n   AI: ${log.reply}`;
  });

  return { reply: `Dạ, ${logs.length} lượt chat gần nhất:\n\n${lines.join("\n\n")}` };
}

export function trySetTier(ctx: SkillContext): SkillResult | null {
  const setTierMatch = ctx.message.match(/^mình hạng (đồng|bạc|vàng|bronze|silver|gold)$/i);
  if (!setTierMatch) return null;

  const raw = setTierMatch[1].toLowerCase();

  const tier =
    raw === "đồng" || raw === "bronze"
      ? "bronze"
      : raw === "bạc" || raw === "silver"
        ? "silver"
        : "gold";

  updateMembership(ctx.customerId, { tier });

  return { reply: `Dạ, em đã cập nhật hạng của mình thành ${formatTier(tier)} ạ.` };
}

export function trySetPoints(ctx: SkillContext): SkillResult | null {
  const setPointsMatch = ctx.message.match(/^mình có (\d+) điểm$/i);
  if (!setPointsMatch) return null;

  const points = parseInt(setPointsMatch[1], 10);
  updateMembership(ctx.customerId, { points });

  return { reply: `Dạ, em đã cập nhật điểm của mình thành ${points} ạ.` };
}

export function tryRoleCommand(ctx: SkillContext): SkillResult | null {
  for (const cmd of ROLE_COMMANDS) {
    if (cmd.regex.test(ctx.message)) {
      setRole(ctx.customerId, cmd.role);
      return { reply: `Dạ, em đã cập nhật vai trò của mình thành ${cmd.label} ạ.` };
    }
  }
  return null;
}