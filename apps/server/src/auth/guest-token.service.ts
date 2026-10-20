import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';

@Injectable()
export class GuestTokenService {
  private readonly secret = process.env.GUEST_JWT_SECRET || 'super-secret-guest-key-change-in-prod';
  private readonly expiresIn = '30d'; // Cookie sống 30 ngày

  // Tạo token mới cho Guest
  generateToken(): { guestId: string; token: string } {
    const guestId = `guest_${randomUUID()}`;
    const token = jwt.sign({ guestId, role: 'guest' }, this.secret, { expiresIn: this.expiresIn });
    return { guestId, token };
  }

  // Xác minh token từ Cookie
  verifyToken(token: string): { guestId: string } {
    try {
      const payload = jwt.verify(token, this.secret) as { guestId: string; role: string };
      if (payload.role !== 'guest' || !payload.guestId) {
        throw new UnauthorizedException('Invalid guest token payload');
      }
      return { guestId: payload.guestId };
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired guest token');
    }
  }
}