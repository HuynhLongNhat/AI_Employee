import { getConversation } from "../memory/chat.memory";
import { updateCustomer } from "../memory/customer.memory";
import {
  getEffectiveAddress,
  getEffectiveOpeningHours,
  getEffectivePhone,
  getEffectiveWifiName,
  getEffectiveWifiPassword,
  getEffectiveParking,
  getEffectiveBusinessName, 
} from "../knowledge/knowledge.override.memory";
import { formatMenuText, findProductByName } from "../common/menu";
import type { BrainEntities, SkillContext, SkillResult } from "./types";

export function tryPromotions(
  ctx: SkillContext,
  entities?: BrainEntities,
): SkillResult | null {
  // Khi được gọi qua Brain/Intent → đã biết user hỏi promotion → bypass guard
  const invokedByBrain = entities !== undefined;

  if (!invokedByBrain) {
    // Legacy regex guard — chỉ khi được gọi từ beforeAddMessage
    if (
      !ctx.message.includes("khuyến mãi") &&
      !ctx.message.includes("khuyến mại") &&
      !ctx.message.includes("giảm giá") &&
      !ctx.message.includes("ưu đãi") &&
      !ctx.message.includes("promo")
    ) {
      return null;
    }
  }

  const promotions = ctx.promotions;
  const matchedPromos = promotions.filter((p) =>
    p.keywords.some((kw) => ctx.message.includes(kw.toLowerCase())),
  );

  if (promotions.length === 0) {
    return {
      reply: "Dạ, hiện tại quán chưa có chương trình khuyến mãi nào ạ.",
    };
  }

  if (matchedPromos.length === 1) {
    const p = matchedPromos[0];
    const name = getEffectiveBusinessName() ?? "quán";
    return {
      reply:
        `Dạ, **${name}** có chương trình **${p.name}**\n\n` +
        `- **Mức giảm:** ${p.discount}\n` +
        `- **Điều kiện:** ${p.condition}\n` +
        `- ${p.description}`,
    };
  }

  const promoText = promotions
    .map(
      (p, i) =>
        `**${i + 1}. ${p.name}**\n` +
        `- Mức giảm: ${p.discount}\n` +
        `- Điều kiện: ${p.condition}\n` +
        `- ${p.description}`,
    )
    .join("\n\n");

  const name = getEffectiveBusinessName() ?? "quán";
  return {
    reply: `Dạ, **${name}** đang có các chương trình khuyến mãi sau:\n\n${promoText}`,
  };
}

export function trySetName(ctx: SkillContext): SkillResult | null {
  if (!ctx.message.startsWith("mình tên ")) return null;

  const name = ctx.message.replace("mình tên ", "").trim();
  updateCustomer(ctx.customerId, { name });

  return { reply: `Dạ, em nhớ rồi ạ. Em chào ${name}!` };
}

export function tryRecallName(ctx: SkillContext): SkillResult | null {
  const m = ctx.message;

  if (
    !m.includes("nhớ tên mình") &&
    !m.includes("tên mình là gì") &&
    !m.includes("tên tôi là gì")
  ) {
    return null;
  }

  if (ctx.customer?.name) {
    return { reply: `Dạ nhớ chứ ạ, mình tên ${ctx.customer.name}.` };
  }

  return { reply: "Dạ, hiện tại em chưa biết tên của mình ạ." };
}

export function tryShortContext(ctx: SkillContext): SkillResult | null {
  const history = getConversation(ctx.conversationId);

  if (ctx.message !== "nhẹ thôi" || history.length === 0) return null;

  const previousMessage = history[history.length - 1];

  if (previousMessage.includes("trà")) {
    return { reply: "Dạ, nếu mình muốn trà nhẹ thì em gợi ý Trà đào ạ." };
  }

  return { reply: "Dạ, nếu mình muốn cà phê nhẹ thì em gợi ý Bạc xỉu ạ." };
}

export function tryGreeting(ctx: SkillContext): SkillResult | null {
  const m = ctx.message;
  if (!m.includes("xin chào") && m !== "chào" && m !== "hello" && m !== "hi") {
    return null;
  }

  const name = ctx.aiConfig.name;
  const greeting = name
    ? `Dạ em là ${name}, em có thể giúp gì cho mình ạ?`
    : "Dạ em chào anh/chị ạ! Em có thể giúp gì cho mình?";

  return { reply: greeting };
}

