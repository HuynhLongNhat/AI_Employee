import { coffeeMenu } from './coffee.menu';

const priceOverrides = new Map<string, number>();

export function setMenuPrice(name: string, price: number): void {
  priceOverrides.set(name, price);
}

export function getEffectivePrice(name: string): number | undefined {
  return priceOverrides.get(name);
}

export function getEffectiveMenu() {
  return coffeeMenu.map((item) => {
    const override = priceOverrides.get(item.name);

    return override !== undefined
      ? { ...item, price: override }
      : item;
  });
}