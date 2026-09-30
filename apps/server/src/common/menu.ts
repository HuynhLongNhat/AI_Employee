import { formatLineItem, formatPrice } from "./format";

type MenuLike = { name: string; price: number };

export function findMenuPrice(name: string, menu: MenuLike[]): number {
  return menu.find((m) => m.name === name)?.price ?? 0;
}

type CartItemLike = {
  name: string;
  quantity: number;
  note?: string;
};

export function summarizeCart(
  items: CartItemLike[],
  menu: MenuLike[],
): { lines: string[]; total: number } {
  let total = 0;

  const lines = items.map((item) => {
    const price = findMenuPrice(item.name, menu);
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