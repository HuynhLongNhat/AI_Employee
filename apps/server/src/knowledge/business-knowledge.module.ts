import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BusinessKnowledgeEntity } from "./business-knowledge.entity";
import { BusinessKnowledgeService } from "./business-knowledge.service";
import { BusinessKnowledgeController } from "./business-knowledge.controller";
import { AuthModule } from "../auth/auth.module";
import { BusinessModule } from "../business/business.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([BusinessKnowledgeEntity]),
    AuthModule,
    BusinessModule, 
  ],
  providers: [BusinessKnowledgeService],
  controllers: [BusinessKnowledgeController],
  exports: [BusinessKnowledgeService],
})
export class BusinessKnowledgeModule {}