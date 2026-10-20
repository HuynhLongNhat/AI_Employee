import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CartEntity } from "./cart.entity";
import { CartService } from "./cart.service";
import { OrderService } from "../order/order.service";
import { OrderEntity } from "../order/order.entity";
@Module({
  imports: [TypeOrmModule.forFeature([CartEntity, OrderEntity])],
  providers: [CartService, OrderService],
  exports: [CartService, OrderService],
})
export class OrderModule {}