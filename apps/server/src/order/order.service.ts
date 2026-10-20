import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { OrderEntity } from "./order.entity";

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly repo: Repository<OrderEntity>,
  ) {}

  async getCustomerOrders(businessId: string, customerId: string): Promise<OrderEntity[]> {
    return this.repo.find({
      where: { businessId, customerId },
      order: { createdAt: "DESC" },
    });
  }

  async getAllOrders(businessId: string): Promise<OrderEntity[]> {
    return this.repo.find({
      where: { businessId },
      order: { createdAt: "DESC" },
    });
  }


    async saveMany(orders: OrderEntity[]): Promise<void> {
    if (orders.length === 0) return;
    try {
      await this.repo.save(orders);
      console.log(`[OrderService] Saved ${orders.length} orders successfully.`);
    } catch (error) {
      console.error(`[OrderService] FAILED to save orders:`, error);
    }
  }
}