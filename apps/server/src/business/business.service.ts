import { Injectable, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Repository } from "typeorm";
import { BusinessEntity } from "./business.entity";
import { PromotionEntity } from "../promotion/promotion.entity";
import { FaqEntity } from "../faq/faq.entity";
import { PolicyEntity } from "../policy/policy.entity";
import { ProductServiceEntity } from "../product/product-service.entity";

@Injectable()
export class BusinessService implements OnModuleInit {
  constructor(
    @InjectRepository(BusinessEntity)
    private readonly repo: Repository<BusinessEntity>,
    @InjectRepository(ProductServiceEntity)
    private readonly productRepo: Repository<ProductServiceEntity>,
    @InjectRepository(PromotionEntity)
    private readonly promotionRepo: Repository<PromotionEntity>,
    @InjectRepository(FaqEntity)
    private readonly faqRepo: Repository<FaqEntity>,
    @InjectRepository(PolicyEntity)
    private readonly policyRepo: Repository<PolicyEntity>,
  ) {}

  async onModuleInit() {
    await this.migrateLegacyData();
    await this.migrateSlugs(); // Thêm logic migration slug
  }

  // ===== Helper sinh slug an toàn =====
  private generateSlug(name: string): string {
    const base = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return base || "business";
  }

  // ===== Migration: Gán slug cho các business cũ chưa có =====
  private async migrateSlugs() {
    const businesses = await this.repo.find({ where: { slug: IsNull() } });
    let count = 0;

    for (const biz of businesses) {
      let baseSlug = this.generateSlug(biz.name);
      let uniqueSlug = baseSlug;
      let suffix = 1;

      // Đảm bảo slug không trùng với business khác
      while (await this.repo.findOne({ where: { slug: uniqueSlug } })) {
        uniqueSlug = `${baseSlug}-${suffix}`;
        suffix++;
      }

      biz.slug = uniqueSlug;
      await this.repo.save(biz);
      count++;
    }

    if (count > 0) {
      console.log(`[Business] Migrated slug for ${count} businesses.`);
    }
  }

  // ===== Migration: Data cũ (giữ nguyên như trước) =====
  private async migrateLegacyData() {
    const [firstBiz] = await this.repo.find({ order: { createdAt: "ASC" }, take: 1 });
    if (!firstBiz) return;

    const results = await Promise.all([
      this.productRepo.update({ businessId: IsNull() }, { businessId: firstBiz.id }),
      this.promotionRepo.update({ businessId: IsNull() }, { businessId: firstBiz.id }),
      this.faqRepo.update({ businessId: IsNull() }, { businessId: firstBiz.id }),
      this.policyRepo.update({ businessId: IsNull() }, { businessId: firstBiz.id }),
    ]);

    const total = results.reduce((sum, r) => sum + (r.affected ?? 0), 0);
    if (total > 0) {
      console.log(`[Business] Migrated ${total} legacy rows to business ${firstBiz.id}`);
    }
  }

  // ===== Sửa hàm tạo Business để tự sinh slug =====
  async create(
    ownerUserId: string,
    data: { name: string; industry?: string },
  ): Promise<BusinessEntity> {
    const name = data.name.trim() || "My Business";
    let baseSlug = this.generateSlug(name);
    let uniqueSlug = baseSlug;
    let suffix = 1;

    // Đảm bảo slug unique
    while (await this.repo.findOne({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${baseSlug}-${suffix}`;
      suffix++;
    }

    return this.repo.save({
      ownerUserId,
      name,
      industry: data.industry?.trim() ?? "",
      slug: uniqueSlug,
    });
  }

  // ===== Sửa hàm ensureDefaultBusiness (Lazy create) =====
  async findByOwner(ownerUserId: string): Promise<BusinessEntity[]> {
    let existing = await this.repo.find({
      where: { ownerUserId },
      order: { createdAt: "ASC" },
    });

    if (existing.length === 0) {
      // Tự tạo business mặc định nếu user chưa có
      const created = await this.create(ownerUserId, { name: "My Business" });
      existing = [created];
    }

    return existing;
  }

  async findOne(id: string): Promise<BusinessEntity | null> {
    return this.repo.findOne({ where: { id } });
  }
  
   async findBySlug(slug: string): Promise<BusinessEntity | null> {
    return this.repo.findOne({ where: { slug } });
  }

  async getDefaultBusiness(): Promise<BusinessEntity | null> {
    const [first] = await this.repo.find({ order: { createdAt: "ASC" }, take: 1 });
    return first ?? null;
  }

    async update(
    id: string,
    ownerUserId: string,
    data: { name?: string; industry?: string },
  ): Promise<BusinessEntity | null> {
    const biz = await this.findOne(id);
    if (!biz || biz.ownerUserId !== ownerUserId) return null;

    if (data.name && data.name.trim()) {
      biz.name = data.name.trim();
      // Không đổi slug để giữ nguyên link public cho khách
    }
    if (data.industry !== undefined) {
      biz.industry = data.industry.trim();
    }

    return this.repo.save(biz);
  }

  async remove(id: string, ownerUserId: string): Promise<boolean> {
    const biz = await this.findOne(id);
    if (!biz || biz.ownerUserId !== ownerUserId) return false;
    
    await this.repo.delete(id);
    return true;
  }
}