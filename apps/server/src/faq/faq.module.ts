import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FaqEntity } from "./faq.entity";
import { FaqService } from "./faq.service";
import { FaqController } from "./faq.controller";

@Module({
  imports: [TypeOrmModule.forFeature([FaqEntity])],
  providers: [FaqService],
  controllers: [FaqController],
  exports: [FaqService],
})
export class FaqModule {}