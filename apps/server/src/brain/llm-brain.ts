// LlmBrain — implementation của Brain interface sử dụng LlmProvider.
//
// Nguyên tắc:
// - Chỉ hiểu message và trả BrainOutput.
// - KHÔNG gọi Skill, KHÔNG gọi Tool, KHÔNG đọc Knowledge/Memory.
// - KHÔNG sửa Cart/Order, KHÔNG xử lý Business Rule.
// - KHÔNG throw ra ngoài — mọi lỗi provider/parse đều fallback.

import type {
  Brain,
  BrainInput,
  BrainOutput,
  EntityValue,
} from "./brain.contract";
import type { LlmProvider } from "./llm-provider.contract";
import { INTENTS } from "./intent-catalog";

const INTENT_SET: Set<string> = new Set(INTENTS.map((i) => i as string));

const FALLBACK: BrainOutput = {
  intent: "chat.unknown",
  entities: {},
  confidence: 0,
};

export class LlmBrain implements Brain {
  constructor(private readonly provider: LlmProvider) {}

  async interpret(input: BrainInput): Promise<BrainOutput> {
    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(input);

    let text: string;
    try {
      const out = await this.provider.generate({ systemPrompt, userPrompt });
      text = out.text;
    } catch (err) {
      console.error("[LlmBrain] provider error:", err);
      return FALLBACK;
    }

    const result = parseBrainOutput(text);
    console.log("[LlmBrain] msg:", input.message);
    console.log("[LlmBrain] raw:", text);
    console.log("[LlmBrain] parsed:", JSON.stringify(result));
    return result;
  }
}

function buildSystemPrompt(): string {
  return [
    "You are an intent classifier for a Vietnamese business AI assistant.",
    "Your ONLY job: read the user message and reply with JSON describing the user's intent.",
    "You MUST reply with valid JSON only. No markdown, no explanation, no code fence.",
    "",
    "JSON schema:",
    '{"intent": "<intent-code>", "entities": {}, "confidence": <0..1>}',
    "",
    "Allowed intent codes:",
    INTENTS.join(", "),
    "",
    "Intent-specific entity hints:",
    "",
    "- cart.add_item → { item: string, quantity: number, note?: string }",
    "  ONLY use when user EXPLICITLY names a product/service they want to order.",
    '  The "item" value MUST be one of the product names from "knownProducts".',
    "  Map typo, abbreviation, or accentless input to the correct product name.",
    "  Do NOT infer item from user preference/need. If user only describes what they want (không có tên sản phẩm) → use chat.recommend instead.",
    "  Examples:",
    '    "cho mình 2 cf sữa" → {"item": "cà phê sữa", "quantity": 2}',
    '    "mình muốn 1 trà đào" → {"item": "trà đào", "quantity": 1}',
    '    "Mình muốn tập gym tăng cơ" → NOT cart.add_item (no product name) → use chat.recommend',
    "- promotion.query → {}",
    "  User asks about promotions, discounts, or special offers.",
    '  Trigger words: "khuyến mãi", "giảm giá", "ưu đãi", "promo", "sinh nhật", "happy hour", "học sinh", "sinh viên".',
    "- chat.ask_price → { item?: string }",
    "  User asks for the price of a specific product/service.",
    "  Works for any industry: món, dịch vụ, gói tập, liệu trình, sản phẩm.",
    '  Example: "cà phê sữa bao nhiêu tiền" → {"item": "cà phê sữa"}',
    "",
    "- chat.faq → {}",
    "  User asks a general FAQ question about the shop/services that is NOT covered by specific shop.* intents.",
    "  Trigger patterns (Vietnamese):",
    '    "shop có X không", "quán có X không", "có nhận X không", "có hỗ trợ X không"',
    "    where X is a feature/service: giao hàng, máy lạnh, mang đồ ăn ngoài, đặt trước, chỗ đậu xe, thanh toán thẻ, ship, ...",
    "  DO NOT use chat.faq for: address, opening hours, phone, wifi, menu, price. Those have specific intents (shop.address, shop.opening_hours, shop.phone, shop.wifi, chat.view_menu, chat.ask_price).",
    "  Examples:",
    '    "shop có giao hàng không" → chat.faq',
    '    "quán có máy lạnh không" → chat.faq',
    '    "có nhận đặt trước không" → chat.faq',
    '    "shop ở đâu" → shop.address (NOT chat.faq)',
    "- chat.recommend → { positivePreferences?: string, negativePreferences?: string }",
    "  User DESCRIBES a need/preference/mood WITHOUT naming a specific product.",
    '  Trigger: "muốn ...", "thích ...", "cần ...", "đang tìm ...", "tư vấn ..."',
    "  Examples:",
    '    "Mình thích uống gì đó ngọt ngọt, không thích cà phê đắng" → {"positivePreferences": "ngọt", "negativePreferences": "cà phê đắng"}',
    '    "Mình muốn tập gym tăng cơ" → {"positivePreferences": "tập gym, tăng cơ", "negativePreferences": ""}',
    '    "Có gì thư giãn không?" → {"positivePreferences": "thư giãn", "negativePreferences": ""}',
    "- shop.name → {} — user hỏi tên quán",
    '  Example: "quán mình tên gì" → {}',
    "",
    "- shop.address → {} — user hỏi địa chỉ",
    '  Example: "quán mình ở đâu" → {}',
    "",
    "- chat.compare → { items: [string, string] }",
    "  User asks to compare 2 products/services.",
    "  Extract the 2 product names from user message (exact names from knownProducts).",
    '  Example: "so sánh cà phê sữa và bạc xỉu" → {"items": ["cà phê sữa", "bạc xỉu"]}',
    "- shop.opening_hours → {} — user hỏi giờ mở cửa",
    '  Example: "mấy giờ mở cửa" → {}',
    "",
    "- shop.phone → {} — user hỏi số điện thoại",
    "- shop.wifi → {} — user hỏi wifi / mật khẩu wifi",
    "",
    "- cart.total → {} — CHỈ khi user hỏi TỔNG giỏ hàng, KHÔNG phải giá 1 món",
    '  Keywords: "tính tiền", "tổng tiền", "hoá đơn", "đơn mình"',
    '  KHÔNG dùng cart.total cho "quán mình tên gì" / "ở đâu" / "mấy giờ".',
    "",
    "- chat.ask_item_detail → { item: string }",
    "  User asks for details / ingredients / characteristics of a product/service.",
    '  The "item" value MUST be one of the product names from "knownProducts".',
    "  Map typo, abbreviation, or accentless input to the correct product name.",
    "  Examples:",
    '    "cà phê sữa có vị như thế nào" → {"item": "cà phê sữa"}',
    '    "massage đá nóng có gì" → {"item": "Massage đá nóng"}',
    '    "gói giảm cân gồm gì" → {"item": "Gói giảm cân 3 tháng"}',
    "- chat.view_menu → {}",
    "  User asks to see the list of products/services offered by the business.",
    "  Vocabulary varies by industry:",
    "    Coffee: menu, thực đơn, đồ uống, có món gì, xem menu",
    "    Gym: có gói tập nào, có dịch vụ gì, các gói tập, danh sách gói",
    "    Spa: có dịch vụ gì, có liệu trình nào, các dịch vụ",
    "    Retail: có sản phẩm gì, xem hàng, có gì bán",
    "  → All map to intent = chat.view_menu.",
    "- policy.query → {}",
    "  User asks about business policies (return, payment, cancellation, etc.).",
    "  Trigger words: chính sách, policy, quy định.",
    "",
    "Rules:",
    "- Use ONLY intent codes from the allowed list above.",
    "- entities is a flat object. Values must be string | number | boolean | null.",
    "- confidence is a number between 0 and 1.",
    "- Do NOT call any tool.",
    "- Do NOT reply to the customer.",
    "- Do NOT invent new intent codes.",
    "- cart.total is ONLY for total-cart questions, NOT for greeting/name/address/hours.",
    "- If the message is unclear or you are not confident, use intent 'chat.unknown' with confidence 0.",
  ].join("\n");
}

