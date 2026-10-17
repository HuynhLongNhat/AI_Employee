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
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import { ClerkAuthGuard } from "../auth/clerk-auth.guard";
import { BusinessService } from "../business/business.service";
import { FaqService } from "./faq.service";
import type { UserEntity } from "../auth/user.entity";
import type { FaqStatus } from "./faq.entity";

@Controller("faqs")
@UseGuards(ClerkAuthGuard)
export class FaqController {
  constructor(
    private readonly service: FaqService,
    private readonly businessService: BusinessService,
  ) {}

  private async resolveBusinessId(req: Request): Promise<string> {
    const user = (req as any).user as UserEntity;
    const headerId = req.headers["x-business-id"] as string | undefined;

    if (headerId) {
      const biz = await this.businessService.findOne(headerId);
      if (biz && biz.ownerUserId === user.id) return biz.id;
    }

    const list = await this.businessService.findByOwner(user.id);
    if (list.length > 0) return list[0].id;

    throw new BadRequestException("User không có business nào.");
  }

  @Get()
  async list(@Req() req: Request) {
    const businessId = await this.resolveBusinessId(req);
    return this.service.findAll(businessId);
  }

  @Get(":id")
  async detail(@Req() req: Request, @Param("id") id: string) {
    const businessId = await this.resolveBusinessId(req);
    const item = await this.service.findOne(id, businessId);
    if (!item) throw new NotFoundException();
    return item;
  }

  @Post()
  async create(
    @Req() req: Request,
    @Body()
    body: { question: string; answer: string; status?: FaqStatus },
  ) {
    const businessId = await this.resolveBusinessId(req);

    const question = (body?.question ?? "").trim();
    const answer = (body?.answer ?? "").trim();

    if (!question) throw new BadRequestException("question is required");
    if (!answer) throw new BadRequestException("answer is required");

    return this.service.create(businessId, {
      question,
      answer,
      status: body.status,
    });
  }

  @Patch(":id")
  async update(
    @Req() req: Request,
    @Param("id") id: string,
    @Body()
    body: Partial<{
      question: string;
      answer: string;
      status: FaqStatus;
    }>,
  ) {
    const businessId = await this.resolveBusinessId(req);

    const patch: typeof body = {};
    if (typeof body.question === "string") patch.question = body.question.trim();
    if (typeof body.answer === "string") patch.answer = body.answer.trim();
    if (body.status === "active" || body.status === "inactive")
      patch.status = body.status;

    const updated = await this.service.update(id, businessId, patch);
    if (!updated) throw new NotFoundException();
    return updated;
  }

  @Delete(":id")
  async remove(@Req() req: Request, @Param("id") id: string) {
    const businessId = await this.resolveBusinessId(req);
    const existing = await this.service.findOne(id, businessId);
    if (!existing) throw new NotFoundException();
    await this.service.remove(id, businessId);
    return { ok: true };
  }
}