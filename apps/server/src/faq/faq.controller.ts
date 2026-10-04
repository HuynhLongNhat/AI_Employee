import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { FaqService } from "./faq.service";
import type { FaqStatus } from "./faq.entity";

@Controller("faqs")
export class FaqController {
  constructor(private readonly service: FaqService) {}

  @Get()
  async list() {
    return this.service.findAll();
  }

  @Get(":id")
  async detail(@Param("id") id: string) {
    const item = await this.service.findOne(id);
    if (!item) throw new NotFoundException();
    return item;
  }

  @Post()
  async create(
    @Body()
    body: { question: string; answer: string; status?: FaqStatus },
  ) {
    const question = (body?.question ?? "").trim();
    const answer = (body?.answer ?? "").trim();

    if (!question) throw new BadRequestException("question is required");
    if (!answer) throw new BadRequestException("answer is required");

    return this.service.create({ question, answer, status: body.status });
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body()
    body: Partial<{
      question: string;
      answer: string;
      status: FaqStatus;
    }>,
  ) {
    const existing = await this.service.findOne(id);
    if (!existing) throw new NotFoundException();

    const patch: typeof body = {};
    if (typeof body.question === "string") patch.question = body.question.trim();
    if (typeof body.answer === "string") patch.answer = body.answer.trim();
    if (body.status === "active" || body.status === "inactive")
      patch.status = body.status;

    return this.service.update(id, patch);
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    const existing = await this.service.findOne(id);
    if (!existing) throw new NotFoundException();
    await this.service.remove(id);
    return { ok: true };
  }
}