import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { BusinessKnowledgeEntity } from "./business-knowledge.entity";

export const KNOWLEDGE_KEY_OPENING_HOURS = "openingHours";
export const KNOWLEDGE_KEY_BUSINESS_NAME = "businessName";
export const KNOWLEDGE_KEY_ADDRESS = "address";
export const KNOWLEDGE_KEY_PHONE = "phone";
export const KNOWLEDGE_KEY_WIFI_NAME = "wifiName";
export const KNOWLEDGE_KEY_WIFI_PASSWORD = "wifiPassword";
export const KNOWLEDGE_KEY_PARKING = "parking";
export const KNOWLEDGE_KEY_POLICY_ORDER = "policy.order";
export const KNOWLEDGE_KEY_POLICY_DELIVERY = "policy.delivery";
export const KNOWLEDGE_KEY_POLICY_PAYMENT = "policy.payment";
export const KNOWLEDGE_KEY_POLICY_CANCEL = "policy.cancel";
export const KNOWLEDGE_KEY_POLICY_REFUND = "policy.refund";
export const KNOWLEDGE_KEY_AI_NAME = "ai.name";
export const KNOWLEDGE_KEY_AI_ROLE = "ai.role";
export const KNOWLEDGE_KEY_AI_STYLE = "ai.style";
export const KNOWLEDGE_KEY_AI_PERMISSIONS = "ai.permissions";

@Injectable()
export class BusinessKnowledgeService {
  constructor(
    @InjectRepository(BusinessKnowledgeEntity)
    private readonly repo: Repository<BusinessKnowledgeEntity>,
  ) {}

  async get(key: string): Promise<string | null> {
    const row = await this.repo.findOne({ where: { knowledgeKey: key } });
    return row?.value ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    await this.repo.save({ knowledgeKey: key, value });
  }

  async getOpeningHours(): Promise<string | null> {
    return this.get(KNOWLEDGE_KEY_OPENING_HOURS);
  }

  async setOpeningHours(value: string): Promise<void> {
    await this.set(KNOWLEDGE_KEY_OPENING_HOURS, value);
  }

  async getBusinessName(): Promise<string | null> {
    return this.get(KNOWLEDGE_KEY_BUSINESS_NAME);
  }

  async setBusinessName(value: string): Promise<void> {
    await this.set(KNOWLEDGE_KEY_BUSINESS_NAME, value);
  }

  async getAddress(): Promise<string | null> {
    return this.get(KNOWLEDGE_KEY_ADDRESS);
  }

  async setAddress(value: string): Promise<void> {
    await this.set(KNOWLEDGE_KEY_ADDRESS, value);
  }

  async getPhone(): Promise<string | null> {
    return this.get(KNOWLEDGE_KEY_PHONE);
  }

  async setPhone(value: string): Promise<void> {
    await this.set(KNOWLEDGE_KEY_PHONE, value);
  }

  async getWifiName(): Promise<string | null> {
    return this.get(KNOWLEDGE_KEY_WIFI_NAME);
  }

  async setWifiName(value: string): Promise<void> {
    await this.set(KNOWLEDGE_KEY_WIFI_NAME, value);
  }

  async getWifiPassword(): Promise<string | null> {
    return this.get(KNOWLEDGE_KEY_WIFI_PASSWORD);
  }

  async setWifiPassword(value: string): Promise<void> {
    await this.set(KNOWLEDGE_KEY_WIFI_PASSWORD, value);
  }

  async getParking(): Promise<string | null> {
    return this.get(KNOWLEDGE_KEY_PARKING);
  }

  async setParking(value: string): Promise<void> {
    await this.set(KNOWLEDGE_KEY_PARKING, value);
  }

  async getPolicies(): Promise<{
    order: string | null;
    delivery: string | null;
    payment: string | null;
    cancel: string | null;
    refund: string | null;
  }> {
    const [order, delivery, payment, cancel, refund] = await Promise.all([
      this.get(KNOWLEDGE_KEY_POLICY_ORDER),
      this.get(KNOWLEDGE_KEY_POLICY_DELIVERY),
      this.get(KNOWLEDGE_KEY_POLICY_PAYMENT),
      this.get(KNOWLEDGE_KEY_POLICY_CANCEL),
      this.get(KNOWLEDGE_KEY_POLICY_REFUND),
    ]);
    return { order, delivery, payment, cancel, refund };
  }

  async setPolicies(data: {
    order?: string;
    delivery?: string;
    payment?: string;
    cancel?: string;
    refund?: string;
  }): Promise<void> {
    const entries: [string, string | undefined][] = [
      [KNOWLEDGE_KEY_POLICY_ORDER, data.order],
      [KNOWLEDGE_KEY_POLICY_DELIVERY, data.delivery],
      [KNOWLEDGE_KEY_POLICY_PAYMENT, data.payment],
      [KNOWLEDGE_KEY_POLICY_CANCEL, data.cancel],
      [KNOWLEDGE_KEY_POLICY_REFUND, data.refund],
    ];
    for (const [key, value] of entries) {
      if (typeof value === "string") {
        await this.set(key, value.trim());
      }
    }
  }

  async getAiConfig(): Promise<{
    name: string | null;
    role: string | null;
    style: string | null;
    permissions: {
      canAdvise: boolean;
      canPlaceOrder: boolean;
      canHandleIssue: boolean;
    } | null;
  }> {
    const [name, role, style, permissionsRaw] = await Promise.all([
      this.get(KNOWLEDGE_KEY_AI_NAME),
      this.get(KNOWLEDGE_KEY_AI_ROLE),
      this.get(KNOWLEDGE_KEY_AI_STYLE),
      this.get(KNOWLEDGE_KEY_AI_PERMISSIONS),
    ]);

    let permissions: {
      canAdvise: boolean;
      canPlaceOrder: boolean;
      canHandleIssue: boolean;
    } | null = null;

    if (permissionsRaw) {
      try {
        const parsed = JSON.parse(permissionsRaw);
        permissions = {
          canAdvise: !!parsed.canAdvise,
          canPlaceOrder: !!parsed.canPlaceOrder,
          canHandleIssue: !!parsed.canHandleIssue,
        };
      } catch {
        permissions = null;
      }
    }

    return { name, role, style, permissions };
  }

  async setAiConfig(data: {
    name?: string;
    role?: string;
    style?: string;
    permissions?: {
      canAdvise: boolean;
      canPlaceOrder: boolean;
      canHandleIssue: boolean;
    };
  }): Promise<void> {
    if (typeof data.name === "string") {
      await this.set(KNOWLEDGE_KEY_AI_NAME, data.name.trim());
    }
    if (typeof data.role === "string") {
      await this.set(KNOWLEDGE_KEY_AI_ROLE, data.role.trim());
    }
    if (typeof data.style === "string") {
      await this.set(KNOWLEDGE_KEY_AI_STYLE, data.style.trim());
    }
    if (data.permissions && typeof data.permissions === "object") {
      await this.set(
        KNOWLEDGE_KEY_AI_PERMISSIONS,
        JSON.stringify(data.permissions),
      );
    }
  }
}
