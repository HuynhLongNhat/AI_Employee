import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserEntity } from "./user.entity";
import { UserService } from "./user.service";
import { ClerkAuthGuard } from "./clerk-auth.guard";

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  providers: [UserService, ClerkAuthGuard],
  exports: [UserService, ClerkAuthGuard],
})
export class AuthModule {}