import { getConversation } from "../memory/chat.memory";
import { updateCustomer } from "../memory/customer.memory";
import { findProductByName } from "../common/menu";
import type {
  BrainEntities,
  ProductServiceItem,
  SkillContext,
  SkillResult,
} from "./types";

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
    return {
      reply:
        `Dạ, **${ctx.business.name}** có chương trình **${p.name}**\n\n` +
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

  return {
    reply: `Dạ, **${ctx.business.name}** đang có các chương trình khuyến mãi sau:\n\n${promoText}`,
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

export function tryGreeting(
  ctx: SkillContext,
  entities?: BrainEntities,
): SkillResult | null {
  // Nếu được gọi từ Brain → LLM đã xác nhận là greeting → bypass regex guard
  const invokedByBrain = entities !== undefined;

  if (!invokedByBrain) {
    const m = ctx.message;
    const isGreeting =
      m === "chào" || m === "hi" || m === "hello" || m.includes("xin chào");
    if (!isGreeting) return null;
  }

  const aiName = ctx.aiConfig.name;
  const greeting = aiName
    ? `${aiName} xin chào ạ, em có thể giúp gì cho mình ạ?`
    : "Dạ em chào anh/chị ạ! Em có thể giúp gì cho mình?";

  return { reply: greeting };
}

export function tryMenuView(
  ctx: SkillContext,
  entities?: BrainEntities,
): SkillResult | null {
  const invokedByBrain = entities !== undefined;

  if (!invokedByBrain) {
    const m = ctx.message;
    if (
      !m.includes("menu") &&
      !m.includes("thực đơn") &&
      !m.includes("đồ uống") &&
      !m.includes("có những món gì")
    ) {
      return null;
    }
  }

  const businessName = ctx.business.name || "doanh nghiệp";
  const productTerm = ctx.business.terminology.productTerm || "sản phẩm";

  if (ctx.products.length === 0) {
    return {
      reply: `Dạ, ${businessName} hiện chưa có ${productTerm} nào ạ.`,
    };
  }

  const activeProducts = ctx.products.filter((p) => p.status === "active");
  const lines = activeProducts
    .map((p) => `- **${p.name}**: ${p.price.toLocaleString("vi-VN")}đ`)
    .join("\n");

  return {
    reply: `Dạ, ${productTerm} của **${businessName}** hiện có:\n\n${lines}`,
  };
}

export function tryAddress(ctx: SkillContext): SkillResult | null {
  const m = ctx.message;
  if (!m.includes("ở đâu") && !m.includes("địa chỉ")) return null;

  const address = ctx.business.address;
  if (!address) return { reply: "Dạ, em chưa có thông tin địa chỉ ạ." };

  return { reply: `Dạ, **${ctx.business.name}** ở ${address} ạ.` };
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

  const name = ctx.business.name;
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

  const hours = ctx.business.openingHours;
  if (!hours) return { reply: "Dạ, em chưa có thông tin giờ mở cửa ạ." };

  return { reply: `Dạ, **${ctx.business.name}** mở cửa ${hours} ạ.` };
}

export function tryWifi(ctx: SkillContext): SkillResult | null {
  if (!ctx.message.includes("wifi")) return null;

  const { wifiName, wifiPassword } = ctx.business;
  if (!wifiName || !wifiPassword) {
    return { reply: "Dạ, em chưa có thông tin wifi ạ." };
  }

  return {
    reply: `Dạ, WiFi của quán là ${wifiName}, mật khẩu là ${wifiPassword} ạ.`,
  };
}

export function tryPhone(ctx: SkillContext): SkillResult | null {
  const m = ctx.message;
  if (!m.includes("số điện thoại") && !m.includes("số điện")) return null;

  const phone = ctx.business.phone;
  if (!phone) return { reply: "Dạ, em chưa có thông tin số điện thoại ạ." };

  return {
    reply: `Dạ, số điện thoại của **${ctx.business.name}** là ${phone} ạ.`,
  };
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
  if (
    !m.includes("bao nhiêu") &&
    !m.includes("giá") &&
    !m.includes("bao tiền")
  ) {
    return null;
  }

  const product = ctx.products.find((p) => m.includes(p.name.toLowerCase()));

  if (product) {
    return {
      reply: `Dạ, **${product.name}** giá ${product.price.toLocaleString("vi-VN")}đ ạ.`,
    };
  }

  return { reply: "Dạ, em chưa tìm thấy sản phẩm này trong danh sách ạ." };
}

export function tryDetailQuestion(
  ctx: SkillContext,
  entities?: BrainEntities,
): SkillResult | null {
  const invokedByBrain = entities !== undefined;

  // ===== Brain path — dùng entities.item =====
  if (invokedByBrain) {
    const itemName =
      typeof entities.item === "string" ? entities.item.trim() : "";

    if (!itemName) return null;

    const product = findProductByName(ctx.products, itemName);

    if (!product) {
      return {
        reply: `Dạ, em chưa có thông tin về "${itemName}" ạ.`,
      };
    }

    return { reply: formatProductDetail(product) };
  }

  // ===== Regex path — match tên product trong message =====
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

  const product = ctx.products.find((p) => m.includes(p.name.toLowerCase()));

  if (!product) return null;

  return { reply: formatProductDetail(product) };
}

function formatProductDetail(product: ProductServiceItem): string {
  const parts: string[] = [`Dạ, **${product.name}**:`];

  if (product.description) {
    parts.push("", product.description);
  }

  const attrs = product.attributes as Record<string, unknown> | null;
  if (attrs && Object.keys(attrs).length > 0) {
    const lines = Object.entries(attrs)
      .filter(([, v]) => v !== undefined && v !== null && v !== "")
      .map(([k, v]) => {
        const value = Array.isArray(v) ? v.join(", ") : String(v);
        return `- ${k}: ${value}`;
      });

    if (lines.length > 0) {
      parts.push("", "**Chi tiết:**", ...lines);
    }
  }

  if (parts.length === 1) {
    return `Dạ, em chưa có thông tin chi tiết về **${product.name}** ạ.`;
  }

  return parts.join("\n");
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

export function tryRecommendation(
  ctx: SkillContext,
  entities?: BrainEntities,
): SkillResult | null {
  const invokedByBrain = entities !== undefined;

  // ===== Brain path — đọc DB products =====
  if (invokedByBrain) {
    const positive = extractStringArray(entities.positivePreferences);
    const negative = extractStringArray(entities.negativePreferences);

    if (positive.length === 0 && negative.length === 0) {
      return null; // không extract được preference → fall through
    }

    const matched = ctx.products.filter((p) => {
      const attrs = (p.attributes ?? {}) as Record<string, unknown>;
      const suitable = toStringArray(attrs.suitableFor);
      const notSuitable = toStringArray(attrs.notSuitableFor);

      // Exclude nếu negative match notSuitableFor
      const hasNeg = negative.some((n) =>
        notSuitable.some((ns) => tagMatches(ns, n)),
      );
      if (hasNeg) return false;

      // Include nếu positive match suitableFor
      const hasPos = positive.some((pr) =>
        suitable.some((s) => tagMatches(s, pr)),
      );
      return hasPos;
    });

    if (matched.length === 0) {
      return {
        reply:
          "Dạ, em chưa tìm được sản phẩm/dịch vụ phù hợp với sở thích của mình ạ.",
      };
    }

    const lines = matched
      .map((p) => `- **${p.name}**: ${p.description}`)
      .join("\n");

    return {
      reply: `Dạ, dựa theo nhu cầu của mình, em gợi ý:\n\n${lines}`,
    };
  }

  // ===== Regex path (legacy — fallback khi LLM off) =====
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

  const recommendations = ctx.products.filter((p) => {
    const attrs = (p.attributes ?? {}) as Record<string, unknown>;
    const suitable = Array.isArray(attrs.suitableFor)
      ? (attrs.suitableFor as string[])
      : [];
    return matchedNeeds.some((need) => suitable.includes(need));
  });

  if (recommendations.length === 0) return null;

  const recommendationText = recommendations
    .map((item) => `- **${item.name}**: ${item.description}`)
    .join("\n");

  return {
    reply: `Dạ, dựa theo nhu cầu của mình, em gợi ý:\n\n${recommendationText}`,
  };
}

function extractStringArray(v: unknown): string[] {
  if (typeof v === "string") {
    return v
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (Array.isArray(v)) {
    return v.filter(
      (x): x is string => typeof x === "string" && x.trim().length > 0,
    );
  }
  return [];
}

function toStringArray(v: unknown): string[] {
  if (Array.isArray(v)) {
    return v.filter((x): x is string => typeof x === "string");
  }
  return [];
}

function tagMatches(a: string, b: string): boolean {
  const na = normalizeForMatch(a);
  const nb = normalizeForMatch(b);
  if (!na || !nb) return false;
  return na === nb || na.includes(nb) || nb.includes(na);
}

export function tryCompare(
  ctx: SkillContext,
  entities?: BrainEntities,
): SkillResult | null {
  const invokedByBrain = entities !== undefined;

  if (!invokedByBrain) {
    const m = ctx.message;
    if (
      !m.includes("khác nhau") &&
      !m.includes("so sánh") &&
      !m.includes("khác gì") &&
      !m.includes("nên chọn")
    ) {
      return null;
    }
  }

  const message = ctx.message;

  // Tìm products + vị trí xuất hiện trong message
  const mentioned = ctx.products
    .map((p) => ({
      product: p,
      index: message.indexOf(p.name.toLowerCase()),
    }))
    .filter((x) => x.index !== -1)
    .sort((a, b) => a.index - b.index);

  if (mentioned.length < 2) {
    return {
      reply: "Dạ, anh/chị cho em biết 2 sản phẩm/dịch vụ mình muốn so sánh ạ.",
    };
  }

  const [first, second] = mentioned.slice(0, 2).map((x) => x.product);

  return {
    reply: buildCompareReply(first, second),
  };
}

function buildCompareReply(
  first: {
    name: string;
    description: string;
    price: number;
    attributes: Record<string, unknown> | null;
  },
  second: {
    name: string;
    description: string;
    price: number;
    attributes: Record<string, unknown> | null;
  },
): string {
  const firstAttrs = first.attributes ?? {};
  const secondAttrs = second.attributes ?? {};

  // Union keys, bỏ suitableFor/notSuitableFor
  const allKeys = Array.from(
    new Set([...Object.keys(firstAttrs), ...Object.keys(secondAttrs)]),
  ).filter((k) => k !== "suitableFor" && k !== "notSuitableFor");

  const formatPrice = (n: number) => n.toLocaleString("vi-VN") + "đ";
  const formatVal = (v: unknown) =>
    v === undefined ? "—" : Array.isArray(v) ? v.join(", ") : String(v);

  const lines: string[] = [];
  lines.push(`Dạ, so sánh **${first.name}** và **${second.name}**:`);
  lines.push("");
  lines.push(`**${first.name}** — ${formatPrice(first.price)}`);
  if (first.description) {
    lines.push(""); // ← blank line
    lines.push(`_${first.description}_`);
  }
  for (const key of allKeys) {
    lines.push(`- ${key}: ${formatVal(firstAttrs[key])}`);
  }

  lines.push("");
  lines.push(`**${second.name}** — ${formatPrice(second.price)}`);
  if (second.description) {
    lines.push("");
    lines.push(`_${second.description}_`);
  }
  for (const key of allKeys) {
    lines.push(`- ${key}: ${formatVal(secondAttrs[key])}`);
  }

  return lines.join("\n");
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

export function tryPolicyQuery(
  ctx: SkillContext,
  entities?: BrainEntities,
): SkillResult | null {
  const invokedByBrain = entities !== undefined;

  if (!invokedByBrain) {
    const m = ctx.message;
    if (!m.includes("chính sách") && !m.includes("policy")) return null;
  }

  if (ctx.policies.length === 0) {
    return { reply: "Dạ, hiện tại chưa có chính sách nào ạ." };
  }

  const m = ctx.message;
  const matched = ctx.policies
    .map((p) => {
      const titleWords = p.title
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 2);
      const score = titleWords.filter((w) => m.includes(w)).length;
      return { policy: p, score };
    })
    .filter((r) => r.score >= 2)
    .sort((a, b) => b.score - a.score)[0];

  if (matched) {
    return {
      reply: `**${matched.policy.title}**\n\n${matched.policy.content}`,
    };
  }

  const list = ctx.policies.map((p) => `- **${p.title}**`).join("\n");
  return {
    reply: `Dạ, hiện có các chính sách sau:\n\n${list}\n\nMình muốn hỏi chính sách nào ạ?`,
  };
}

export function tryFallback(_ctx: SkillContext): SkillResult {
  return { reply: "Dạ, em chưa có thông tin này ạ." };
}