export function tryMenuView(ctx: SkillContext): SkillResult | null {
  const m = ctx.message;
  if (
    !m.includes("menu") &&
    !m.includes("thực đơn") &&
    !m.includes("đồ uống") &&
    !m.includes("có những món gì")
  ) {
    return null;
  }
const name = getEffectiveBusinessName() ?? "quán";
  const menuText = ctx.menu
    .map((item) => `- **${item.name}**: ${item.price.toLocaleString("vi-VN")}đ`)
    .join("\n");
  return { reply: `Dạ, menu của **${name}** hiện có:\n\n${menuText}` };
}

export function tryAddress(ctx: SkillContext): SkillResult | null {
  const m = ctx.message;
  if (!m.includes("ở đâu") && !m.includes("địa chỉ")) return null;

  const address = getEffectiveAddress();
  if (address === null) {
    return { reply: "Dạ, em chưa có thông tin địa chỉ quán ạ." };
  }

  const name = getEffectiveBusinessName() ?? "quán";
  return { reply: `Dạ, ${name} ở ${address} ạ.` };
}

export function tryBusinessName(ctx: SkillContext): SkillResult | null {
  const m = ctx.message;
  if (
    !m.includes("tên quán") &&
    !m.includes("quán mình tên") &&
    !m.includes("quán tên gì") &&
    !m.includes("tên của quán")
  ) {
    return null;
  }

  const name = getEffectiveBusinessName();
  if (name === null) {
    return { reply: "Dạ, em chưa có thông tin tên quán ạ." };
  }

  return { reply: `Dạ, quán mình tên là ${name} ạ.` };
}

export function tryOpeningHours(ctx: SkillContext): SkillResult | null {
  const m = ctx.message;
  if (
    !m.includes("mở cửa") &&
    !m.includes("giờ mở cửa") &&
    !m.includes("mấy giờ")
  )
    return null; 
 
  const name = getEffectiveBusinessName();

  const hours = getEffectiveOpeningHours();
  if (hours === null) {
    return { reply: "Dạ, em chưa có thông tin giờ mở cửa ạ." };
  }
  return { reply: `Dạ, **${name}** mở cửa ${hours} ạ.` };
}

export function tryWifi(ctx: SkillContext): SkillResult | null {
  if (!ctx.message.includes("wifi")) return null;

  const wifiName = getEffectiveWifiName();
  const wifiPassword = getEffectiveWifiPassword();

  if (wifiName === null || wifiPassword === null) {
    return { reply: "Dạ, em chưa có thông tin wifi của quán ạ." };
  }

  return {
    reply: `Dạ, WiFi của quán là ${wifiName}, mật khẩu là ${wifiPassword} ạ.`,
  };
}

export function tryParking(ctx: SkillContext): SkillResult | null {
  const m = ctx.message;
  if (!m.includes("đậu xe") && !m.includes("đỗ xe") && !m.includes("gửi xe"))
    return null;

  const parking = getEffectiveParking();
  if (parking === null) {
    return { reply: "Dạ, em chưa có thông tin gửi xe của quán ạ." };
  }
  return { reply: `Dạ, ${parking}` };
}

export function tryPhone(ctx: SkillContext): SkillResult | null {
  const m = ctx.message;
  if (!m.includes("số điện thoại") && !m.includes("số điện")) return null;

  const phone = getEffectivePhone();
  if (phone === null) {
    return { reply: "Dạ, em chưa có thông tin số điện thoại quán ạ." };
  }

  const name = getEffectiveBusinessName() ?? "quán";
  return { reply: `Dạ, số điện thoại của ${name} là ${phone} ạ.` };
}

export function tryProductPrice(
  ctx: SkillContext,
  entities?: BrainEntities,
): SkillResult | null {
  // ===== Brain path =====
  if (entities && typeof entities.item === "string" && entities.item.trim()) {
    const itemName = entities.item.trim();
    const product = findProductByName(ctx.products, itemName);

    if (!product) {
      return {
        reply: `Dạ, em chưa có thông tin giá của "${itemName}" ạ.`,
      };
    }

    return {
      reply: `Dạ, ${product.name} giá ${product.price.toLocaleString("vi-VN")}đ ạ.`,
    };
  }

  // ===== Regex fallback =====
  const m = ctx.message;
  if (
    !m.includes("bao nhiêu") &&
    !m.includes("giá") &&
    !m.includes("bao tiền")
  ) {
    return null;
  }

  const product = ctx.products.find((p) => m.includes(p.name.toLowerCase()));
  if (!product) return null;

  return {
    reply: `Dạ, ${product.name} giá ${product.price.toLocaleString("vi-VN")}đ ạ.`,
  };
}

