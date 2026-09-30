export const OWNER_ONLY_REPLY =
  "Dạ, em xin lỗi, chức năng này chỉ dành cho chủ quán ạ.";

export const OWNER_OR_STAFF_ONLY_REPLY =
  "Dạ, em xin lỗi, chức năng này chỉ dành cho chủ quán và nhân viên ạ.";

export const NO_ORDER_REPLY =
  "Dạ, hiện tại mình chưa có đơn nào ạ.";

 export const PROMPT_COMPLAINT_CONTENT =
  "Dạ, mình cho em xin nội dung khiếu nại ạ.";

export const PROMPT_REFUND_REASON =
  "Dạ, mình cho em xin lý do hoàn tiền ạ.";

export const PROMPT_RESERVATION_TIME =
  "Dạ, mình cho em xin thời gian ạ.";

export function notFoundMenuReply(name: string): string {
  return `Dạ, em không tìm thấy món "${name}" trong menu ạ.`;
}

export function notInCartReply(name: string): string {
  return `Dạ, trong giỏ hàng không có ${name} ạ.`;
}