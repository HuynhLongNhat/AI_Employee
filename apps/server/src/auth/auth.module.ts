import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserEntity } from "./user.entity";
import { UserService } from "./user.service";
import { ClerkAuthGuard } from "./clerk-auth.guard";
import { GuestTokenService } from "./guest-token.service";
import { HistoryClaimService } from "./history-claim.service";
import { AuthController } from "./auth.controller";
import { ChatAuthGuard } from "./chat-auth.guard"; // Import

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  controllers: [AuthController],
  providers: [
    UserService, 
    ClerkAuthGuard, 
    GuestTokenService, 
    HistoryClaimService,
    ChatAuthGuard // Thêm vào đây
  ],
  exports: [
    UserService, 
    ClerkAuthGuard, 
    GuestTokenService,
    ChatAuthGuard // Export ra cho ChatModule dùng
  ],
})
export class AuthModule {}