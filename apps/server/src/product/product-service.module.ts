import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ProductServiceEntity } from "./product-service.entity";
import { ProductServiceService } from "./product-service.service";
import { ProductServiceController } from "./product-service.controller";
import { AuthModule } from "../auth/auth.module";
import { BusinessModule } from "../business/business.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductServiceEntity]),
    AuthModule,
    BusinessModule,
  ],
  providers: [ProductServiceService],
  controllers: [ProductServiceController],
  exports: [ProductServiceService],
})
export class ProductServiceModule {}