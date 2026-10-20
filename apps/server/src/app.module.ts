import { Module, Controller, Get } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatController } from './chat/chat.controller';
import { AuthModule } from './auth/auth.module';
import { BusinessModule } from './business/business.module';
import { BusinessKnowledgeModule } from './knowledge/business-knowledge.module';
import { ProductServiceModule } from './product/product-service.module';
import { PromotionModule } from './promotion/promotion.module';
import { FaqModule } from './faq/faq.module';
import { PolicyModule } from './policy/policy.module';
import { OrderModule } from './cart/order.module';

// THÊM 2 IMPORT NÀY
import { ConversationLogEntity } from './chat/conversation-log.entity';
import { ConversationLogService } from './chat/conversation-log.service';
import { CustomerModule } from './customer/customer.module';

@Controller()
class AppController {
  @Get('hello')
  getHello(): string {
    return 'Hello World!';
  }
}

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: 'data/marketing.db',
      autoLoadEntities: true,
      synchronize: true,
    }),
    // THÊM DÒNG NÀY ĐỂ ĐĂNG KÝ ENTITY VÀO TYPEORM
    TypeOrmModule.forFeature([ConversationLogEntity]),
    
    AuthModule,
    BusinessModule,
    BusinessKnowledgeModule,
    ProductServiceModule,
    PromotionModule,
    FaqModule,
    PolicyModule,
    OrderModule,
    CustomerModule
  ],
  controllers: [AppController, ChatController],
  // THÊM DÒNG NÀY ĐỂ CUNG CẤP SERVICE CHO CONTROLLER
  providers: [ConversationLogService],
})
export class AppModule {}