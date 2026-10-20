import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BusinessEntity } from "./business.entity";
import { BusinessService } from "./business.service";
import { BusinessController } from "./business.controller";
import { AuthModule } from "../auth/auth.module";
import { ProductServiceEntity } from "../product/product-service.entity"; // Lưu ý check lại đường dẫn
import { PromotionEntity } from "../promotion/promotion.entity";
import { FaqEntity } from "../faq/faq.entity";
import { PolicyEntity } from "../policy/policy.entity";
// THÊM 2 IMPORT NÀY
import { ConversationLogEntity } from "../chat/conversation-log.entity";
import { ConversationLogService } from "../chat/conversation-log.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BusinessEntity,
      ProductServiceEntity,
      PromotionEntity,
      FaqEntity,
      PolicyEntity,
      ConversationLogEntity, // THÊM DÒNG NÀY
    ]),
    AuthModule,
  ],
  providers: [
    BusinessService,
    ConversationLogService, // THÊM DÒNG NÀY
  ],
  controllers: [BusinessController],
  exports: [BusinessService, ConversationLogService], // THÊM ConversationLogService vào đây
})
export class BusinessModule {}