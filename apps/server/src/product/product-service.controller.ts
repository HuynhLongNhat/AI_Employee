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
import { ProductServiceService } from "./product-service.service";
import type { ProductServiceStatus } from "./product-service.entity";

@Controller("products-services")
export class ProductServiceController {
  constructor(private readonly service: ProductServiceService) {}

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
      price: number;
      description?: string;
      category?: string;
      status?: ProductServiceStatus;
    },
  ) {
    const name = (body?.name ?? "").trim();
    const price = Number(body?.price);

    if (!name) throw new BadRequestException("name is required");
    if (!Number.isFinite(price) || price < 0) {
      throw new BadRequestException("price must be a non-negative number");
    }

    return this.service.create({
      name,
      price,
      description: body.description,
      category: body.category,
      status: body.status,
    });
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body()
    body: Partial<{
      name: string;
      price: number;
      description: string;
      category: string;
      status: ProductServiceStatus;
    }>,
  ) {
    const existing = await this.service.findOne(id);
    if (!existing) throw new NotFoundException();

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
    if (body.status === "active" || body.status === "inactive") {
      patch.status = body.status;
    }

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