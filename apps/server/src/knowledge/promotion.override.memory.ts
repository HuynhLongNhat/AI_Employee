import { coffeePromotions } from './coffee.promotion';

const discountOverrides = new Map<string, string>();

export function setPromotionDiscount(
  id: string,
  discount: string,
): void {
  discountOverrides.set(id, discount);
}

export function getEffectivePromotionDiscount(
  id: string,
): string | undefined {
  return discountOverrides.get(id);
}

export function getEffectivePromotions() {
  return coffeePromotions.map((promo) => {
    const override = discountOverrides.get(promo.id);

    return override !== undefined
      ? { ...promo, discount: override }
      : promo;
  });
}