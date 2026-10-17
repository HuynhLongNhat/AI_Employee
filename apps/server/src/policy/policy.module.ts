import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PolicyEntity } from "./policy.entity";
import { PolicyService } from "./policy.service";
import { PolicyController } from "./policy.controller";
import { AuthModule } from "../auth/auth.module";
import { BusinessModule } from "../business/business.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([PolicyEntity]),
    AuthModule,
    BusinessModule,
  ],
  providers: [PolicyService],
  controllers: [PolicyController],
  exports: [PolicyService],
})
export class PolicyModule {}