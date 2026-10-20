import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CustomerEntity } from '../customer/customer.entity';
import { ConversationLogEntity } from '../chat/conversation-log.entity';
import { OrderEntity } from '../order/order.entity';

@Injectable()
export class HistoryClaimService {
  private readonly logger = new Logger(HistoryClaimService.name);

  constructor(private readonly dataSource: DataSource) {}

  async claimHistory(guestId: string, clerkUserId: string, businessId: string): Promise<void> {
    // Khởi tạo Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      this.logger.log(`Bắt đầu claim: ${guestId} -> ${clerkUserId} (Business: ${businessId})`);

      // 1. Lấy thông tin Guest Customer và Clerk Customer (nếu có)
      const guestCustomer = await queryRunner.manager.findOne(CustomerEntity, {
        where: { customerId: guestId, businessId },
      });
      const clerkCustomer = await queryRunner.manager.findOne(CustomerEntity, {
        where: { customerId: clerkUserId, businessId },
      });

      // 2. Xử lý gộp Customer
      if (guestCustomer) {
        if (clerkCustomer) {
          // Trường hợp 2: Cả 2 đều tồn tại -> Cộng dồn điểm, ưu tiên tên Guest
          clerkCustomer.points += guestCustomer.points;
          if (guestCustomer.name) {
            clerkCustomer.name = guestCustomer.name;
          }
          await queryRunner.manager.save(CustomerEntity, clerkCustomer);
          // Xóa guest customer sau khi gộp
          await queryRunner.manager.remove(CustomerEntity, guestCustomer);
        } else {
          // Trường hợp 1: Chỉ có Guest -> Đổi customerId thành clerkUserId
          guestCustomer.customerId = clerkUserId;
          await queryRunner.manager.save(CustomerEntity, guestCustomer);
        }
      }

      // 3. Update toàn bộ Logs và Orders
      await queryRunner.manager.update(
        ConversationLogEntity,
        { customerId: guestId, businessId },
        { customerId: clerkUserId },
      );

      await queryRunner.manager.update(
        OrderEntity,
        { customerId: guestId, businessId },
        { customerId: clerkUserId },
      );

      // Commit Transaction
      await queryRunner.commitTransaction();
      this.logger.log(`Claim thành công: ${guestId} -> ${clerkUserId}`);
        } catch (error) {
      // Rollback nếu có lỗi
      await queryRunner.rollbackTransaction();
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      this.logger.error(`Claim thất bại: ${errorMessage}`, errorStack);
      throw error;
    } finally {
      // Giải phóng query runner
      await queryRunner.release();
    }
  }
}