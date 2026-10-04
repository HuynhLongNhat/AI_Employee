import { formatLineItem, formatPrice } from "./format";

type MenuLike = { name: string; price: number };

export function findMenuPrice(
  name: string,
  menu: MenuLike[],
  products?: MenuLike[],
): number {
  const fromMenu = menu.find((m) => m.name === name);
  if (fromMenu) return fromMenu.price;

  const fromProducts = products?.find((p) => p.name === name);
  if (fromProducts) return fromProducts.price;

  return 0;
}

type CartItemLike = {
  name: string;
  quantity: number;
  note?: string;
};


export function summarizeCart(
  items: CartItemLike[],
  menu: MenuLike[],
  products?: MenuLike[],
): { lines: string[]; total: number } {
  let total = 0;

  const lines = items.map((item) => {
    const price = findMenuPrice(item.name, menu, products);
    total += price * item.quantity;
    return formatLineItem(item.name, item.quantity, item.note, price);
  });

  return { lines, total };
}

export function findMenuItemByName(
  keyword: string,
  menu: MenuLike[],
): MenuLike | undefined {
  const lower = keyword.toLowerCase();
  return menu.find((m) => m.name.toLowerCase() === lower);
}

export function formatMenuText(menu: MenuLike[]): string {
  return menu
    .map((item) => `${item.name}: ${formatPrice(item.price)}`)
    .join("\n");
}

export function normalizeForMatch(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

export function findProductByName<T extends { name: string }>(
  products: T[],
  name: string,
): T | undefined {
  const lower = name.toLowerCase().trim();

  const exact = products.find((p) => p.name.toLowerCase() === lower);
  if (exact) return exact;

  const normalized = normalizeForMatch(name);
  return products.find((p) => normalizeForMatch(p.name) === normalized);
}