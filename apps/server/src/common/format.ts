export function formatPrice(n: number): string {
  return n.toLocaleString("vi-VN") + "đ";
}

export function formatTier(tier: "bronze" | "silver" | "gold"): string {
  if (tier === "bronze") return "Bronze";
  if (tier === "silver") return "Silver";
  return "Gold";
}

export function formatOrderStatus(
  status: "pending" | "confirmed" | "cancelled",
): string {
  if (status === "confirmed") return "đã xác nhận";
  if (status === "cancelled") return "đã huỷ";
  return "chưa xác nhận";
}

export function formatLineItem(
  name: string,
  quantity: number,
  note: string | undefined,
  price: number,
): string {
  const noteText = note ? ` (${note})` : "";
  const lineTotal = price * quantity;
  return `${quantity} × ${name}${noteText} — ${formatPrice(price)} = ${formatPrice(lineTotal)}`;
}

export function formatNameSuffix(name: string | undefined): string {
  return name ? ` (${name})` : "";
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("vi-VN");
}