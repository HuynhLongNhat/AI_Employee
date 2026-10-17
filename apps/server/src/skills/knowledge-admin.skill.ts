import { isOwner } from "../common/access";
import { OWNER_ONLY_REPLY } from "../common/messages";
import {
  getEffectivePromotions,
  setPromotionDiscount,
} from "../knowledge/promotion.override.memory";
import type { SkillContext, SkillResult } from "./types";

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
   reply: `Dạ, knowledge hiện tại của **${ctx.business.name}**:

Địa chỉ: ${ctx.business.address || "(chưa có)"}
Giờ mở cửa: ${ctx.business.openingHours || "(chưa có)"}
Số điện thoại: ${ctx.business.phone || "(chưa có)"}
Wifi: ${ctx.business.wifiName || "(chưa có)"} / ${ctx.business.wifiPassword || "(chưa có)"}`,
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

export function tryViewRefundPolicy(
  ctx: SkillContext,
): SkillResult | null {
  const m = ctx.message;

  if (
    !m.includes("xem chính sách hoàn tiền") &&
    !m.includes("xem policy hoàn tiền")
  ) {
    return null;
  }

  if (!isOwner(ctx.customerId)) return { reply: OWNER_ONLY_REPLY };

  const matched = ctx.policies.find((p) =>
    p.title.toLowerCase().includes("hoàn tiền"),
  );

  if (!matched) {
    return { reply: "Dạ, hiện tại chưa có chính sách hoàn tiền ạ." };
  }

  return {
    reply: `**${matched.title}**\n\n${matched.content}`,
  };
}
