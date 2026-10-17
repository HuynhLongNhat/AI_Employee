import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FaqEntity } from "./faq.entity";
import { FaqService } from "./faq.service";
import { FaqController } from "./faq.controller";
import { AuthModule } from "../auth/auth.module";
import { BusinessModule } from "../business/business.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([FaqEntity]),
    AuthModule,
    BusinessModule,
  ],
  providers: [FaqService],
  controllers: [FaqController],
  exports: [FaqService],
})
export class FaqModule {}