// import { Module } from '@nestjs/common';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { LeadModule } from './lead/lead.module';

// @Module({
//   imports: [
//     TypeOrmModule.forRoot({
//       type: 'postgres',
//       host: process.env.DB_HOST || 'localhost',
//       port: parseInt(process.env.DB_PORT || '5432'),
//       username: process.env.DB_USER || 'postgres',
//       password: process.env.DB_PASS || 'postgres',
//       database: process.env.DB_NAME || 'marketing_tool',
//       autoLoadEntities: true,
//       synchronize: true,
//     }),
//     LeadModule,
//   ],
// })
// export class AppModule {}

import { Module, Controller, Get } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatController } from './chat/chat.controller';

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
  ],
  controllers: [AppController, ChatController],
})
export class AppModule {}