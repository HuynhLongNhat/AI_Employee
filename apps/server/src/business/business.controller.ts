import { Controller, Get, Param, NotFoundException, Req, UseGuards, Post, Body, Delete, Patch } from "@nestjs/common";
import { BusinessService } from "./business.service";
import { ClerkAuthGuard } from "../auth/clerk-auth.guard";
import { UserEntity } from "../auth/user.entity";

@Controller("businesses")
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  // 1. ROUTE PUBLIC: BẮT BUỘC KHÔNG CÓ @UseGuards và phải nằm TRÊN CÙNG
  @Get("public/:slug")
  async getPublicBusiness(@Param("slug") slug: string) {
    const biz = await this.businessService.findBySlug(slug);
    if (!biz) {
      throw new NotFoundException("Doanh nghiệp không tồn tại hoặc đã ngừng hoạt động.");
    }
    return { 
      id: biz.id, 
      name: biz.name, 
      industry: biz.industry 
    };
  }

  // 2. CÁC ROUTE PRIVATE: Có @UseGuards và nằm DƯỚI
  @Get("me")
  @UseGuards(ClerkAuthGuard)
  async myBusinesses(@Req() req: Request) {
    const user = (req as any).user as UserEntity;
    return this.businessService.findByOwner(user.id);
  }

  @Post()
  @UseGuards(ClerkAuthGuard)
  async create(
    @Req() req: Request,
    @Body() body: { name: string; industry?: string },
  ) {
    const user = (req as any).user as UserEntity;
    return this.businessService.create(user.id, body);
  }

   @Patch(":id")
  @UseGuards(ClerkAuthGuard)
  async update(
    @Param("id") id: string,
    @Req() req: Request,
    @Body() body: { name?: string; industry?: string },
  ) {
    const user = (req as any).user as UserEntity;
    const updated = await this.businessService.update(id, user.id, body);
    if (!updated) throw new NotFoundException("Không tìm thấy hoặc không có quyền.");
    return updated;
  }

  @Delete(":id")
  @UseGuards(ClerkAuthGuard)
  async remove(@Param("id") id: string, @Req() req: Request) {
    const user = (req as any).user as UserEntity;
    const success = await this.businessService.remove(id, user.id);
    if (!success) throw new NotFoundException("Không tìm thấy hoặc không có quyền.");
    return { ok: true };
  }
}