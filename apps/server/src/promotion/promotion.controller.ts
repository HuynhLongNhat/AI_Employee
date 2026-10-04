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
import { PromotionService } from "./promotion.service";
import type {
  PromotionScope,
  PromotionStatus,
} from "./promotion.entity";

@Controller("promotions")
export class PromotionController {
  constructor(private readonly service: PromotionService) {}

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
    const name = (body?.name ?? "").trim();
    if (!name) throw new BadRequestException("name is required");

    return this.service.create({
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
    const existing = await this.service.findOne(id);
    if (!existing) throw new NotFoundException();

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