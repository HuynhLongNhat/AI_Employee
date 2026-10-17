import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PromotionEntity } from "./promotion.entity";
import { PromotionService } from "./promotion.service";
import { PromotionController } from "./promotion.controller";
import { AuthModule } from "../auth/auth.module";
import { BusinessModule } from "../business/business.module";

@Module({
  imports: [TypeOrmModule.forFeature([PromotionEntity]),AuthModule, BusinessModule],
  providers: [PromotionService],
  controllers: [PromotionController],
  exports: [PromotionService],
})
export class PromotionModule {}