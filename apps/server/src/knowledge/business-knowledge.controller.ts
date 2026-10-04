import { Body, Controller, Get, Post } from "@nestjs/common";
import { BusinessKnowledgeService } from "./business-knowledge.service";

@Controller("business-knowledge")
export class BusinessKnowledgeController {
  constructor(private readonly service: BusinessKnowledgeService) {}

  @Get("opening-hours")
  async getOpeningHours() {
    return { openingHours: await this.service.getOpeningHours() };
  }

  @Post("opening-hours")
  async setOpeningHours(@Body() body: { openingHours: string }) {
    const value = (body?.openingHours ?? "").trim();
    if (!value) {
      return { ok: false, error: "openingHours is required" };
    }
    await this.service.setOpeningHours(value);
    return { ok: true, openingHours: value };
  }

  @Get("business-name")
  async getBusinessName() {
    return { businessName: await this.service.getBusinessName() };
  }

  @Post("business-name")
  async setBusinessName(@Body() body: { businessName: string }) {
    const value = (body?.businessName ?? "").trim();
    if (!value) {
      return { ok: false, error: "businessName is required" };
    }
    await this.service.setBusinessName(value);
    return { ok: true, businessName: value };
  }

  @Get("address")
  async getAddress() {
    return { address: await this.service.getAddress() };
  }

  @Post("address")
  async setAddress(@Body() body: { address: string }) {
    const value = (body?.address ?? "").trim();
    if (!value) {
      return { ok: false, error: "address is required" };
    }
    await this.service.setAddress(value);
    return { ok: true, address: value };
  }

  @Get("phone")
  async getPhone() {
    return { phone: await this.service.getPhone() };
  }

  @Post("phone")
  async setPhone(@Body() body: { phone: string }) {
    const value = (body?.phone ?? "").trim();
    if (!value) return { ok: false, error: "phone is required" };
    await this.service.setPhone(value);
    return { ok: true, phone: value };
  }

  @Get("wifi-name")
  async getWifiName() {
    return { wifiName: await this.service.getWifiName() };
  }

  @Post("wifi-name")
  async setWifiName(@Body() body: { wifiName: string }) {
    const value = (body?.wifiName ?? "").trim();
    if (!value) return { ok: false, error: "wifiName is required" };
    await this.service.setWifiName(value);
    return { ok: true, wifiName: value };
  }

  @Get("wifi-password")
  async getWifiPassword() {
    return { wifiPassword: await this.service.getWifiPassword() };
  }

  @Post("wifi-password")
  async setWifiPassword(@Body() body: { wifiPassword: string }) {
    const value = (body?.wifiPassword ?? "").trim();
    if (!value) return { ok: false, error: "wifiPassword is required" };
    await this.service.setWifiPassword(value);
    return { ok: true, wifiPassword: value };
  }

  @Get("parking")
  async getParking() {
    return { parking: await this.service.getParking() };
  }

  @Post("parking")
  async setParking(@Body() body: { parking: string }) {
    const value = (body?.parking ?? "").trim();
    if (!value) return { ok: false, error: "parking is required" };
    await this.service.setParking(value);
    return { ok: true, parking: value };
  }
  @Get("policies")
  async getPolicies() {
    return this.service.getPolicies();
  }

  @Post("policies")
  async setPolicies(
    @Body()
    body: {
      order?: string;
      delivery?: string;
      payment?: string;
      cancel?: string;
      refund?: string;
    },
  ) {
    await this.service.setPolicies(body ?? {});
    return { ok: true };
  }

  @Get("ai-config")
  async getAiConfig() {
    return this.service.getAiConfig();
  }

  @Post("ai-config")
  async setAiConfig(
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
    await this.service.setAiConfig(body ?? {});
    return { ok: true };
  }
}
