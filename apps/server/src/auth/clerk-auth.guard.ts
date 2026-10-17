import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { verifyToken } from "@clerk/backend";
import type { Request } from "express";
import { UserService } from "./user.service";
import type { UserEntity } from "./user.entity";

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  constructor(private readonly userService: UserService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Chưa đăng nhập.");
    }

    const token = authHeader.slice(7).trim();
    if (!token) throw new UnauthorizedException("Token thiếu.");

    let clerkUserId: string;
    let email: string | null = null;

    try {
      const payload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY!,
      });
      clerkUserId = payload.sub;
      email = (payload as any).email ?? null;
    } catch {
      throw new UnauthorizedException("Token không hợp lệ.");
    }

    const user: UserEntity = await this.userService.getOrCreate(
      clerkUserId,
      email,
    );

    (req as any).user = user;
    return true;
  }
}