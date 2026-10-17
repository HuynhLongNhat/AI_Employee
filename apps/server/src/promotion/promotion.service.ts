import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  PromotionEntity,
  PromotionScope,
  PromotionStatus,
} from "./promotion.entity";

@Injectable()
export class PromotionService {
  constructor(
    @InjectRepository(PromotionEntity)
    private readonly repo: Repository<PromotionEntity>,
  ) {}

  async create(
    businessId: string,
    data: {
      name: string;
      description?: string;
      keywords?: string[];
      condition?: string;
      discount?: string;
      scope?: PromotionScope;
      productIds?: string[];
      status?: PromotionStatus;
    },
  ): Promise<PromotionEntity> {
    return this.repo.save({
      businessId,
      name: data.name.trim(),
      description: data.description ?? "",
      keywords: data.keywords ?? [],
      condition: data.condition ?? "",
      discount: data.discount ?? "",
      scope: data.scope ?? "all",
      productIds: data.productIds ?? [],
      status: data.status ?? "active",
    });
  }

  async findAll(businessId: string): Promise<PromotionEntity[]> {
    return this.repo.find({
      where: { businessId },
      order: { createdAt: "DESC" },
    });
  }

  async findOne(
    id: string,
    businessId: string,
  ): Promise<PromotionEntity | null> {
    return this.repo.findOne({ where: { id, businessId } });
  }

  async update(
    id: string,
    businessId: string,
    patch: Partial<{
      name: string;
      description: string;
      keywords: string[];
      condition: string;
      discount: string;
      scope: PromotionScope;
      productIds: string[];
      status: PromotionStatus;
    }>,
  ): Promise<PromotionEntity | null> {
    const existing = await this.findOne(id, businessId);
    if (!existing) return null;

    Object.assign(existing, patch);
    await this.repo.save(existing);
    return existing;
  }

  async remove(id: string, businessId: string): Promise<void> {
    await this.repo.delete({ id, businessId });
  }

  async findAllActive(businessId: string): Promise<PromotionEntity[]> {
    return this.repo.find({
      where: { businessId, status: "active" },
      order: { createdAt: "DESC" },
    });
  }
}