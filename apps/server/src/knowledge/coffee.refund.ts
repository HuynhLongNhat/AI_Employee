export const coffeeRefundPolicy = {
  summary:
    'Mộc Coffee hỗ trợ hoàn tiền trong các trường hợp: món bị làm sai, món bị hư, hoặc quán không thể phục vụ.',

  conditions: [
    'Khiếu nại trong vòng 24h kể từ khi nhận món.',
    'Có hoá đơn hoặc mã đơn hàng.',
    'Món chưa dùng quá 1/2 (đối với lỗi từ phía quán).',
  ],

  process:
    'Khách gửi yêu cầu hoàn tiền, quán xác minh trong 1–2 ngày làm việc, sau đó hoàn tiền qua phương thức thanh toán ban đầu.',

  note:
    'Trường hợp đã chuyển khoản, tiền hoàn sẽ về trong 3–5 ngày làm việc tuỳ ngân hàng.',
};