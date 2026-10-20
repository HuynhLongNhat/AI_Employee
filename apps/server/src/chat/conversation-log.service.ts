import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConversationLogEntity } from "./conversation-log.entity";

@Injectable()
export class ConversationLogService {
  constructor(
    @InjectRepository(ConversationLogEntity)
    private readonly repo: Repository<ConversationLogEntity>,
  ) {}

  async logTurn(
    businessId: string,
    conversationId: string,
    customerId: string,
    message: string,
    reply: string,
  ): Promise<void> {
    await this.repo.save({
      businessId,
      conversationId,
      customerId,
      message,
      reply,
    });
  }

  // ===== SỬA HÀM NÀY ĐỂ JOIN VỚI BẢNG CUSTOMERS =====
   // ===== SỬA HÀM NÀY ĐỂ TRẢ VỀ ĐÚNG CẤU TRÚC =====
  async getRecentLogs(businessId: string, limit: number): Promise<any[]> {
    const { entities, raw } = await this.repo
      .createQueryBuilder("log")
      .leftJoin("customers", "customer", "log.customerId = customer.customerId AND log.businessId = customer.businessId")
      .where("log.businessId = :businessId", { businessId })
      .orderBy("log.createdAt", "DESC")
      .take(limit)
      .getRawAndEntities();

    // Map lại dữ liệu để Frontend nhận được đúng các trường id, conversationId...
    return entities.map((entity, index) => ({
      id: entity.id,
      conversationId: entity.conversationId,
      customerId: entity.customerId,
      message: entity.message,
      reply: entity.reply,
      createdAt: entity.createdAt,
      customerName: raw[index]?.customerName || null,
    }));
  }

  // ... (Các hàm getCustomerConversations và getConversationHistory giữ nguyên)
  async getCustomerConversations(businessId: string, customerId: string) {
    const latestLogs = await this.repo
      .createQueryBuilder("log")
      .where("log.businessId = :businessId", { businessId })
      .andWhere("log.customerId = :customerId", { customerId })
      .orderBy("log.createdAt", "DESC")
      .getMany();

    const map = new Map();
    for (const log of latestLogs) {
      if (!map.has(log.conversationId)) {
        map.set(log.conversationId, {
          conversationId: log.conversationId,
          lastMessage: log.message,
          lastTime: log.createdAt,
        });
      }
    }
    return Array.from(map.values());
  }

  async getConversationHistory(
    businessId: string,
    conversationId: string,
    customerId: string,
  ): Promise<ConversationLogEntity[]> {
    return this.repo.find({
      where: { businessId, conversationId, customerId },
      order: { createdAt: "ASC" },
    });
  }
}