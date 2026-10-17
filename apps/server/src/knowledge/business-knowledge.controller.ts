import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import { ClerkAuthGuard } from "../auth/clerk-auth.guard";
import { BusinessService } from "../business/business.service";
import { BusinessKnowledgeService } from "./business-knowledge.service";
import type { UserEntity } from "../auth/user.entity";

@Controller("business-knowledge")
@UseGuards(ClerkAuthGuard)
export class BusinessKnowledgeController {
  constructor(
    private readonly service: BusinessKnowledgeService,
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

  @Get("opening-hours")
  async getOpeningHours(@Req() req: Request) {
    const businessId = await this.resolveBusinessId(req);
    return { openingHours: await this.service.getOpeningHours(businessId) };
  }

  @Post("opening-hours")
  async setOpeningHours(
    @Req() req: Request,
    @Body() body: { openingHours: string },
  ) {
    const businessId = await this.resolveBusinessId(req);
    const value = (body?.openingHours ?? "").trim();
    if (!value) return { ok: false, error: "openingHours is required" };
    await this.service.setOpeningHours(businessId, value);
    return { ok: true, openingHours: value };
  }

  @Get("business-name")
  async getBusinessName(@Req() req: Request) {
    const businessId = await this.resolveBusinessId(req);
    return { businessName: await this.service.getBusinessName(businessId) };
  }

  @Post("business-name")
  async setBusinessName(
    @Req() req: Request,
    @Body() body: { businessName: string },
  ) {
    const businessId = await this.resolveBusinessId(req);
    const value = (body?.businessName ?? "").trim();
    if (!value) return { ok: false, error: "businessName is required" };
    await this.service.setBusinessName(businessId, value);
    return { ok: true, businessName: value };
  }

  @Get("address")
  async getAddress(@Req() req: Request) {
    const businessId = await this.resolveBusinessId(req);
    return { address: await this.service.getAddress(businessId) };
  }

  @Post("address")
  async setAddress(
    @Req() req: Request,
    @Body() body: { address: string },
  ) {
    const businessId = await this.resolveBusinessId(req);
    const value = (body?.address ?? "").trim();
    if (!value) return { ok: false, error: "address is required" };
    await this.service.setAddress(businessId, value);
    return { ok: true, address: value };
  }

  @Get("phone")
  async getPhone(@Req() req: Request) {
    const businessId = await this.resolveBusinessId(req);
    return { phone: await this.service.getPhone(businessId) };
  }

  @Post("phone")
  async setPhone(@Req() req: Request, @Body() body: { phone: string }) {
    const businessId = await this.resolveBusinessId(req);
    const value = (body?.phone ?? "").trim();
    if (!value) return { ok: false, error: "phone is required" };
    await this.service.setPhone(businessId, value);
    return { ok: true, phone: value };
  }

  @Get("wifi-name")
  async getWifiName(@Req() req: Request) {
    const businessId = await this.resolveBusinessId(req);
    return { wifiName: await this.service.getWifiName(businessId) };
  }

  @Post("wifi-name")
  async setWifiName(
    @Req() req: Request,
    @Body() body: { wifiName: string },
  ) {
    const businessId = await this.resolveBusinessId(req);
    const value = (body?.wifiName ?? "").trim();
    if (!value) return { ok: false, error: "wifiName is required" };
    await this.service.setWifiName(businessId, value);
    return { ok: true, wifiName: value };
  }

  @Get("wifi-password")
  async getWifiPassword(@Req() req: Request) {
    const businessId = await this.resolveBusinessId(req);
    return { wifiPassword: await this.service.getWifiPassword(businessId) };
  }

  @Post("wifi-password")
  async setWifiPassword(
    @Req() req: Request,
    @Body() body: { wifiPassword: string },
  ) {
    const businessId = await this.resolveBusinessId(req);
    const value = (body?.wifiPassword ?? "").trim();
    if (!value) return { ok: false, error: "wifiPassword is required" };
    await this.service.setWifiPassword(businessId, value);
    return { ok: true, wifiPassword: value };
  }

  @Get("business-profile")
  async getBusinessProfile(@Req() req: Request) {
    const businessId = await this.resolveBusinessId(req);
    return this.service.getBusinessProfile(businessId);
  }

  @Post("business-profile")
  async setBusinessProfile(
    @Req() req: Request,
    @Body()
    body: {
      industry?: string;
      terminology?: {
        businessTerm?: string;
        customerTerm?: string;
        productTerm?: string;
      };
    },
  ) {
    const businessId = await this.resolveBusinessId(req);
    await this.service.setBusinessProfile(businessId, body ?? {});
    return { ok: true };
  }

  @Get("ai-config")
  async getAiConfig(@Req() req: Request) {
    const businessId = await this.resolveBusinessId(req);
    return this.service.getAiConfig(businessId);
  }

  @Post("ai-config")
  async setAiConfig(
    @Req() req: Request,
    @Body()
    body: {
      name?: string;
      role?: string;
      style?: string;
      permissions?: {
        canAdvise: boolean;
        canPlaceOrder: boolean;
        canHandleIssue: boolean;
      };
    },
  ) {
    const businessId = await this.resolveBusinessId(req);
    await this.service.setAiConfig(businessId, body ?? {});
    return { ok: true };
  }

  @Delete(":key")
  async deleteKey(@Req() req: Request, @Param("key") key: string) {
    const businessId = await this.resolveBusinessId(req);
    await this.service.delete(businessId, key);
    return { ok: true };
  }
}