import { isOwner } from "../common/access";
import { OWNER_ONLY_REPLY } from "../common/messages";
import { formatMenuText, findMenuItemByName } from "../common/menu";
import { coffeeKnowledge } from "../knowledge/coffee.knowledge";
import {
  getEffectiveOpeningHours,
  getEffectivePhone,
  getEffectiveAddress,
  getEffectiveWifiName,
  getEffectiveWifiPassword,
  getEffectiveParking,
  KNOWLEDGE_OVERRIDE_COMMANDS,
} from "../knowledge/knowledge.override.memory";
import {
  getEffectiveMenu,
  setMenuPrice,
} from "../knowledge/menu.override.memory";
import {
  getEffectivePromotions,
  setPromotionDiscount,
} from "../knowledge/promotion.override.memory";
import type { SkillContext, SkillResult } from "./types";

export function tryKnowledgeOverrideCommand(
  ctx: SkillContext,
): SkillResult | null {
  for (const cmd of KNOWLEDGE_OVERRIDE_COMMANDS) {
    const match = ctx.message.match(cmd.regex);
    if (!match) continue;

    if (!isOwner(ctx.customerId)) return { reply: OWNER_ONLY_REPLY };

    const value = match[1].trim();
    cmd.apply(value);

    return { reply: `Dạ, em đã cập nhật ${cmd.label} thành ${value} ạ.` };
  }

  return null;
}

export function tryViewKnowledge(ctx: SkillContext): SkillResult | null {
  const m = ctx.message;

  if (
    !m.includes("xem knowledge") &&
    !m.includes("xem cấu hình") &&
    !m.includes("knowledge hiện tại")
  ) {
    return null;
  }

  if (!isOwner(ctx.customerId)) return { reply: OWNER_ONLY_REPLY };

  return {
    reply: `Dạ, knowledge hiện tại của Mộc Coffee:

Tên quán: ${coffeeKnowledge.name}
Địa chỉ: ${getEffectiveAddress() ?? "(chưa có)"}
Giờ mở cửa: ${getEffectiveOpeningHours() ?? "(chưa có)"}
Số điện thoại: ${getEffectivePhone() ?? "(chưa có)"}
Wifi: ${getEffectiveWifiName() ?? "(chưa có)"} / ${getEffectiveWifiPassword() ?? "(chưa có)"}
Gửi xe: ${getEffectiveParking() ?? "(chưa có)"}`,
  };
}

export function trySetPrice(ctx: SkillContext): SkillResult | null {
  const setPriceMatch = ctx.message.match(/^đổi giá (.+?) thành (\d+)$/i);
  if (!setPriceMatch) return null;

  if (!isOwner(ctx.customerId)) return { reply: OWNER_ONLY_REPLY };

  const nameRaw = setPriceMatch[1].trim();
  const price = parseInt(setPriceMatch[2], 10);

  const item = findMenuItemByName(nameRaw, ctx.menu);

  if (!item) {
    return { reply: `Dạ, em không tìm thấy món "${nameRaw}" trong menu ạ.` };
  }

  setMenuPrice(item.name, price);

  return {
    reply: `Dạ, em đã cập nhật giá ${item.name} thành ${price.toLocaleString("vi-VN")}đ ạ.`,
  };
}

export function tryViewMenu(ctx: SkillContext): SkillResult | null {
  const m = ctx.message;

  if (
    !m.includes("xem menu") &&
    !m.includes("menu hiện tại") &&
    !m.includes("menu đầy đủ")
  ) {
    return null;
  }

  if (!isOwner(ctx.customerId)) return { reply: OWNER_ONLY_REPLY };

  return {
    reply: `Dạ, menu hiện tại của Mộc Coffee:\n${formatMenuText(getEffectiveMenu())}`,
  };
}

export function trySetDiscount(ctx: SkillContext): SkillResult | null {
  const setDiscountMatch = ctx.message.match(
    /^đổi giảm giá (.+?) thành (.+)$/i,
  );
  if (!setDiscountMatch) return null;

  if (!isOwner(ctx.customerId)) return { reply: OWNER_ONLY_REPLY };

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

export function tryViewPromotions(ctx: SkillContext): SkillResult | null {
  const m = ctx.message;

  if (
    !m.includes("xem khuyến mãi") &&
    !m.includes("xem promo") &&
    !m.includes("xem ưu đãi")
  ) {
    return null;
  }

  if (!isOwner(ctx.customerId)) return { reply: OWNER_ONLY_REPLY };

  const promotions = ctx.promotions;

  if (promotions.length === 0) {
    return { reply: "Dạ, hiện tại chưa có chương trình khuyến mãi nào ạ." };
  }

  const lines = promotions.map(
    (p, i) =>
      `${i + 1}. ${p.name} — Mức giảm: ${p.discount} — ${p.status === "active" ? "đang áp dụng" : "ngừng áp dụng"}`,
  );

  return {
    reply: `Dạ, hiện có ${promotions.length} chương trình khuyến mãi:\n${lines.join("\n")}`,
  };
}

export function tryViewRefundPolicy(ctx: SkillContext): SkillResult | null {
  const m = ctx.message;

  if (
    !m.includes("xem chính sách hoàn tiền") &&
    !m.includes("xem policy hoàn tiền")
  ) {
    return null;
  }

  if (!isOwner(ctx.customerId)) return { reply: OWNER_ONLY_REPLY };

  const policy = ctx.policies.refund;

  if (!policy) {
    return { reply: "Dạ, hiện tại chưa có chính sách hoàn tiền ạ." };
  }

  return { reply: `Dạ, chính sách hoàn tiền hiện tại:\n\n${policy}` };
}
