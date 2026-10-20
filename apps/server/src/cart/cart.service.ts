import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CartEntity } from "./cart.entity";

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(CartEntity)
    private readonly repo: Repository<CartEntity>,
  ) {}

  async getCart(businessId: string, customerId: string): Promise<any> {
    const cart = await this.repo.findOne({
      where: { businessId, customerId },
    });
    
    if (!cart) {
      return { items: [] }; // Trả về giỏ hàng trống nếu chưa có
    }
    return cart.data;
  }

  async saveCart(businessId: string, customerId: string, data: any): Promise<void> {
    let cart = await this.repo.findOne({
      where: { businessId, customerId },
    });

    if (cart) {
      cart.data = data;
      await this.repo.save(cart);
    } else {
      await this.repo.save({ businessId, customerId, data });
    }
  }
}