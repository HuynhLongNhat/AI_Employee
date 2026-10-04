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

const INTENT_SET: Set<string> = new Set<string>([...INTENTS]);

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
    } catch {
      return FALLBACK;
    }

    return parseBrainOutput(text);
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
    '  The "item" value MUST be one of the product names from "knownProducts" in the user context.',
    "  Map typo, abbreviation, or accentless input to the correct product name from the list.",
    "  Do NOT invent product names that are not in the list.",
    '  Example: "cho mình 2 cf sữa" → {"item": "cà phê sữa", "quantity": 2}',
    "",
    "- promotion.query → {}",
    "  User asks about promotions, discounts, or special offers.",
    '  Trigger words: "khuyến mãi", "giảm giá", "ưu đãi", "promo", "sinh nhật", "happy hour", "học sinh", "sinh viên".',
    "- chat.ask_price → { item?: string }",
    "  User hỏi giá một món/dịch vụ cụ thể.",
    '  Example: "cà phê sữa bao nhiêu tiền" → {"item": "cà phê sữa"}',
    "",
    "- shop.name → {} — user hỏi tên quán",
    '  Example: "quán mình tên gì" → {}',
    "",
    "- shop.address → {} — user hỏi địa chỉ",
    '  Example: "quán mình ở đâu" → {}',
    "",
    "- shop.opening_hours → {} — user hỏi giờ mở cửa",
    '  Example: "mấy giờ mở cửa" → {}',
    "",
    "- shop.phone → {} — user hỏi số điện thoại",
    "- shop.wifi → {} — user hỏi wifi / mật khẩu wifi",
    "- shop.parking → {} — user hỏi gửi xe / đậu xe",
    "",
    "- cart.total → {} — CHỈ khi user hỏi TỔNG giỏ hàng, KHÔNG phải giá 1 món",
    '  Keywords: "tính tiền", "tổng tiền", "hoá đơn", "đơn mình"',
    '  KHÔNG dùng cart.total cho "quán mình tên gì" / "ở đâu" / "mấy giờ".',
    "",
    "- chat.view_menu → {} — user hỏi menu / thực đơn",
    "- chat.greeting → {} — user chào",
    "- chat.faq → {} — câu hỏi chung (máy lạnh, mang đồ ăn ngoài, ...)",
    "- chat.recommend → {} — user mô tả sở thích (thích ngọt, thích trà, ...)",
    "- chat.compare → {} — user so sánh 2 món",
    "- chat.unclear → {} — user hỏi chung chung (uống gì, tư vấn)",
    "- chat.unknown → {} — không hiểu",
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
