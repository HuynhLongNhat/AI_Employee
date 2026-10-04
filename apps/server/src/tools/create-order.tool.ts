import { createOrder, Order } from "../memory/order.memory";
import { registerTool } from "./tool.registry";

export type CreateOrderArgs = {
  customerId: string;
  items: { name: string; quantity: number; note?: string }[];
  total: number;
};

registerTool("create_order", (args: CreateOrderArgs): Order => {
  return createOrder(args.customerId, args.items, args.total);
});