import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PromotionEntity } from "./promotion.entity";
import { PromotionService } from "./promotion.service";
import { PromotionController } from "./promotion.controller";

@Module({
  imports: [TypeOrmModule.forFeature([PromotionEntity])],
  providers: [PromotionService],
  controllers: [PromotionController],
  exports: [PromotionService],
})
export class PromotionModule {}