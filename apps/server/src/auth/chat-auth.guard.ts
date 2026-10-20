import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { verifyToken } from "@clerk/backend";
import type { Request } from "express";
import { UserService } from "./user.service";
import { GuestTokenService } from "./guest-token.service";

@Injectable()
export class ChatAuthGuard implements CanActivate {
  constructor(
    private readonly userService: UserService,
    private readonly guestTokenService: GuestTokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const authHeader = req.headers.authorization;

    // ===== LUỒNG 1: XÁC THỰC BẰNG CLERK (USER ĐÃ ĐĂNG NHẬP) =====
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7).trim();
      try {
        const payload = await verifyToken(token, {
          secretKey: process.env.CLERK_SECRET_KEY!,
        });
        
        const internalUser = await this.userService.getOrCreate(payload.sub, (payload as any).email ?? null);
        
        // Gán customerId là Clerk ID (payload.sub)
        (req as any).user = { customerId: payload.sub, role: "user", internalUserId: internalUser.id };
        return true;
      } catch {
        throw new UnauthorizedException("Token Clerk không hợp lệ.");
      }
    }

    // ===== LUỒNG 2: XÁC THỰC BẰNG GUEST COOKIE =====
    const cookies = req.headers.cookie?.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>) || {};

    const guestToken = cookies['guest_token'];
    if (guestToken) {
      try {
        const { guestId } = this.guestTokenService.verifyToken(guestToken);
        // Gán customerId là guestId
        (req as any).user = { customerId: guestId, role: "guest" };
        return true;
      } catch {
        throw new UnauthorizedException("Guest token không hợp lệ hoặc đã hết hạn.");
      }
    }

    // Không có cả 2
    throw new UnauthorizedException("Vui lòng cung cấp Clerk Token hoặc Guest Cookie.");
  }
}