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
import { PolicyService } from "./policy.service";
import type { UserEntity } from "../auth/user.entity";
import type { PolicyStatus } from "./policy.entity";

@Controller("policies")
@UseGuards(ClerkAuthGuard)
export class PolicyController {
  constructor(
    private readonly service: PolicyService,
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
    body: { title: string; content: string; status?: PolicyStatus },
  ) {
    const businessId = await this.resolveBusinessId(req);

    const title = (body?.title ?? "").trim();
    const content = (body?.content ?? "").trim();

    if (!title) throw new BadRequestException("title is required");
    if (!content) throw new BadRequestException("content is required");

    return this.service.create(businessId, {
      title,
      content,
      status: body.status,
    });
  }

  @Patch(":id")
  async update(
    @Req() req: Request,
    @Param("id") id: string,
    @Body()
    body: Partial<{
      title: string;
      content: string;
      status: PolicyStatus;
    }>,
  ) {
    const businessId = await this.resolveBusinessId(req);

    const patch: typeof body = {};
    if (typeof body.title === "string") patch.title = body.title.trim();
    if (typeof body.content === "string") patch.content = body.content.trim();
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