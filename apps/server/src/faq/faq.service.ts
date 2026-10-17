import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { FaqEntity, FaqStatus } from "./faq.entity";

@Injectable()
export class FaqService {
  constructor(
    @InjectRepository(FaqEntity)
    private readonly repo: Repository<FaqEntity>,
  ) {}

  async create(
    businessId: string,
    data: { question: string; answer: string; status?: FaqStatus },
  ): Promise<FaqEntity> {
    return this.repo.save({
      businessId,
      question: data.question.trim(),
      answer: data.answer.trim(),
      status: data.status ?? "active",
    });
  }

  async findAll(businessId: string): Promise<FaqEntity[]> {
    return this.repo.find({
      where: { businessId },
      order: { createdAt: "DESC" },
    });
  }

  async findOne(id: string, businessId: string): Promise<FaqEntity | null> {
    return this.repo.findOne({ where: { id, businessId } });
  }

  async update(
    id: string,
    businessId: string,
    patch: Partial<{ question: string; answer: string; status: FaqStatus }>,
  ): Promise<FaqEntity | null> {
    const existing = await this.findOne(id, businessId);
    if (!existing) return null;

    Object.assign(existing, patch);
    await this.repo.save(existing);
    return existing;
  }

  async remove(id: string, businessId: string): Promise<void> {
    await this.repo.delete({ id, businessId });
  }

  async findAllActive(businessId: string): Promise<FaqEntity[]> {
    return this.repo.find({
      where: { businessId, status: "active" },
      order: { createdAt: "DESC" },
    });
  }
}