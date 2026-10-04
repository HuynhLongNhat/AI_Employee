import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ProductServiceEntity } from "./product-service.entity";
import { ProductServiceService } from "./product-service.service";
import { ProductServiceController } from "./product-service.controller";

@Module({
  imports: [TypeOrmModule.forFeature([ProductServiceEntity])],
  providers: [ProductServiceService],
  controllers: [ProductServiceController],
  exports: [ProductServiceService],
})
export class ProductServiceModule {}