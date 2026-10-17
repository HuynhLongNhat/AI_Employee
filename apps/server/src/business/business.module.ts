import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BusinessEntity } from "./business.entity";
import { BusinessService } from "./business.service";
import { BusinessController } from "./business.controller";
import { AuthModule } from "../auth/auth.module";
import { PromotionEntity } from "../promotion/promotion.entity";
import { FaqEntity } from "../faq/faq.entity";
import { PolicyEntity } from "../policy/policy.entity";
import { ProductServiceEntity } from "../product/product-service.entity";
import { BusinessKnowledgeEntity } from "../knowledge/business-knowledge.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BusinessEntity,
      ProductServiceEntity,
      PromotionEntity,
      FaqEntity,
      PolicyEntity,
      BusinessKnowledgeEntity
    ]),
    AuthModule,
  ],
  providers: [BusinessService],
  controllers: [BusinessController],
  exports: [BusinessService],
})
export class BusinessModule {}