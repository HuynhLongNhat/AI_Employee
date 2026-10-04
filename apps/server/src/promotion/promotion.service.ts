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

  async create(data: {
    name: string;
    description?: string;
    keywords?: string[];
    condition?: string;
    discount?: string;
    scope?: PromotionScope;
    productIds?: string[];
    status?: PromotionStatus;
  }): Promise<PromotionEntity> {
    return this.repo.save({
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

  async findAll(): Promise<PromotionEntity[]> {
    return this.repo.find({ order: { createdAt: "DESC" } });
  }

  async findOne(id: string): Promise<PromotionEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  async update(
    id: string,
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
    await this.repo.update(id, patch);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async findAllActive(): Promise<PromotionEntity[]> {
    return this.repo.find({
      where: { status: "active" },
      order: { createdAt: "DESC" },
    });
  }
}