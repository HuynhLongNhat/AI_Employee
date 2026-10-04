import type {
  Brain,
  BrainInput,
  BrainOutput,
  EntityValue,
} from "./brain.contract";
import type { Intent } from "./intent-catalog";

type Entities = Record<string, EntityValue>;

type IntentRule = {
  intent: Intent;
  when: (msg: string, input: BrainInput) => boolean;
  extract?: (msg: string) => Entities;
  confidence: number;
};

// Order giữ theo dispatcher order trong chat.controller.ts.
// State-first rules đứng trước message-based rules.
const RULES: IntentRule[] = [
  // ===== STATE-FIRST =====
  {
    intent: "order.confirm",
    when: (_, i) => i.hasAwaitingConfirm,
    confidence: 0.9,
  },
  {
    intent: "order.set_fulfillment",
    when: (_, i) => i.hasPendingOrderId,
    confidence: 0.9,
  },
  {
    intent: "order.status",
    when: (m) =>
      m.includes("đơn của mình") ||
      m.includes("kiểm tra đơn") ||
      m.includes("trạng thái đơn") ||
      m.includes("đơn hàng của mình") ||
      m.includes("xem đơn"),
    confidence: 0.9,
  },
  {
    intent: "order.cancel_intent",
    when: (m) =>
      m.includes("huỷ đơn") ||
      m.includes("hủy đơn") ||
      m.includes("cancel đơn"),
    confidence: 0.9,
  },
  {
    intent: "order.edit_address_enter",
    when: (_, i) => i.hasPendingEditAddressOrderId,
    confidence: 0.9,
  },
  {
    intent: "complaint.enter_content",
    when: (_, i) => i.hasPendingComplaint,
    confidence: 0.9,
  },
  {
    intent: "refund.enter_reason",
    when: (_, i) => i.hasPendingRefund,
    confidence: 0.9,
  },
  {
    intent: "refund.intent",
    when: (m) =>
      m.includes("mình muốn hoàn tiền") ||
      m.includes("cho mình hoàn tiền") ||
      m.includes("yêu cầu hoàn tiền") ||
      m.includes("hoàn tiền lại"),
    confidence: 0.9,
  },
  {
    intent: "reservation.enter_details",
    when: (_, i) => i.hasPendingReservation,
    confidence: 0.9,
  },

  // ===== CUSTOMER-FACING MESSAGE-BASED =====
  {
    intent: "promotion.query",
    when: (m) =>
      m.includes("khuyến mãi") ||
      m.includes("khuyến mại") ||
      m.includes("giảm giá") ||
      m.includes("ưu đãi") ||
      m.includes("promo") ||
      m.includes("sinh nhật") ||
      m.includes("happy hour") ||
      m.includes("học sinh") ||
      m.includes("sinh viên"),
    confidence: 0.9,
  },

  // ===== OWNER / STAFF =====
  {
    intent: "owner.view_orders_by_status",
    when: (m) =>
      m.includes("xem đơn đã huỷ") ||
      m.includes("xem đơn hủy") ||
      m.includes("xem đơn chưa xác nhận") ||
      m.includes("xem đơn đã xác nhận"),
    confidence: 0.9,
  },
  {
    intent: "owner.view_customers",
    when: (m) => m.includes("xem khách hàng") || m.includes("danh sách khách"),
    confidence: 0.9,
  },
  {
    intent: "owner.view_customer_detail",
    when: (m) => /^xem khách (\S+)$/i.test(m),
    extract: (m) => {
      const match = m.match(/^xem khách (\S+)$/i);
      return (match ? { customerId: match[1].trim() } : {}) as Entities;
    },
    confidence: 0.9,
  },
  {
    intent: "owner.revenue",
    when: (m) =>
      m.includes("doanh thu") ||
      m.includes("bao nhiêu đơn") ||
      m.includes("số đơn hôm nay"),
    confidence: 0.9,
  },
  {
    intent: "owner.best_sellers",
    when: (m) =>
      m.includes("món bán chạy") ||
      m.includes("món nào bán chạy") ||
      m.includes("bán chạy nhất") ||
      m.includes("top món"),
    confidence: 0.9,
  },
  {
    intent: "owner.top_customers",
    when: (m) =>
      m.includes("khách nào mua nhiều") ||
      m.includes("khách mua nhiều nhất") ||
      m.includes("top khách") ||
      m.includes("khách vip"),
    confidence: 0.9,
  },
  {
    intent: "owner.customer_classification",
    when: (m) =>
      m.includes("phân loại khách hàng") ||
      m.includes("phân tích khách hàng") ||
      m.includes("khách hàng có đặc điểm gì"),
    confidence: 0.9,
  },
  {
    intent: "owner.tier_distribution",
    when: (m) =>
      m.includes("phân bố hạng") ||
      m.includes("thống kê hạng") ||
      m.includes("bao nhiêu khách bronze") ||
      m.includes("bao nhiêu khách silver") ||
      m.includes("bao nhiêu khách gold"),
    confidence: 0.9,
  },
  {
    intent: "owner.order_distribution",
    when: (m) =>
      m.includes("phân bố đơn hàng") ||
      m.includes("phân bố đơn") ||
      m.includes("thống kê đơn"),
    confidence: 0.9,
  },
  {
    intent: "owner.aov",
    when: (m) =>
      m.includes("giá trị đơn trung bình") ||
      m.includes("đơn trung bình") ||
      m.includes("trung bình đơn") ||
      m.includes("aov"),
    confidence: 0.9,
  },
  {
    intent: "owner.care_suggestions",
    when: (m) =>
      m.includes("gợi ý chăm sóc khách") ||
      m.includes("chăm sóc khách") ||
      m.includes("khách nào cần chăm sóc"),
    confidence: 0.9,
  },
  {
    intent: "owner.tier_upgrade_candidates",
    when: (m) =>
      m.includes("khách sắp lên hạng") ||
      m.includes("sắp lên hạng") ||
      m.includes("khách gần lên hạng"),
    confidence: 0.9,
  },
  {
    intent: "automation.run_remind_vip",
    when: (m) =>
      m.includes("chạy automation nhắc vip") ||
      m.includes("chạy automation remind vip"),
    confidence: 0.9,
  },
  {
    intent: "automation.view_logs",
    when: (m) =>
      m.includes("xem log automation") ||
      m.includes("log automation") ||
      m.includes("lịch sử automation"),
    confidence: 0.9,
  },

  // ===== TEST TOOLING =====
  {
    intent: "test.set_tier",
    when: (m) => /^mình hạng (đồng|bạc|vàng|bronze|silver|gold)$/i.test(m),
    extract: (m) => {
      const match = m.match(/^mình hạng (đồng|bạc|vàng|bronze|silver|gold)$/i);
      return (match ? { tier: match[1].toLowerCase() } : {}) as Entities;
    },
    confidence: 0.9,
  },
  {
    intent: "test.set_points",
    when: (m) => /^mình có (\d+) điểm$/i.test(m),
    extract: (m) => {
      const match = m.match(/^mình có (\d+) điểm$/i);
      return (match ? { points: parseInt(match[1], 10) } : {}) as Entities;
    },
    confidence: 0.9,
  },
  {
    intent: "test.set_role",
    when: (m) =>
      /^mình là chủ quán$/i.test(m) ||
      /^mình là nhân viên$/i.test(m) ||
      /^mình là khách$/i.test(m),
    confidence: 0.9,
  },

  {
    intent: "owner.view_all_orders",
    when: (m) =>
      m.includes("xem tất cả đơn") ||
      m.includes("tất cả đơn") ||
      m.includes("danh sách đơn"),
    confidence: 0.9,
  },

  // ===== KNOWLEDGE ADMIN =====
  {
    intent: "admin.update_shop_info",
    when: (m) =>
      /^đổi giờ mở cửa thành (.+)$/i.test(m) ||
      /^đổi số điện thoại thành (.+)$/i.test(m) ||
      /^đổi địa chỉ thành (.+)$/i.test(m) ||
      /^đổi tên wifi thành (.+)$/i.test(m) ||
      /^đổi mật khẩu wifi thành (.+)$/i.test(m) ||
      /^đổi gửi xe thành (.+)$/i.test(m),
    confidence: 0.9,
  },
  {
    intent: "admin.view_knowledge",
    when: (m) =>
      m.includes("xem knowledge") ||
      m.includes("xem cấu hình") ||
      m.includes("knowledge hiện tại"),
    confidence: 0.9,
  },
  {
    intent: "admin.update_price",
    when: (m) => /^đổi giá (.+?) thành (\d+)$/i.test(m),
    extract: (m) => {
      const match = m.match(/^đổi giá (.+?) thành (\d+)$/i);
      if (!match) return {} as Entities;
      return {
        item: match[1].trim(),
        price: parseInt(match[2], 10),
      } as Entities;
    },
    confidence: 0.9,
  },
  {
    intent: "admin.view_menu",
    when: (m) =>
      m.includes("xem menu") ||
      m.includes("menu hiện tại") ||
      m.includes("menu đầy đủ"),
    confidence: 0.9,
  },
  {
    intent: "admin.update_promotion",
    when: (m) => /^đổi giảm giá (.+?) thành (.+)$/i.test(m),
    confidence: 0.9,
  },
  {
    intent: "admin.view_promotions",
    when: (m) =>
      m.includes("xem khuyến mãi") ||
      m.includes("xem promo") ||
      m.includes("xem ưu đãi"),
    confidence: 0.9,
  },
  {
    intent: "admin.view_refund_policy",
    when: (m) =>
      m.includes("xem chính sách hoàn tiền") ||
      m.includes("xem policy hoàn tiền"),
    confidence: 0.9,
  },
  {
    intent: "owner.view_conversation_logs",
    when: (m) =>
      m.includes("xem logs") ||
      m.includes("xem log") ||
      m.includes("lịch sử chat") ||
      m.includes("xem conversation"),
    confidence: 0.9,
  },

  // ===== CUSTOMER-SERVICE CÒN LẠI =====
  {
    intent: "membership.query_tier",
    when: (m) =>
      m.includes("hạng thành viên") ||
      m.includes("hạng của mình") ||
      (m.includes("hạng") &&
        (m.includes("của mình") || m.includes("membership"))) ||
      m.includes("bao nhiêu điểm") ||
      m.includes("điểm của mình") ||
      m.includes("điểm tích lũy") ||
      m.includes("điểm tích luỹ") ||
      (m.includes("điểm") && m.includes("mình")),
    confidence: 0.9,
  },
  {
    intent: "customer.history",
    when: (m) =>
      m.includes("lịch sử mua hàng") ||
      m.includes("lịch sử đơn") ||
      m.includes("mình đã mua gì") ||
      m.includes("đã mua những gì") ||
      m.includes("đơn cũ"),
    confidence: 0.9,
  },
  {
    intent: "customer.regular_query",
    when: (m) =>
      m.includes("khách quen") ||
      m.includes("khách thân") ||
      m.includes("mình quen chưa") ||
      m.includes("quen chưa"),
    confidence: 0.9,
  },
  {
    intent: "complaint.intent",
    when: (m) =>
      m.includes("khiếu nại") ||
      m.includes("phàn nàn") ||
      m.includes("báo lỗi") ||
      m.includes("có vấn đề"),
    confidence: 0.9,
  },
  {
    intent: "refund.policy_query",
    when: (m) =>
      m.includes("chính sách hoàn tiền") ||
      m.includes("hoàn tiền như thế nào") ||
      m.includes("điều kiện hoàn tiền") ||
      m.includes("quy trình hoàn tiền") ||
      m.includes("hoàn tiền được không"),
    confidence: 0.9,
  },
  {
    intent: "handoff.intent",
    when: (m) =>
      m.includes("gặp nhân viên") ||
      m.includes("nói chuyện với người") ||
      m.includes("cho mình gặp staff") ||
      m.includes("gọi nhân viên") ||
      m.includes("cần người thật"),
    confidence: 0.9,
  },
  {
    intent: "order.edit_address",
    when: (m) =>
      (m.includes("sửa địa chỉ") ||
        m.includes("đổi địa chỉ") ||
        m.includes("địa chỉ giao hàng")) &&
      !/^đổi địa chỉ thành /i.test(m),
    confidence: 0.9,
  },
  {
    intent: "order.cancel_confirm",
    when: (_, i) => i.hasPendingCancelOrderId,
    confidence: 0.9,
  },
  {
    intent: "reservation.intent",
    when: (m) =>
      m.includes("đặt bàn") || m.includes("giữ bàn") || m.includes("book bàn"),
    confidence: 0.9,
  },
  {
    intent: "order.set_payment",
    when: (_, i) => i.hasPendingPaymentOrderId,
    confidence: 0.9,
  },
  {
    intent: "order.place",
    when: (m) =>
      m.includes("đặt hàng") ||
      m.includes("mình muốn đặt") ||
      m.includes("chốt đơn") ||
      m.includes("xác nhận đặt"),
    confidence: 0.9,
  },
  {
    intent: "cart.view",
    when: (m) =>
      m.includes("giỏ hàng") &&
      (m.includes("có gì") || m.includes("gồm gì") || m.includes("xem")),
    confidence: 0.9,
  },
  {
    intent: "cart.clear",
    when: (m) =>
      (m.includes("xoá") || m.includes("xóa") || m.includes("clear")) &&
      (m.includes("hết") || m.includes("tất cả") || m.includes("sạch")),
    confidence: 0.9,
  },
  {
    intent: "cart.total",
    when: (m) =>
      m.includes("tính tiền") ||
      m.includes("tổng tiền") ||
      m.includes("hoá đơn") ||
      m.includes("hóa đơn") ||
      m.includes("đơn mình"),
    confidence: 0.9,
  },
  {
    intent: "cart.remove_item",
    when: (m) => /^(xoá|xóa|bỏ|remove)\s+(.+)$/i.test(m),
    extract: (m) => {
      const match = m.match(/^(xoá|xóa|bỏ|remove)\s+(.+)$/i);
      return (match ? { item: match[2].trim() } : {}) as Entities;
    },
    confidence: 0.9,
  },
  {
    intent: "cart.update_item",
    when: (m) =>
      /^(sửa|đổi)\s+(.+?)\s+thành\s+(\d+)$/i.test(m) ||
      /^(.+?)\s+còn\s+(\d+)$/i.test(m),
    extract: (m) => {
      const upd = m.match(/^(sửa|đổi)\s+(.+?)\s+thành\s+(\d+)$/i);
      if (upd)
        return {
          item: upd[2].trim(),
          quantity: parseInt(upd[3], 10),
        } as Entities;
      const set = m.match(/^(.+?)\s+còn\s+(\d+)$/i);
      if (set)
        return {
          item: set[1].trim(),
          quantity: parseInt(set[2], 10),
        } as Entities;
      return {} as Entities;
    },
    confidence: 0.9,
  },
  {
    intent: "cart.add_item",
    when: (m) => /^(\d+)\s+(.+)$/.test(stripNotes(m)),
    extract: (m) => {
      const cleaned = stripNotes(m);
      const match = cleaned.match(/^(\d+)\s+(.+)$/);
      if (!match) return {};
      const note = extractNote(m);
      const result: Entities = {
        quantity: parseInt(match[1], 10),
        item: match[2].trim(),
      };
      if (note) result.note = note;
      return result;
    },
    confidence: 0.9,
  },
  {
    intent: "customer.set_name",
    when: (m) => m.startsWith("mình tên "),
    extract: (m) => ({ name: m.replace("mình tên ", "").trim() }),
    confidence: 0.9,
  },
  {
    intent: "customer.recall_name",
    when: (m) =>
      m.includes("nhớ tên mình") ||
      m.includes("tên mình là gì") ||
      m.includes("tên tôi là gì"),
    confidence: 0.9,
  },
  {
    intent: "chat.short_context",
    when: (m) => m === "nhẹ thôi",
    confidence: 0.7,
  },

  // ===== AFTER addMessage (customer-facing cơ bản) =====
  {
    intent: "chat.greeting",
    when: (m) =>
      m.includes("xin chào") || m === "chào" || m === "hello" || m === "hi",
    confidence: 0.9,
  },
  {
    intent: "chat.view_menu",
    when: (m) =>
      m.includes("menu") ||
      m.includes("thực đơn") ||
      m.includes("đồ uống") ||
      m.includes("có những món gì"),
    confidence: 0.9,
  },
  {
    intent: "shop.address",
    when: (m) => m.includes("ở đâu") || m.includes("địa chỉ"),
    confidence: 0.9,
  },
  {
  intent: "shop.name",
  when: (m) =>
    m.includes("tên quán") ||
    m.includes("quán mình tên") ||
    m.includes("quán tên gì") ||
    m.includes("tên của quán"),
  confidence: 0.9,
},
  {
    intent: "shop.opening_hours",
    when: (m) =>
      m.includes("mở cửa") || m.includes("giờ mở cửa") || m.includes("mấy giờ"),
    confidence: 0.9,
  },
  {
    intent: "shop.wifi",
    when: (m) => m.includes("wifi"),
    confidence: 0.9,
  },
  {
    intent: "shop.parking",
    when: (m) =>
      m.includes("đậu xe") || m.includes("đỗ xe") || m.includes("gửi xe"),
    confidence: 0.9,
  },
  {
    intent: "shop.phone",
    when: (m) => m.includes("số điện thoại") || m.includes("số điện"),
    confidence: 0.9,
  },
  {
    intent: "chat.ask_price",
    when: (m) =>
      m.includes("bao nhiêu") || m.includes("giá") || m.includes("bao tiền"),
    confidence: 0.7,
  },
  {
    intent: "chat.ask_item_detail",
    when: (m) =>
      m.includes("có gì") ||
      m.includes("thành phần") ||
      m.includes("gồm gì") ||
      m.includes("vị gì") ||
      m.includes("như thế nào"),
    confidence: 0.7,
  },
  {
    intent: "chat.recommend",
    when: (m) =>
      m.includes("thích cà phê") ||
      m.includes("không thích cà phê đắng") ||
      m.includes("không thích đắng") ||
      m.includes("thích sữa") ||
      m.includes("thích ngọt") ||
      m.includes("thích trà") ||
      m.includes("thích trái cây") ||
      m.includes("thích thanh mát") ||
      m.includes("thích matcha"),
    confidence: 0.9,
  },
  {
    intent: "chat.compare",
    when: (m) =>
      m.includes("khác nhau") ||
      m.includes("so sánh") ||
      m.includes("khác gì") ||
      m.includes("nên chọn"),
    confidence: 0.9,
  },
  {
    intent: "chat.unclear",
    when: (m) =>
      m === "uống gì" ||
      m === "ăn gì" ||
      m === "chọn gì" ||
      m.includes("gợi ý") ||
      m.includes("tư vấn") ||
      m.includes("muốn uống gì đó") ||
      m.includes("muốn uống gì"),
    confidence: 0.9,
  },
  {
    intent: "chat.faq",
    when: (m) =>
      m.includes("máy lạnh") ||
      m.includes("chuyển khoản không") ||
      m.includes("mang đồ ăn ngoài") ||
      m.includes("đặt chỗ trước"),
    confidence: 0.7,
  },
];

function stripNotes(m: string): string {
  return m
    .replace(/không đá|ko đá/gi, "")
    .replace(/ít đá/gi, "")
    .replace(/không đường|ko đường/gi, "")
    .replace(/ít đường/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractNote(m: string): string | undefined {
  const notes: string[] = [];
  if (/không đá|ko đá/i.test(m)) notes.push("không đá");
  else if (/ít đá/i.test(m)) notes.push("ít đá");
  if (/không đường|ko đường/i.test(m)) notes.push("không đường");
  else if (/ít đường/i.test(m)) notes.push("ít đường");
  return notes.length > 0 ? notes.join(", ") : undefined;
}

export class RegexBrain implements Brain {
  async interpret(input: BrainInput): Promise<BrainOutput> {
    for (const rule of RULES) {
      if (rule.when(input.message, input)) {
        return {
          intent: rule.intent,
          entities: rule.extract ? rule.extract(input.message) : {},
          confidence: rule.confidence,
        };
      }
    }

    return {
      intent: "chat.unknown",
      entities: {},
      confidence: 0,
    };
  }
}
