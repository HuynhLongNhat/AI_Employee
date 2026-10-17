import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PolicyEntity, PolicyStatus } from "./policy.entity";

@Injectable()
export class PolicyService {
  constructor(
    @InjectRepository(PolicyEntity)
    private readonly repo: Repository<PolicyEntity>,
  ) {}

  async create(
    businessId: string,
    data: { title: string; content: string; status?: PolicyStatus },
  ): Promise<PolicyEntity> {
    return this.repo.save({
      businessId,
      title: data.title.trim(),
      content: data.content.trim(),
      status: data.status ?? "active",
    });
  }

  async findAll(businessId: string): Promise<PolicyEntity[]> {
    return this.repo.find({
      where: { businessId },
      order: { createdAt: "DESC" },
    });
  }

  async findOne(id: string, businessId: string): Promise<PolicyEntity | null> {
    return this.repo.findOne({ where: { id, businessId } });
  }

  async update(
    id: string,
    businessId: string,
    patch: Partial<{ title: string; content: string; status: PolicyStatus }>,
  ): Promise<PolicyEntity | null> {
    const existing = await this.findOne(id, businessId);
    if (!existing) return null;

    Object.assign(existing, patch);
    await this.repo.save(existing);
    return existing;
  }

  async remove(id: string, businessId: string): Promise<void> {
    await this.repo.delete({ id, businessId });
  }

  async findAllActive(businessId: string): Promise<PolicyEntity[]> {
    return this.repo.find({
      where: { businessId, status: "active" },
      order: { createdAt: "DESC" },
    });
  }
}