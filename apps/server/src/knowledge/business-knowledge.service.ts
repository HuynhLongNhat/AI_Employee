import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { BusinessKnowledgeEntity } from "./business-knowledge.entity";

export const KNOWLEDGE_KEY_BUSINESS_NAME = "businessName";
export const KNOWLEDGE_KEY_ADDRESS = "address";
export const KNOWLEDGE_KEY_OPENING_HOURS = "openingHours";
export const KNOWLEDGE_KEY_PHONE = "phone";
export const KNOWLEDGE_KEY_WIFI_NAME = "wifiName";
export const KNOWLEDGE_KEY_WIFI_PASSWORD = "wifiPassword";
export const KNOWLEDGE_KEY_INDUSTRY = "business.industry";
export const KNOWLEDGE_KEY_BUSINESS_TERM = "terminology.businessTerm";
export const KNOWLEDGE_KEY_CUSTOMER_TERM = "terminology.customerTerm";
export const KNOWLEDGE_KEY_PRODUCT_TERM = "terminology.productTerm";
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

  async get(businessId: string, key: string): Promise<string | null> {
    const row = await this.repo.findOne({
      where: { businessId, knowledgeKey: key },
    });
    return row?.value ?? null;
  }

  async set(businessId: string, key: string, value: string): Promise<void> {
    const row = await this.repo.findOne({
      where: { businessId, knowledgeKey: key },
    });

    if (row) {
      row.value = value;
      await this.repo.save(row);
    } else {
      await this.repo.save({ businessId, knowledgeKey: key, value });
    }
  }

  // ===== Business info =====

  async getBusinessName(businessId: string): Promise<string | null> {
    return this.get(businessId, KNOWLEDGE_KEY_BUSINESS_NAME);
  }

  async setBusinessName(businessId: string, value: string): Promise<void> {
    return this.set(businessId, KNOWLEDGE_KEY_BUSINESS_NAME, value);
  }

  async getAddress(businessId: string): Promise<string | null> {
    return this.get(businessId, KNOWLEDGE_KEY_ADDRESS);
  }

  async setAddress(businessId: string, value: string): Promise<void> {
    return this.set(businessId, KNOWLEDGE_KEY_ADDRESS, value);
  }

  async getOpeningHours(businessId: string): Promise<string | null> {
    return this.get(businessId, KNOWLEDGE_KEY_OPENING_HOURS);
  }

  async setOpeningHours(businessId: string, value: string): Promise<void> {
    return this.set(businessId, KNOWLEDGE_KEY_OPENING_HOURS, value);
  }

  async getPhone(businessId: string): Promise<string | null> {
    return this.get(businessId, KNOWLEDGE_KEY_PHONE);
  }

  async setPhone(businessId: string, value: string): Promise<void> {
    return this.set(businessId, KNOWLEDGE_KEY_PHONE, value);
  }

  async getWifiName(businessId: string): Promise<string | null> {
    return this.get(businessId, KNOWLEDGE_KEY_WIFI_NAME);
  }

  async setWifiName(businessId: string, value: string): Promise<void> {
    return this.set(businessId, KNOWLEDGE_KEY_WIFI_NAME, value);
  }

  async getWifiPassword(businessId: string): Promise<string | null> {
    return this.get(businessId, KNOWLEDGE_KEY_WIFI_PASSWORD);
  }

  async setWifiPassword(businessId: string, value: string): Promise<void> {
    return this.set(businessId, KNOWLEDGE_KEY_WIFI_PASSWORD, value);
  }

  // ===== Business profile =====

  async getBusinessProfile(businessId: string): Promise<{
    industry: string | null;
    terminology: {
      businessTerm: string | null;
      customerTerm: string | null;
      productTerm: string | null;
    };
  }> {
    const [industry, businessTerm, customerTerm, productTerm] =
      await Promise.all([
        this.get(businessId, KNOWLEDGE_KEY_INDUSTRY),
        this.get(businessId, KNOWLEDGE_KEY_BUSINESS_TERM),
        this.get(businessId, KNOWLEDGE_KEY_CUSTOMER_TERM),
        this.get(businessId, KNOWLEDGE_KEY_PRODUCT_TERM),
      ]);

    return {
      industry,
      terminology: { businessTerm, customerTerm, productTerm },
    };
  }

  async setBusinessProfile(
    businessId: string,
    data: {
      industry?: string;
      terminology?: {
        businessTerm?: string;
        customerTerm?: string;
        productTerm?: string;
      };
    },
  ): Promise<void> {
    if (typeof data.industry === "string") {
      await this.set(businessId, KNOWLEDGE_KEY_INDUSTRY, data.industry.trim());
    }
    if (data.terminology) {
      if (typeof data.terminology.businessTerm === "string") {
        await this.set(
          businessId,
          KNOWLEDGE_KEY_BUSINESS_TERM,
          data.terminology.businessTerm.trim(),
        );
      }
      if (typeof data.terminology.customerTerm === "string") {
        await this.set(
          businessId,
          KNOWLEDGE_KEY_CUSTOMER_TERM,
          data.terminology.customerTerm.trim(),
        );
      }
      if (typeof data.terminology.productTerm === "string") {
        await this.set(
          businessId,
          KNOWLEDGE_KEY_PRODUCT_TERM,
          data.terminology.productTerm.trim(),
        );
      }
    }
  }

  // ===== AI config =====

  async getAiConfig(businessId: string): Promise<{
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
      this.get(businessId, KNOWLEDGE_KEY_AI_NAME),
      this.get(businessId, KNOWLEDGE_KEY_AI_ROLE),
      this.get(businessId, KNOWLEDGE_KEY_AI_STYLE),
      this.get(businessId, KNOWLEDGE_KEY_AI_PERMISSIONS),
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

  async setAiConfig(
    businessId: string,
    data: {
      name?: string;
      role?: string;
      style?: string;
      permissions?: {
        canAdvise: boolean;
        canPlaceOrder: boolean;
        canHandleIssue: boolean;
      };
    },
  ): Promise<void> {
    if (typeof data.name === "string") {
      await this.set(businessId, KNOWLEDGE_KEY_AI_NAME, data.name.trim());
    }
    if (typeof data.role === "string") {
      await this.set(businessId, KNOWLEDGE_KEY_AI_ROLE, data.role.trim());
    }
    if (typeof data.style === "string") {
      await this.set(businessId, KNOWLEDGE_KEY_AI_STYLE, data.style.trim());
    }
    if (data.permissions && typeof data.permissions === "object") {
      await this.set(
        businessId,
        KNOWLEDGE_KEY_AI_PERMISSIONS,
        JSON.stringify(data.permissions),
      );
    }
  }

  // ===== Delete =====

  async delete(businessId: string, key: string): Promise<void> {
    await this.repo.delete({ businessId, knowledgeKey: key });
  }
}