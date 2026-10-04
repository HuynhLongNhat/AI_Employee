import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  ProductServiceEntity,
  ProductServiceStatus,
} from "./product-service.entity";

@Injectable()
export class ProductServiceService {
  constructor(
    @InjectRepository(ProductServiceEntity)
    private readonly repo: Repository<ProductServiceEntity>,
  ) {}

  async create(data: {
    name: string;
    price: number;
    description?: string;
    category?: string;
    status?: ProductServiceStatus;
  }): Promise<ProductServiceEntity> {
    return this.repo.save({
      name: data.name.trim(),
      price: data.price,
      description: data.description ?? "",
      category: data.category ?? "",
      status: data.status ?? "active",
    });
  }

  async findAll(): Promise<ProductServiceEntity[]> {
    return this.repo.find({ order: { createdAt: "DESC" } });
  }

  async findOne(id: string): Promise<ProductServiceEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  async update(
    id: string,
    patch: Partial<{
      name: string;
      price: number;
      description: string;
      category: string;
      status: ProductServiceStatus;
    }>,
  ): Promise<ProductServiceEntity | null> {
    await this.repo.update(id, patch);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async findAllActive(): Promise<ProductServiceEntity[]> {
    return this.repo.find({
      where: { status: "active" },
      order: { createdAt: "DESC" },
    });
  }
}