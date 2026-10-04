import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BusinessKnowledgeEntity } from "./business-knowledge.entity";
import { BusinessKnowledgeService } from "./business-knowledge.service";
import { BusinessKnowledgeController } from "./business-knowledge.controller";

@Module({
  imports: [TypeOrmModule.forFeature([BusinessKnowledgeEntity])],
  providers: [BusinessKnowledgeService],
  controllers: [BusinessKnowledgeController],
  exports: [BusinessKnowledgeService],
})
export class BusinessKnowledgeModule {}