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
import { PromotionService } from "./promotion.service";
import type { UserEntity } from "../auth/user.entity";
import type {
  PromotionScope,
  PromotionStatus,
} from "./promotion.entity";

@Controller("promotions")
@UseGuards(ClerkAuthGuard)
export class PromotionController {
  constructor(
    private readonly service: PromotionService,
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
    body: {
      name: string;
      description?: string;
      keywords?: string[];
      condition?: string;
      discount?: string;
      scope?: PromotionScope;
      productIds?: string[];
      status?: PromotionStatus;
    },
  ) {
    const businessId = await this.resolveBusinessId(req);

    const name = (body?.name ?? "").trim();
    if (!name) throw new BadRequestException("name is required");

    return this.service.create(businessId, {
      name,
      description: body.description,
      keywords: Array.isArray(body.keywords) ? body.keywords : [],
      condition: body.condition,
      discount: body.discount,
      scope: body.scope,
      productIds: Array.isArray(body.productIds) ? body.productIds : [],
      status: body.status,
    });
  }

  @Patch(":id")
  async update(
    @Req() req: Request,
    @Param("id") id: string,
    @Body()
    body: Partial<{
      name: string;
      description: string;
      keywords: string[];
      condition: string;
      discount: string;
      scope: PromotionScope;
      productIds: string[];
      status: PromotionStatus;
    }>,
  ) {
    const businessId = await this.resolveBusinessId(req);

    const patch: typeof body = {};
    if (typeof body.name === "string") patch.name = body.name.trim();
    if (typeof body.description === "string")
      patch.description = body.description;
    if (Array.isArray(body.keywords)) patch.keywords = body.keywords;
    if (typeof body.condition === "string") patch.condition = body.condition;
    if (typeof body.discount === "string") patch.discount = body.discount;
    if (body.scope === "all" || body.scope === "product")
      patch.scope = body.scope;
    if (Array.isArray(body.productIds)) patch.productIds = body.productIds;
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