function buildUserPrompt(input: BrainInput): string {
  const ctx = {
    message: input.message,
    role: input.role,
    membershipTier: input.membershipTier,
    customerName: input.customerName ?? null,
    cartItemCount: input.cartItemCount,
    recentHistory: input.recentHistory.slice(-5),
    state: {
      hasAwaitingConfirm: input.hasAwaitingConfirm,
      hasPendingOrderId: input.hasPendingOrderId,
      hasPendingPaymentOrderId: input.hasPendingPaymentOrderId,
      hasPendingCancelOrderId: input.hasPendingCancelOrderId,
      hasPendingEditAddressOrderId: input.hasPendingEditAddressOrderId,
      hasPendingReservation: input.hasPendingReservation,
      hasPendingComplaint: input.hasPendingComplaint,
      hasPendingRefund: input.hasPendingRefund,
      hasHandoffRequested: input.hasHandoffRequested,
    },
    knownProducts: input.knownProducts,
  };

  return JSON.stringify(ctx);
}

function parseBrainOutput(raw: string): BrainOutput {
  const trimmed = raw.trim();

  // Strip code fence nếu model wrap JSON.
  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");

  let parsed: unknown;
  try {
    parsed = JSON.parse(withoutFence);
  } catch {
    return FALLBACK;
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return FALLBACK;
  }

  const obj = parsed as Record<string, unknown>;

  const intent = obj.intent;
  if (typeof intent !== "string") return FALLBACK;
  if (!INTENT_SET.has(intent)) return FALLBACK;

  const entities = normalizeEntities(obj.entities);
  if (entities === null) return FALLBACK;

  const confidence = normalizeConfidence(obj.confidence);
  if (confidence === null) return FALLBACK;

  return { intent, entities, confidence };
}

function normalizeEntities(raw: unknown): Record<string, EntityValue> | null {
  if (raw === null || raw === undefined) return {};
  if (typeof raw !== "object" || Array.isArray(raw)) return null;

  const result: Record<string, EntityValue> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (
      value === null ||
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      result[key] = value;
    } else {
      return null;
    }
  }
  console.log(
    "[LlmBrain] intent:",
    result.intent,
    "entities:",
    result.entities,
  );
  return result;
}

function normalizeConfidence(raw: unknown): number | null {
  if (typeof raw !== "number" || Number.isNaN(raw)) return null;
  if (raw < 0) return 0;
  if (raw > 1) return 1;
  return raw;
}
