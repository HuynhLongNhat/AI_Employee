import { Body, Controller, Post, Headers, Res, UseGuards, Req } from '@nestjs/common';
import { Response, Request } from 'express';
import { GuestTokenService } from './guest-token.service';
import { HistoryClaimService } from './history-claim.service';
import { ClerkAuthGuard } from './clerk-auth.guard'; // Dùng ClerkGuard có sẵn của bạn để xác thực user
import type { UserEntity } from './user.entity';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly guestTokenService: GuestTokenService,
    private readonly historyClaimService: HistoryClaimService,
  ) {}

  // API 1: Cấp Cookie cho Guest
  @Post('guest')
  async createGuest(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    // 1. Kiểm tra xem đã có Cookie hợp lệ chưa
    const cookies = req.headers.cookie?.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>) || {};

    const existingToken = cookies['guest_token'];
    if (existingToken) {
      try {
        const { guestId } = this.guestTokenService.verifyToken(existingToken);
        return { guestId }; // Nếu có rồi thì trả về luôn, không cấp mới
      } catch (e) {
        // Token hỏng/hết hạn thì bỏ qua, chạy xuống cấp mới
      }
    }

    // 2. Cấp mới
    const { guestId, token } = this.guestTokenService.generateToken();
    res.cookie('guest_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/',
    });
    return { guestId };
  }

  // API 2: Claim History (Yêu cầu phải đăng nhập Clerk)
  @Post('claim')
  @UseGuards(ClerkAuthGuard) 
  async claimHistory(
    @Req() req: Request,
    @Body() body: { businessId: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    // 1. Lấy Clerk ID từ Request (do ClerkAuthGuard gán vào)
    const user = (req as any).user as UserEntity;
    const clerkUserId = user.clerkUserId;

    // 2. Lấy guest_token từ Cookie thủ công (tránh phụ thuộc cookie-parser)
    const cookies = req.headers.cookie?.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>) || {};

    const guestToken = cookies['guest_token'];
    
    if (guestToken) {
      try {
        const { guestId } = this.guestTokenService.verifyToken(guestToken);
        // Gọi Service gộp dữ liệu
        await this.historyClaimService.claimHistory(guestId, clerkUserId, body.businessId);
        
        // Xóa Cookie sau khi claim xong
        res.clearCookie('guest_token', { path: '/' });
      } catch (error) {
        // Nếu token lỗi hoặc đã claim rồi, bỏ qua để đảm bảo idempotent
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.warn('Guest token invalid or already claimed:', errorMessage);
      }
    }

    return { success: true, message: 'History claimed successfully.' };
  }
}