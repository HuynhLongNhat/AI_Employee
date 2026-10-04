import { Module, Controller, Get } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ChatController } from "./chat/chat.controller";
import { BusinessKnowledgeModule } from "./knowledge/business-knowledge.module";
import { ProductServiceModule } from "./product/product-service.module";
import { PromotionModule } from "./promotion/promotion.module";
import { FaqModule } from "./faq/faq.module";
@Controller()
class AppController {
  @Get("hello")
  getHello(): string {
    return "Hello World!";
  }
}

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "better-sqlite3",
      database: "data/marketing.db",
      autoLoadEntities: true,
      synchronize: true,
    }),
    BusinessKnowledgeModule,
    ProductServiceModule,
    PromotionModule,
    FaqModule
  ],
  controllers: [AppController, ChatController],
})
export class AppModule {}