function normalizeForMatch(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

export function tryPriceQuestion(ctx: SkillContext): SkillResult | null {
  const m = ctx.message;

  if (!m.includes("bao nhiêu") && !m.includes("giá") && !m.includes("bao tiền"))
    return null;

  const item = ctx.menu.find((item) => m.includes(item.name.toLowerCase()));

  if (item) {
    return {
      reply: `Dạ, ${item.name} giá ${item.price.toLocaleString("vi-VN")}đ ạ.`,
    };
  }

  return { reply: "Dạ, em chưa tìm thấy món này trong menu ạ." };
}

export function tryDetailQuestion(ctx: SkillContext): SkillResult | null {
  const m = ctx.message;

  if (
    !m.includes("có gì") &&
    !m.includes("thành phần") &&
    !m.includes("gồm gì") &&
    !m.includes("vị gì") &&
    !m.includes("như thế nào")
  ) {
    return null;
  }

  const item = ctx.menu.find((item) => m.includes(item.name.toLowerCase()));

  if (item) {
    return { reply: `Dạ, ${item.name}: ${item.description}` };
  }

  return { reply: "Dạ, em chưa tìm thấy món này trong menu ạ." };
}

const RECOMMENDATION_KEYWORDS = [
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

export function tryRecommendation(ctx: SkillContext): SkillResult | null {
  const normalizedMessage = ctx.message
    .replace(/thích uống đồ ngọt/g, "thích ngọt")
    .replace(/thích đồ ngọt/g, "thích ngọt")
    .replace(/thích uống ngọt/g, "thích ngọt");

  let matchedNeeds = RECOMMENDATION_KEYWORDS.filter((keyword) =>
    normalizedMessage.includes(keyword),
  );

  if (normalizedMessage.includes("không thích cà phê")) {
    matchedNeeds = matchedNeeds.filter((k) => k !== "thích cà phê");
  }

  if (matchedNeeds.length === 0) return null;

  const recommendations = ctx.menu.filter((item) =>
    matchedNeeds.some((need) => item.suitableFor.includes(need)),
  );

  if (recommendations.length === 0) return null;

  const recommendationText = recommendations
    .map((item) => `${item.name}: ${item.description}`)
    .join("\n");

  return {
    reply: `Dạ, dựa theo nhu cầu của mình, em gợi ý:\n${recommendationText}`,
  };
}

export function tryCompare(ctx: SkillContext): SkillResult | null {
  const m = ctx.message;

  if (
    !m.includes("khác nhau") &&
    !m.includes("so sánh") &&
    !m.includes("khác gì") &&
    !m.includes("nên chọn")
  ) {
    return null;
  }

  const mentionedItems = ctx.menu.filter((item) =>
    m.includes(item.name.toLowerCase()),
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

  return { reply: "Dạ, anh/chị cho em biết 2 món mình muốn so sánh ạ." };
}

export function tryUnclear(ctx: SkillContext): SkillResult | null {
  const m = ctx.message;

  if (
    m !== "uống gì" &&
    m !== "ăn gì" &&
    m !== "chọn gì" &&
    !m.includes("gợi ý") &&
    !m.includes("tư vấn") &&
    !m.includes("muốn uống gì đó") &&
    !m.includes("muốn uống gì")
  ) {
    return null;
  }

  return {
    reply:
      "Dạ, anh/chị thích cà phê, trà hay đồ uống ngọt ạ? Em có thể tư vấn món phù hợp cho mình.",
  };
}

export function tryFaq(ctx: SkillContext): SkillResult | null {
  const m = ctx.message;

  if (ctx.faqs.length === 0) return null;

  const matched = ctx.faqs
    .map((item) => {
      const stopWords = ["quán", "có", "không"];
      const questionWords = item.question
        .toLowerCase()
        .split(/\s+/)
        .filter((word) => word.length > 2 && !stopWords.includes(word));
      const matchedWords = questionWords.filter((word) => m.includes(word));
      return { item, score: matchedWords.length };
    })
    .filter((result) => result.score >= 2)
    .sort((a, b) => b.score - a.score)[0];

  if (!matched) return null;

  return { reply: matched.item.answer };
}

export function tryRefundPolicyQuery(ctx: SkillContext): SkillResult | null {
  const m = ctx.message;

  if (
    !m.includes("chính sách hoàn tiền") &&
    !m.includes("hoàn tiền như thế nào") &&
    !m.includes("điều kiện hoàn tiền") &&
    !m.includes("quy trình hoàn tiền") &&
    !m.includes("hoàn tiền được không")
  ) {
    return null;
  }

  const policy = ctx.policies.refund;

  if (!policy) {
    return { reply: "Dạ, em chưa có thông tin chính sách hoàn tiền ạ." };
  }

  return { reply: `Dạ, ${policy}` };
}

export function tryFallback(_ctx: SkillContext): SkillResult {
  return { reply: "Dạ, em chưa có thông tin này ạ." };
}
