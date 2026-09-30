import { createOrder } from '../memory/order.memory';
import { registerTool } from './tool.registry';

registerTool('create_order', (args: {
  customerId: string;
  items: { name: string; quantity: number; note?: string }[];
  total: number;
}) => {
  return createOrder(args.customerId, args.items, args.total);
});