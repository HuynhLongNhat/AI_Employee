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

  async create(data: {
    question: string;
    answer: string;
    status?: FaqStatus;
  }): Promise<FaqEntity> {
    return this.repo.save({
      question: data.question.trim(),
      answer: data.answer.trim(),
      status: data.status ?? "active",
    });
  }

  async findAll(): Promise<FaqEntity[]> {
    return this.repo.find({ order: { createdAt: "DESC" } });
  }

  async findOne(id: string): Promise<FaqEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  async update(
    id: string,
    patch: Partial<{
      question: string;
      answer: string;
      status: FaqStatus;
    }>,
  ): Promise<FaqEntity | null> {
    await this.repo.update(id, patch);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async findAllActive(): Promise<FaqEntity[]> {
    return this.repo.find({
      where: { status: "active" },
      order: { createdAt: "DESC" },
    });
  }
}