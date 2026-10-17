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
import { ProductServiceService } from "./product-service.service";
import type { UserEntity } from "../auth/user.entity";
import type {
  ProductServiceStatus,
  ProductAttributes,
} from "./product-service.entity";

@Controller("products-services")
@UseGuards(ClerkAuthGuard)
export class ProductServiceController {
  constructor(
    private readonly service: ProductServiceService,
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
      price: number;
      description?: string;
      category?: string;
      status?: ProductServiceStatus;
      attributes?: ProductAttributes;
    },
  ) {
    const businessId = await this.resolveBusinessId(req);

    const name = (body?.name ?? "").trim();
    const price = Number(body?.price);

    if (!name) throw new BadRequestException("name is required");
    if (!Number.isFinite(price) || price < 0) {
      throw new BadRequestException("price must be a non-negative number");
    }

    return this.service.create(businessId, {
      name,
      price,
      description: body.description,
      category: body.category,
      status: body.status,
      attributes: body.attributes,
    });
  }

  @Patch(":id")
  async update(
    @Req() req: Request,
    @Param("id") id: string,
    @Body()
    body: Partial<{
      name: string;
      price: number;
      description: string;
      category: string;
      status: ProductServiceStatus;
      attributes: ProductAttributes | null;
    }>,
  ) {
    const businessId = await this.resolveBusinessId(req);

    const patch: typeof body = {};
    if (typeof body.name === "string") patch.name = body.name.trim();
    if (body.price !== undefined) {
      const price = Number(body.price);
      if (!Number.isFinite(price) || price < 0) {
        throw new BadRequestException("price must be a non-negative number");
      }
      patch.price = price;
    }
    if (typeof body.description === "string")
      patch.description = body.description;
    if (typeof body.category === "string") patch.category = body.category;
    if (body.status === "active" || body.status === "inactive")
      patch.status = body.status;
    if (body.attributes !== undefined) patch.attributes = body.attributes;

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