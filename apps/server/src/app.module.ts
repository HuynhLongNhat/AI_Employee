import { Module, Controller, Get } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ChatController } from "./chat/chat.controller";
import { BusinessKnowledgeModule } from "./knowledge/business-knowledge.module";
import { ProductServiceModule } from "./product/product-service.module";
import { PromotionModule } from "./promotion/promotion.module";
import { FaqModule } from "./faq/faq.module";
import { PolicyModule } from "./policy/policy.module";
import { BusinessModule } from "./business/business.module";
import { AuthModule } from "./auth/auth.module";
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
    AuthModule,
    BusinessModule,
    BusinessKnowledgeModule,
    ProductServiceModule,
    PromotionModule,
    FaqModule,
    PolicyModule
  ],
  controllers: [AppController, ChatController],
})
export class AppModule {}