import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  ProductServiceEntity,
  ProductServiceStatus,
  ProductAttributes,
} from "./product-service.entity";

@Injectable()
export class ProductServiceService {
  constructor(
    @InjectRepository(ProductServiceEntity)
    private readonly repo: Repository<ProductServiceEntity>,
  ) {}

  async create(
    businessId: string,
    data: {
      name: string;
      price: number;
      description?: string;
      category?: string;
      status?: ProductServiceStatus;
      attributes?: ProductAttributes;
    },
  ): Promise<ProductServiceEntity> {
    return this.repo.save({
      businessId,
      name: data.name.trim(),
      price: data.price,
      description: data.description ?? "",
      category: data.category ?? "",
      status: data.status ?? "active",
      attributes: data.attributes ?? null,
    });
  }

  async findAll(businessId: string): Promise<ProductServiceEntity[]> {
    return this.repo.find({
      where: { businessId },
      order: { createdAt: "DESC" },
    });
  }

  async findOne(
    id: string,
    businessId: string,
  ): Promise<ProductServiceEntity | null> {
    return this.repo.findOne({ where: { id, businessId } });
  }

  async update(
    id: string,
    businessId: string,
    patch: Partial<{
      name: string;
      price: number;
      description: string;
      category: string;
      status: ProductServiceStatus;
      attributes: ProductAttributes | null;
    }>,
  ): Promise<ProductServiceEntity | null> {
    const existing = await this.findOne(id, businessId);
    if (!existing) return null;

    Object.assign(existing, patch);
    await this.repo.save(existing);
    return existing;
  }

  async remove(id: string, businessId: string): Promise<void> {
    await this.repo.delete({ id, businessId });
  }

  async findAllActive(businessId: string): Promise<ProductServiceEntity[]> {
    return this.repo.find({
      where: { businessId, status: "active" },
      order: { createdAt: "DESC" },
    });
  }
}